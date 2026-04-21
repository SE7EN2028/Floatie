const windowWrap = document.querySelector('.window-wrap');
const urlInput = document.getElementById('url-input');
const emptyState = document.getElementById('empty-state');
const goBtn = document.getElementById('go-btn');
const topMenu = document.querySelector('.controls-overlay');
const hoverRing = document.getElementById('hover-ring');
const dotCluster = document.getElementById('dot-cluster');
const dotClose = document.getElementById('dot-close');
const dotMaximize = document.getElementById('dot-maximize');

const tabsContainer = document.getElementById('tabs-container');
const addTabBtn = document.getElementById('add-tab-btn');
const playerArea = document.querySelector('.player-area');

let ytPlayer = document.getElementById('yt-player-1');
let currentTabId = 1;
let tabCount = 1;
let tabs = [];
let injectedCssKeys = {};

windowWrap.classList.add('menu-hidden');

let hoverTimeout;
let isTyping = false;

function createTabElement(id) {
    const btn = document.createElement('div');
    btn.className = 'tab-btn' + (id === currentTabId ? ' active' : '');
    btn.dataset.id = id;
    btn.innerHTML = `
        <span class="tab-title">New Tab</span>
        <button class="tab-close" title="Close Tab">×</button>
    `;
    btn.addEventListener('click', (e) => {
        if(e.target.classList.contains('tab-close')) closeTab(id);
        else switchToTab(id);
    });
    tabsContainer.insertBefore(btn, addTabBtn);
    return btn;
}

function switchToTab(id) {
    const tabIndex = tabs.findIndex(t => t.id === id);
    if(tabIndex === -1) return;
    
    const currentBtn = tabsContainer.querySelector(`.tab-btn[data-id="${currentTabId}"]`);
    if(currentBtn) currentBtn.classList.remove('active');
    const currentWebview = document.getElementById(`yt-player-${currentTabId}`);
    if(currentWebview) currentWebview.classList.remove('yt-player-active');
    
    currentTabId = id;
    const newBtn = tabsContainer.querySelector(`.tab-btn[data-id="${currentTabId}"]`);
    if(newBtn) newBtn.classList.add('active');
    
    const newWebview = document.getElementById(`yt-player-${currentTabId}`);
    if(newWebview) {
        newWebview.classList.add('yt-player-active');
    }
    
    try {
        const url = newWebview.getURL ? newWebview.getURL() : '';
        urlInput.value = url;
        if(url && url !== '' && url !== 'about:blank') {
            emptyState.classList.add('hidden');
            newWebview.classList.remove('hidden');
        } else {
            emptyState.classList.remove('hidden');
            newWebview.classList.add('hidden');
            urlInput.value = '';
        }
    } catch(e) {
        emptyState.classList.remove('hidden');
        if(newWebview) newWebview.classList.add('hidden');
        urlInput.value = '';
    }
}

function closeTab(id) {
    if(tabs.length <= 1) {
        window.electronAPI.closeWindow();
        return;
    }
    const index = tabs.findIndex(t => t.id === id);
    if(index === -1) return;
    
    const tabObj = tabs[index];
    if(tabObj.webview) tabObj.webview.remove();
    if(tabObj.btn) tabObj.btn.remove();
    tabs.splice(index, 1);
    
    if(currentTabId === id) {
        const nextTabId = tabs[index] ? tabs[index].id : tabs[index - 1].id;
        switchToTab(nextTabId);
    }
}

addTabBtn.addEventListener('click', () => {
    tabCount++;
    const newId = tabCount;
    const webviewStr = `<webview id="yt-player-${newId}" class="yt-player yt-player-active hidden" allowpopups disablewebsecurity="false" useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" webpreferences="contextIsolation=yes"></webview>`;
    playerArea.insertAdjacentHTML('beforeend', webviewStr);
    const wv = document.getElementById(`yt-player-${newId}`);
    const btn = createTabElement(newId);
    tabs.push({ id: newId, webview: wv, btn: btn });
    setupWebviewEvents(wv, btn);
    switchToTab(newId);
});

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

function handleYouTubeCSS(url, wv) {
    const isPlayingVideo = url && (url.includes('youtube.com/watch') || url.includes('youtu.be/'));
    const tabId = wv.id;
    if (isPlayingVideo) {
        if (!injectedCssKeys[tabId]) {
            wv.insertCSS(`
                body { background: #000 !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
                #masthead-container, #secondary, #comments, #footer, #related, ytd-watch-metadata, ytd-live-chat-frame { display: none !important; }
                ytd-app, ytd-watch-flexy { background: #000 !important; padding: 0 !important; margin: 0 !important; display: block !important; }
                .html5-video-player { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 99999 !important; }
                video { object-fit: contain !important; object-position: top !important; width: 100vw !important; height: 100vh !important; top: 0 !important; left: 0 !important; }
            `).then(key => injectedCssKeys[tabId] = key).catch(() => { });
        }
    } else {
        if (injectedCssKeys[tabId]) {
            wv.removeInsertedCSS(injectedCssKeys[tabId]);
            delete injectedCssKeys[tabId];
        }
    }
}

function setupWebviewEvents(wv, tabBtn) {
    const tabTitle = tabBtn.querySelector('.tab-title');

    wv.addEventListener('dom-ready', () => {
        const currentUrl = wv.getURL();
        let zapperInjected = false;
        const injectZapper = () => {
            if (!currentUrl.includes('youtube.com') && !currentUrl.includes('youtu.be')) return;
            if (zapperInjected) return;
            wv.executeJavaScript(`
                (function() {
                    if (window.__adZapperStarted) return "already results";
                    window.__adZapperStarted = true;
                    setInterval(() => {
                        try {
                            const video = document.querySelector('video');
                            const ad = document.querySelector('.ad-showing, .ad-interrupting');
                            const dialog = document.querySelector('tp-yt-paper-dialog, ytd-enforcement-message-view-model');
                            if (dialog && dialog.innerText.toLowerCase().includes('ad blocker')) {
                                dialog.remove();
                                if (video && video.paused) video.play();
                            }
                            if (ad && video) {
                                video.muted = true;
                                video.playbackRate = 16.0;
                                const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
                                if (skipBtn) setTimeout(() => skipBtn.click(), Math.random() * 300 + 100);
                            }
                        } catch (e) { }
                    }, 1000);
                    return "injected successfully";
                })();
            `).then(() => { zapperInjected = true; }).catch((err) => {
                setTimeout(() => { if (!zapperInjected) injectZapper(); }, 2000);
            });
        };
        injectZapper();
        handleYouTubeCSS(currentUrl, wv);
    });

    wv.addEventListener('did-navigate', (e) => {
        if(currentTabId === parseInt(wv.id.split('-').pop())) urlInput.value = e.url;
        handleYouTubeCSS(e.url, wv);
    });
    
    wv.addEventListener('did-navigate-in-page', (e) => {
        if(currentTabId === parseInt(wv.id.split('-').pop())) urlInput.value = e.url;
        handleYouTubeCSS(e.url, wv);
    });
    
    wv.addEventListener('page-title-updated', (e) => {
        const title = e.title || 'New Tab';
        tabTitle.textContent = title;
        tabTitle.title = title;
    });
}

setTimeout(() => {
    tabs.push({ id: 1, webview: ytPlayer, btn: createTabElement(1) });
    setupWebviewEvents(ytPlayer, tabs[0].btn);
}, 50);

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

    const activePlayer = document.getElementById(`yt-player-${currentTabId}`) || ytPlayer;
    activePlayer.src = url;
    activePlayer.classList.remove('hidden');
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
    document.body.classList.toggle('is-maximized');
    window.electronAPI.maximizeWindow();
    dismissMenu();
});

document.getElementById('reload-btn').addEventListener('click', () => {
    const activePlayer = document.getElementById(`yt-player-${currentTabId}`) || ytPlayer;
    if (!activePlayer.classList.contains('hidden') && activePlayer.reload) {
        activePlayer.reload();
    }
});

document.getElementById('back-btn').addEventListener('click', () => {
    const activePlayer = document.getElementById(`yt-player-${currentTabId}`) || ytPlayer;
    if (activePlayer.canGoBack && activePlayer.canGoBack()) activePlayer.goBack();
});
document.getElementById('forward-btn').addEventListener('click', () => {
    const activePlayer = document.getElementById(`yt-player-${currentTabId}`) || ytPlayer;
    if (activePlayer.canGoForward && activePlayer.canGoForward()) activePlayer.goForward();
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
        const list = await window.electronAPI.getBookmarks();
        let needsSave = false;
        for (const bm of list) {
            if (!bm.id) {
                bm.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
                needsSave = true;
            }
        }
        if (needsSave) saveBookmarks(list);
        return list;
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
    bookmarks.forEach((bm) => {
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
            const updated = list.filter(b => b.id !== bm.id);
            saveBookmarks(updated);
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
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    list.push({ id, name, url });
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
