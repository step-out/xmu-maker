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

(() => {
    const root = document.querySelector('.showcase-carousel');
    if (!root) return;

    const track = root.querySelector('.showcase-track');
    const slides = [...root.querySelectorAll('.showcase-player')];
    if (!track || !slides.length) return;

    const total = slides.length;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const arrows = [...root.querySelectorAll('.showcase-arrow')];
    let current = 0;
    let position = total > 1 ? 1 : 0;
    let timer;
    let transitionTimer;
    let moving = false;
    let autoEnabled = !reducedMotion.matches;
    let hovered = false;
    let visible = !('IntersectionObserver' in window);

    // Clones are decorative transition frames. Only original slides can play.
    if (total > 1) {
        const clones = [slides[total - 1].cloneNode(true), slides[0].cloneNode(true)];
        clones.forEach(clone => {
            clone.inert = true;
            clone.setAttribute('aria-hidden', 'true');
            clone.querySelectorAll('a').forEach(link => {
                link.removeAttribute('href');
                link.tabIndex = -1;
            });
        });
        track.prepend(clones[0]);
        track.append(clones[1]);
    }

    const controls = document.createElement('div');
    controls.className = 'showcase-controls';
    const dots = document.createElement('div');
    dots.className = 'showcase-dots';
    const dotButtons = slides.map((slide, index) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', '幻灯片');
        slide.setAttribute('aria-label', `第 ${index + 1} 个作品，共 ${total} 个`);
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'showcase-dot';
        dot.setAttribute('aria-label', `第 ${index + 1} 个作品，共 ${total} 个`);
        dot.addEventListener('click', () => goTo(index));
        dots.append(dot);
        return dot;
    });
    const autoplay = document.createElement('button');
    autoplay.type = 'button';
    autoplay.className = 'showcase-autoplay';
    const original = document.createElement('a');
    original.className = 'showcase-original';
    original.target = '_blank';
    original.rel = 'noopener noreferrer';
    original.textContent = '在 B 站打开 ↗';
    if (total > 1) controls.append(dots, autoplay);
    controls.append(original);
    root.append(controls);

    const facades = slides.map(slide => slide.querySelector('.showcase-facade'));

    function resetPlayer(index) {
        slides[index].querySelector('.showcase-frame')?.remove();
        facades[index].hidden = false;
    }

    function updateControls() {
        autoplay.textContent = autoEnabled ? '暂停轮播' : '播放轮播';
        autoplay.setAttribute('aria-label', `${autoEnabled ? '暂停' : '播放'}作品自动轮播`);
        dotButtons.forEach((dot, index) => {
            if (index === current) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
        });
        original.href = facades[current].href;
        original.setAttribute('aria-label', `${facades[current].getAttribute('aria-label')}，在 B 站打开`);
    }

    function syncSlides() {
        slides.forEach((slide, index) => {
            const active = !moving && index === current;
            slide.inert = !active;
            slide.setAttribute('aria-hidden', String(!active));
        });
    }

    function place(animate) {
        if (!animate) track.style.transition = 'none';
        track.style.transform = `translateX(${-position * 100}%)`;
        if (!animate) {
            void track.offsetWidth;
            track.style.transition = '';
        }
    }

    function stopAuto() {
        clearTimeout(timer);
    }

    function schedule() {
        stopAuto();
        const focused = root.contains(document.activeElement) && document.activeElement !== autoplay;
        if (!autoEnabled || hovered || focused || moving
            || !visible || document.hidden || total < 2) return;
        timer = setTimeout(() => goTo((current + 1) % total, 1), 3000);
    }

    function finishMove() {
        if (!moving) return;
        clearTimeout(transitionTimer);
        position = total > 1 ? current + 1 : 0;
        place(false);
        moving = false;
        syncSlides();
        schedule();
    }

    function goTo(index, direction = 0) {
        if (total < 2) return;
        if (moving) finishMove();
        if (index === current) { schedule(); return; }
        // A programmatic/manual change must not leave focus inside a hidden slide.
        if (slides[current].contains(document.activeElement)) arrows[1]?.focus();
        resetPlayer(current);
        stopAuto();
        const previous = current;
        current = index;
        position = index + 1;
        if (direction === 1 && previous === total - 1 && index === 0) position = total + 1;
        if (direction === -1 && previous === 0 && index === total - 1) position = 0;
        moving = true;
        syncSlides();
        updateControls();
        place(!reducedMotion.matches);
        if (reducedMotion.matches) finishMove();
        else transitionTimer = setTimeout(finishMove, 450);
    }

    facades.forEach((facade, index) => {
        facade.addEventListener('click', event => {
            // Preserve open-in-new-tab/window gestures and the no-JS destination.
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            if (moving || index !== current) return;
            const frame = document.createElement('iframe');
            frame.className = 'showcase-frame';
            frame.title = facade.getAttribute('aria-label') || '作品演示视频';
            frame.src = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(facade.dataset.bvid)}&page=1&autoplay=1&danmaku=0`;
            frame.setAttribute('allowfullscreen', 'true');
            frame.setAttribute('allow', 'autoplay; fullscreen');
            facade.hidden = true;
            slides[index].append(frame);
            frame.focus();
            autoEnabled = false;
            updateControls();
            stopAuto();
        });
    });

    autoplay.addEventListener('click', () => {
        autoEnabled = !autoEnabled;
        if (autoEnabled) resetPlayer(current);
        updateControls();
        schedule();
    });
    arrows.forEach(arrow => {
        arrow.hidden = total < 2;
        arrow.addEventListener('click', () => {
            const direction = Number(arrow.dataset.step);
            goTo((current + direction + total) % total, direction);
        });
    });
    track.addEventListener('transitionend', event => {
        if (event.target === track && event.propertyName === 'transform') finishMove();
    });
    root.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse') { hovered = true; schedule(); }
    });
    root.addEventListener('pointerleave', event => {
        if (event.pointerType === 'mouse') { hovered = false; schedule(); }
    });
    root.addEventListener('focusin', schedule);
    root.addEventListener('focusout', () => queueMicrotask(schedule));
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) { autoEnabled = false; finishMove(); }
        updateControls();
        schedule();
    });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            schedule();
        }).observe(root);
    }

    root.classList.add('is-ready');
    place(false);
    syncSlides();
    updateControls();
    schedule();
})();
