(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    document.querySelectorAll('.photo-album').forEach(album => {
        const track = album.querySelector('.photo-track');
        const images = [...track.querySelectorAll('img')];
        const controls = album.querySelector('.album-controls');
        const count = controls.querySelector('.album-count');
        const autoplay = album.querySelector('.album-autoplay');
        let current = 0;
        let frame;
        let timer;
        let visible = true;
        let hovered = false;
        let touching = false;
        let playing = !reducedMotion.matches;

        function schedule() {
            clearTimeout(timer);
            const focused = album.contains(document.activeElement) && document.activeElement !== autoplay;
            const canPlay = playing && visible && !document.hidden && !hovered && !touching && !focused;
            // Automatic changes should not repeatedly interrupt screen readers.
            count.setAttribute('aria-live', canPlay ? 'off' : 'polite');
            if (canPlay && images.length > 1) timer = setTimeout(() => show(current + 1), 3000);
        }

        function updateAutoplay() {
            autoplay.textContent = playing ? '暂停轮播' : '播放轮播';
            autoplay.setAttribute('aria-label', `${playing ? '暂停' : '播放'}${album.getAttribute('aria-label')}自动轮播`);
            schedule();
        }

        function updateCount() {
            const index = Math.round(track.scrollLeft / track.clientWidth);
            current = Math.max(0, Math.min(index, images.length - 1));
            const text = `${current + 1} / ${images.length}`;
            if (count.textContent !== text) count.textContent = text;
        }

        function show(index) {
            clearTimeout(timer);
            current = (index + images.length) % images.length;
            track.scrollTo({ left: current * track.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
            schedule();
        }

        controls.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => show(current + Number(button.dataset.step)));
        });
        track.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                show(current + (event.key === 'ArrowRight' ? 1 : -1));
            }
        });
        track.addEventListener('scroll', () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(updateCount);
            schedule();
        }, { passive: true });
        autoplay.addEventListener('click', () => {
            playing = !playing;
            updateAutoplay();
        });
        album.addEventListener('pointerenter', event => {
            if (event.pointerType === 'mouse') { hovered = true; schedule(); }
        });
        album.addEventListener('pointerleave', event => {
            if (event.pointerType === 'mouse') { hovered = false; schedule(); }
        });
        track.addEventListener('pointerdown', () => { touching = true; schedule(); });
        window.addEventListener('pointerup', () => { touching = false; schedule(); });
        window.addEventListener('pointercancel', () => { touching = false; schedule(); });
        album.addEventListener('focusin', schedule);
        album.addEventListener('focusout', () => queueMicrotask(schedule));
        document.addEventListener('visibilitychange', schedule);
        reducedMotion.addEventListener('change', () => {
            playing = !reducedMotion.matches;
            updateAutoplay();
        });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                visible = entries[0].isIntersecting;
                schedule();
            }).observe(album);
        }
        window.addEventListener('resize', () => {
            track.scrollTo({ left: current * track.clientWidth, behavior: 'instant' });
            schedule();
        });
        controls.hidden = false;
        autoplay.hidden = false;
        updateCount();
        updateAutoplay();
    });
})();
