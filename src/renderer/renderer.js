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
    
    ytPlayer.insertCSS(`
        body { background: #000 !important; overflow: hidden !important; }
        #masthead-container, #secondary, #comments, #footer, #related, ytd-watch-metadata { display: none !important; }
        ytd-watch-flexy[flexy] #primary { margin: 0 !important; padding: 0 !important; max-width: 100vw !important; }
        .html5-video-player { position: fixed !important; top: 0 !important; left: 0 !important; min-width: 100vw !important; min-height: 100vh !important; z-index: 99999 !important; }
        ::-webkit-scrollbar { display: none !important; }
    `);
});

ytPlayer.addEventListener('page-title-updated', wakeControls);

function loadVideo() {
    const videoId = extractYouTubeId(urlInput.value);

    if (!videoId) {
        urlInput.style.borderColor = 'rgba(255, 80, 80, 0.6)';
        setTimeout(() => {
            urlInput.style.borderColor = '';
        }, 1200);
        return;
    }

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    ytPlayer.src = watchUrl;
    ytPlayer.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    wakeControls();
}

goBtn.addEventListener('click', loadVideo);

urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadVideo();
});
