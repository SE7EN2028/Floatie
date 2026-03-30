const urlInput = document.getElementById('url-input');
const goBtn = document.getElementById('go-btn');
const ytPlayer = document.getElementById('yt-player');
const emptyState = document.getElementById('empty-state');

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

let hoverTimer;
function wakeControls() {
    document.querySelector('.window-wrap').classList.remove('video-playing');
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
        if (document.activeElement !== urlInput) {
            document.querySelector('.window-wrap').classList.add('video-playing');
        }
    }, 2500);
}

document.addEventListener('mousemove', wakeControls);

ytPlayer.addEventListener('dom-ready', () => {
    const currentUrl = ytPlayer.getURL();
    const isYouTube = currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be');

    if (isYouTube) {
        ytPlayer.executeJavaScript(`
            window.onmousemove = () => document.title = 'M' + Date.now();

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
    } else {
        ytPlayer.executeJavaScript(`
            window.onmousemove = () => document.title = 'M' + Date.now();
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
                body { background: #000 !important; overflow: hidden !important; }
                #masthead-container, #secondary, #comments, #footer, #related, ytd-watch-metadata { display: none !important; }
                ytd-app { background: #000 !important; }
                #player { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 9999 !important; }
                video { object-fit: contain !important; }
            `).then(key => injectedCssKey = key);
        }
    } else {
        if (injectedCssKey) {
            ytPlayer.removeInsertedCSS(injectedCssKey);
            injectedCssKey = null;
        }
    }
}

ytPlayer.addEventListener('page-title-updated', wakeControls);

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

    wakeControls();
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

// Set initial visual state for "Free Style"
ratioBtn.style.opacity = '0.4';
ratioBtn.style.textDecoration = 'line-through';
ratioBtn.title = "Lock to 16:9";

ratioBtn.addEventListener('click', (e) => {
    isRatioLocked = !isRatioLocked;
    window.electronAPI.setRatio(isRatioLocked ? 16 / 9 : 0);
    
    // Dim the button slightly and cross it out when unlocked
    e.target.style.opacity = isRatioLocked ? '1' : '0.4';
    e.target.style.textDecoration = isRatioLocked ? 'none' : 'line-through';
    e.target.title = isRatioLocked ? "Unlock Aspect Ratio" : "Lock to 16:9";
});
