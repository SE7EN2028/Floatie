const windowWrap = document.querySelector('.window-wrap');
const ytPlayer = document.getElementById('yt-player');
const urlInput = document.getElementById('url-input');
const emptyState = document.getElementById('empty-state');
const goBtn = document.getElementById('go-btn');
const topMenu = document.querySelector('.controls-overlay');
const hoverRing = document.getElementById('hover-ring');

windowWrap.classList.add('menu-hidden');

let hoverTimeout;
function showMenu() {
    clearTimeout(hoverTimeout);
    windowWrap.classList.remove('menu-hidden');
}

function hideMenu() {
    hoverTimeout = setTimeout(() => {
        windowWrap.classList.add('menu-hidden');
    }, 3000);
}

hoverRing.addEventListener('mouseenter', showMenu);
topMenu.addEventListener('mouseenter', showMenu);
hoverRing.addEventListener('mouseleave', hideMenu);
topMenu.addEventListener('mouseleave', hideMenu);

let isDragging = false;
let startX, startY;

const dragger = document.getElementById('menu-trigger');

dragger.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        window.electronAPI.moveWindow(e.screenX - startX, e.screenY - startY);
        startX = e.screenX;
        startY = e.screenY;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

function extractYouTubeId(url) {
    try {
        const parsed = new URL(url.trim());
        if (parsed.hostname === 'youtu.be') {
            return parsed.pathname.slice(1).split('?')[0];
        }
        if (parsed.hostname.includes('youtube.com')) {
            if (parsed.pathname === '/watch') {
                return parsed.searchParams.get('v');
            }
            const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
            if (embedMatch) return embedMatch[1];
            const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
            if (shortsMatch) return shortsMatch[1];
        }
    } catch {
        return null;
    }
    return null;
}

ytPlayer.addEventListener('dom-ready', () => {
    const currentUrl = ytPlayer.getURL();
    const isYouTube = currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be');

    if (isYouTube) {
        ytPlayer.executeJavaScript(`
            setInterval(() => {
                const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
                if (skipBtn) skipBtn.click();

                if (document.querySelector('.ad-showing')) {
                    const vid = document.querySelector('video');
                    if (vid) vid.currentTime = vid.duration || 999;
                }

                document.querySelectorAll('.ytp-ad-overlay-container').forEach(b => b.style.display = 'none');
            }, 300);
        `);
    }

    handleYouTubeCSS(currentUrl);
});

let injectedCssKey = null;
function handleYouTubeCSS(url) {
    const isPlayingVideo = url.includes('youtube.com/watch') || url.includes('youtu.be/');
    if (isPlayingVideo) {
        if (!injectedCssKey) {
            ytPlayer.insertCSS(`
                body { background: #000 !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
                #masthead-container, #secondary, #comments, #footer, #related, ytd-watch-metadata, ytd-live-chat-frame { display: none !important; }
                ytd-app, ytd-watch-flexy { background: #000 !important; padding: 0 !important; margin: 0 !important; display: block !important; }
                .html5-video-player { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 99999 !important; }
                video { object-fit: contain !important; object-position: top !important; width: 100vw !important; height: 100vh !important; top: 0 !important; left: 0 !important; }
            `).then(key => injectedCssKey = key);
        }
    } else {
        if (injectedCssKey) {
            ytPlayer.removeInsertedCSS(injectedCssKey);
            injectedCssKey = null;
        }
    }
}

function loadVideo() {
    let url = urlInput.value.trim();
    if (!url) return;

    const videoId = extractYouTubeId(url);
    if (videoId) {
        url = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }
    }

    ytPlayer.src = url;
    ytPlayer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    hideMenu();
}

goBtn.addEventListener('click', loadVideo);

urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loadVideo();
    }
});

document.querySelector('.btn-close').addEventListener('click', () => window.electronAPI.closeWindow());
document.querySelector('.btn-maximize').addEventListener('click', () => window.electronAPI.maximizeWindow());

document.getElementById('back-btn').addEventListener('click', () => {
    if (ytPlayer.canGoBack()) ytPlayer.goBack();
});
document.getElementById('forward-btn').addEventListener('click', () => {
    if (ytPlayer.canGoForward()) ytPlayer.goForward();
});

ytPlayer.addEventListener('did-navigate', (e) => {
    urlInput.value = e.url;
    handleYouTubeCSS(e.url);
});
ytPlayer.addEventListener('did-navigate-in-page', (e) => {
    urlInput.value = e.url;
    handleYouTubeCSS(e.url);
});

let isRatioLocked = false;
const ratioBtn = document.querySelector('.btn-ratio');

ratioBtn.style.opacity = '0.4';
ratioBtn.style.textDecoration = 'line-through';
ratioBtn.title = "Lock to 16:9";

ratioBtn.addEventListener('click', (e) => {
    isRatioLocked = !isRatioLocked;
    window.electronAPI.setRatio(isRatioLocked ? 16 / 9 : 0);

    e.target.style.opacity = isRatioLocked ? '1' : '0.4';
    e.target.style.textDecoration = isRatioLocked ? 'none' : 'line-through';
    e.target.title = isRatioLocked ? "Unlock Aspect Ratio" : "Lock to 16:9";
});
