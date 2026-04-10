const windowWrap = document.querySelector('.window-wrap');
const ytPlayer = document.getElementById('yt-player');
const urlInput = document.getElementById('url-input');
const emptyState = document.getElementById('empty-state');
const goBtn = document.getElementById('go-btn');
const topMenu = document.querySelector('.controls-overlay');
const hoverRing = document.getElementById('hover-ring');
const dotCluster = document.getElementById('dot-cluster');
const dotClose = document.getElementById('dot-close');
const dotMaximize = document.getElementById('dot-maximize');

windowWrap.classList.add('menu-hidden');

let hoverTimeout;
let isTyping = false;

function showMenu() {
    clearTimeout(hoverTimeout);
    dotCluster.classList.add('typing');
    windowWrap.classList.remove('menu-hidden');
}

function hideMenu() {
    if (isTyping) return;
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
        windowWrap.classList.add('menu-hidden');
        dotCluster.classList.remove('typing');
    }, 2500);
}

function dismissMenu() {
    isTyping = false;
    clearTimeout(hoverTimeout);
    windowWrap.classList.add('menu-hidden');
    dotCluster.classList.remove('typing');
}

hoverRing.addEventListener('mouseenter', showMenu);
hoverRing.addEventListener('mouseleave', hideMenu);

dotCluster.addEventListener('mouseenter', showMenu);
dotCluster.addEventListener('mouseleave', hideMenu);

topMenu.addEventListener('mouseenter', showMenu);
topMenu.addEventListener('mouseleave', hideMenu);

urlInput.addEventListener('input', () => {
    isTyping = urlInput.value.trim().length > 0;
    if (isTyping) showMenu();
    else hideMenu();
});

let isDragging = false;
let offsetX, offsetY;

function startDrag(e) {
    isDragging = true;
    offsetX = e.clientX;
    offsetY = e.clientY;
}

const dragger = document.getElementById('menu-trigger');
const titleBar = document.querySelector('.title-bar');

dragger.addEventListener('mousedown', startDrag);

titleBar.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, input')) return;
    startDrag(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        window.electronAPI.moveWindow(e.screenX - offsetX, e.screenY - offsetY);
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

    let zapperInjected = false;
    const injectZapper = () => {
        if (!currentUrl.includes('youtube.com') && !currentUrl.includes('youtu.be')) return;
        if (zapperInjected) return;

        ytPlayer.executeJavaScript(`
            (function() {
                if (window.__adZapperStarted) return "already results";
                window.__adZapperStarted = true;
                
                setInterval(() => {
                    try {
                        const video = document.querySelector('video');
                        const ad = document.querySelector('.ad-showing, .ad-interrupting');
                        
                        if (ad && video) {
                            video.muted = true;
                            video.playbackRate = 16.0;
                            const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
                            if (skipBtn) skipBtn.click();
                        }
                    } catch (e) {
                     
                    }
                }, 1000);
                return "injected successfully";
            })();
        `).then(() => {
            zapperInjected = true;
        }).catch((err) => {
            console.error('Zapper injection failed:', err);

            setTimeout(() => { if (!zapperInjected) injectZapper(); }, 2000);
        });
    };
    injectZapper();

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
            `).then(key => injectedCssKey = key).catch(() => { });
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

    isTyping = false;
    dismissMenu();
}

goBtn.addEventListener('click', loadVideo);

urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loadVideo();
    }
});

dotClose.addEventListener('click', () => window.electronAPI.closeWindow());
dotMaximize.addEventListener('click', () => {
    window.electronAPI.maximizeWindow();
    dismissMenu();
});

document.querySelector('.app-name').addEventListener('click', () => {
    if (!ytPlayer.classList.contains('hidden')) {
        ytPlayer.reload();
    }
});

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

const bmToggle = document.getElementById('bookmark-toggle');
const bmDropdown = document.getElementById('bookmark-dropdown');
const bmList = document.getElementById('bookmark-list');
const bmAddRow = document.getElementById('bookmark-add-row');
const bmAddBtn = document.getElementById('bookmark-add-btn');
const bmForm = document.getElementById('bookmark-form');
const bmNameInput = document.getElementById('bm-name');
const bmUrlInput = document.getElementById('bm-url');
const bmSaveBtn = document.getElementById('bm-save');

async function getBookmarks() {
    try {
        return await window.electronAPI.getBookmarks();
    } catch { return []; }
}

function saveBookmarks(list) {
    try {
        window.electronAPI.saveBookmarks(list);
    } catch (e) { }
}

async function renderBookmarks() {
    const bookmarks = await getBookmarks();
    bmList.innerHTML = '';
    bookmarks.forEach((bm, i) => {
        const row = document.createElement('div');
        row.className = 'bookmark-entry';
        const name = document.createElement('span');
        name.className = 'bookmark-entry-name';
        name.textContent = bm.name;
        name.title = bm.url;
        name.addEventListener('click', () => {
            urlInput.value = bm.url;
            loadVideo();
            bmDropdown.classList.add('hidden');
        });
        const del = document.createElement('button');
        del.className = 'bookmark-delete';
        del.textContent = '×';
        del.addEventListener('click', async (e) => {
            e.stopPropagation();
            const list = await getBookmarks();
            list.splice(i, 1);
            saveBookmarks(list);
            renderBookmarks();
        });
        row.appendChild(name);
        row.appendChild(del);
        bmList.appendChild(row);
    });
    bmAddRow.style.display = bookmarks.length >= 5 ? 'none' : 'flex';
}

bmToggle.addEventListener('click', () => {
    bmDropdown.classList.toggle('hidden');
    bmForm.classList.add('hidden');
    renderBookmarks();
});

bmAddBtn.addEventListener('click', () => {
    bmForm.classList.toggle('hidden');
    bmNameInput.value = '';
    bmUrlInput.value = '';
    bmNameInput.focus();
});

bmSaveBtn.addEventListener('click', async () => {
    const name = bmNameInput.value.trim();
    let url = bmUrlInput.value.trim();
    if (!name || !url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    const list = await getBookmarks();
    if (list.length >= 5) return;
    list.push({ name, url });
    saveBookmarks(list);
    bmForm.classList.add('hidden');
    renderBookmarks();
});

bmNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') bmUrlInput.focus(); });
bmUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') bmSaveBtn.click(); });

document.addEventListener('click', (e) => {
    if (!e.target.closest('.bookmark-wrap')) {
        bmDropdown.classList.add('hidden');
        bmForm.classList.add('hidden');
    }
});
