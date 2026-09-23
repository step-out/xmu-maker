(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    // 只有下面主动加上 .reveal 的元素才会被隐藏。
    // 所以关掉 JS、浏览器太老、或者用户要求减少动效时，内容都原样显示。
    if (reduced.matches || !('IntersectionObserver' in window)) return;

    const REVEAL = [
        '.section-heading', '.project-card',
        '.showcase-heading', '.showcase-carousel',
        '.awards-heading', '.award-year',
        '.members-heading', '.member-card',
        '.people-gallery .photo-album',
        '.archive-section', '.contact-card', '.contact-address'
    ].join(', ');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -10% 0px' });

    const viewport = window.innerHeight;

    document.querySelectorAll(REVEAL).forEach(el => {
        // 首屏里已经能看见的内容不做动画，否则一进页面就在眼前闪一下
        if (el.getBoundingClientRect().top < viewport * 0.92) return;

        // 同一组里的兄弟元素依次错开，看起来像排队出现
        const siblings = el.parentElement ? [...el.parentElement.children] : [];
        const order = Math.min(Math.max(siblings.indexOf(el), 0), 5);
        el.style.setProperty('--reveal-delay', `${order * 55}ms`);

        el.classList.add('reveal');
        revealObserver.observe(el);
    });

    // ---- 数字滚动 ----
    // 只认第一段连续数字，前后缀原样保留（"03 项获奖" 补零后仍是两位数）
    const COUNT = '.award-count, .section-links a span';

    function countUp(el) {
        if (reduced.matches) return;
        const text = el.textContent;
        const found = text.match(/\d+/);
        if (!found) return;

        const target = Number(found[0]);
        // 年份这种四位数滚起来很奇怪，只滚真正的计数。0 和 1 也要滚，
        // 否则同一组里 "01 项获奖" 会是唯一一个不动的
        if (target === 0 || target > 9999) return;

        const pad = found[0].length;
        const before = text.slice(0, found.index);
        const after = text.slice(found.index + found[0].length);
        const DURATION = 900;
        const render = n => {
            el.textContent = before + String(n).padStart(pad, '0') + after;
        };

        let start = null;
        render(0);
        requestAnimationFrame(function frame(now) {
            if (reduced.matches) { render(target); return; }
            if (start === null) start = now;
            const p = Math.min((now - start) / DURATION, 1);
            render(Math.round(target * (1 - Math.pow(1 - p, 3))));   // 先快后慢
            if (p < 1) requestAnimationFrame(frame);
        });
    }

    const counters = [...document.querySelectorAll(COUNT)].filter(el => /\d/.test(el.textContent));
    if (counters.length) {
        const countObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                countUp(entry.target);
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -10% 0px' });
        counters.forEach(el => countObserver.observe(el));
    }

    // 用户中途打开"减少动效"时，把还没滚到的东西直接放出来，别让它们卡在隐藏状态
    reduced.addEventListener('change', () => {
        if (!reduced.matches) return;
        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('is-revealed');
            revealObserver.unobserve(el);
        });
    });
})();
