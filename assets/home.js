(() => {
    const video = document.querySelector('#campus-video');
    const toggle = document.querySelector('.video-toggle');
    if (!video || !toggle) return;

    const desktop = window.matchMedia('(min-width: 768px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let playbackPreference = 'auto';
    let visible = true;

    function updateToggle() {
        toggle.replaceChildren(document.createTextNode(video.paused ? '播放背景视频 ' : '暂停背景视频 '));
        const icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = video.paused ? '▶' : 'Ⅱ';
        toggle.append(icon);
    }

    function playVideo() {
        video.play().catch(updateToggle);
    }

    function syncPlayback() {
        const shouldPlay = playbackPreference === 'play'
            || (playbackPreference === 'auto' && desktop.matches && !reducedMotion.matches);
        if (!visible || document.hidden || !shouldPlay) {
            video.pause();
        } else {
            playVideo();
        }
    }

    toggle.addEventListener('click', () => {
        playbackPreference = video.paused ? 'play' : 'pause';
        syncPlayback();
    });
    video.addEventListener('play', updateToggle);
    video.addEventListener('pause', updateToggle);
    function restoreControls() {
        toggle.hidden = true;
        video.controls = true;
    }
    video.addEventListener('error', restoreControls);
    video.querySelector('source')?.addEventListener('error', restoreControls);
    desktop.addEventListener('change', syncPlayback);
    reducedMotion.addEventListener('change', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            syncPlayback();
        }).observe(video);
    }

    video.controls = false;
    toggle.hidden = false;
    updateToggle();
    syncPlayback();
})();
