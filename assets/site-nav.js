(() => {
    const header = document.querySelector('.site-header');
    const toggle = header?.querySelector('.site-menu-toggle');
    const navigation = header?.querySelector('.site-navigation');

    if (!toggle || !navigation) return;

    const mobile = window.matchMedia('(max-width: 767px)');
    let previousMobile = mobile.matches;
    let lastHeaderFocus = header.contains(document.activeElement) ? document.activeElement : null;

    document.addEventListener('focusin', event => {
        lastHeaderFocus = header.contains(event.target) ? event.target : null;
    });

    header.addEventListener('focusout', event => {
        if (event.relatedTarget) {
            if (!header.contains(event.relatedTarget)) lastHeaderFocus = null;
        } else if (mobile.matches === previousMobile) {
            // A normal blur should not be restored by a later viewport change.
            lastHeaderFocus = null;
        }
    });

    document.addEventListener('pointerdown', event => {
        if (!header.contains(event.target)) lastHeaderFocus = null;
    });

    function setExpanded(expanded) {
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.setAttribute('aria-label', expanded ? '关闭导航菜单' : '打开导航菜单');
    }

    function closeMenu() {
        if (mobile.matches && navigation.contains(document.activeElement)) {
            toggle.focus();
        }
        setExpanded(false);
    }

    toggle.addEventListener('click', () => {
        setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
    });

    header.addEventListener('keydown', event => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            event.preventDefault();
            closeMenu();
            toggle.focus();
        }
    });

    navigation.addEventListener('click', event => {
        if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', event => {
        if (!header.contains(event.target)) closeMenu();
    });

    mobile.addEventListener('change', () => {
        const active = document.activeElement;
        // CSS may hide the focused control before this callback and move focus
        // to body. Retain only the header focus lost at this breakpoint.
        const focused = active === document.body || active === document.documentElement
            ? lastHeaderFocus
            : active;

        if (mobile.matches) {
            const keepNavigationOpen = navigation.contains(focused);
            setExpanded(keepNavigationOpen);
            if (keepNavigationOpen && document.activeElement !== focused) focused.focus();
        } else {
            if (focused === toggle) {
                (navigation.querySelector('[aria-current="page"]') || navigation.querySelector('a')).focus();
            }
            setExpanded(false);
        }
        previousMobile = mobile.matches;
    });

    const pill = navigation.querySelector('.site-nav-pill');
    const links = [...navigation.querySelectorAll('a')];
    const currentLink = () => navigation.querySelector('a[aria-current="page"]') || links[0];

    // Each page is a real navigation, so a click has no time to play the slide.
    // Moving the pill on hover/focus instead means it is already in place by the
    // time the click lands, and the next page paints it at the same spot.
    function movePill(link, animate) {
        if (!pill || !link) return;
        if (!animate) pill.style.transition = 'none';
        pill.style.width = `${link.offsetWidth}px`;
        pill.style.transform = `translateY(-50%) translateX(${link.offsetLeft}px)`;
        if (!animate) {
            void pill.offsetWidth;
            pill.style.transition = '';
        }
        pill.classList.add('is-ready');
    }

    function resetPill() {
        movePill(currentLink(), true);
    }

    if (pill) {
        movePill(currentLink(), false);

        links.forEach(link => {
            link.addEventListener('pointerenter', () => movePill(link, true));
            link.addEventListener('focus', () => movePill(link, true));
        });

        navigation.addEventListener('pointerleave', resetPill);
        navigation.addEventListener('focusout', event => {
            if (!navigation.contains(event.relatedTarget)) resetPill();
        });
        window.addEventListener('resize', () => movePill(currentLink(), false));

        // Cross-document view transitions snapshot this page before playing the
        // animation. Re-place the pill here so that snapshot never catches it
        // undrawn (opacity 0) or still parked in the corner.
        window.addEventListener('pagereveal', () => movePill(currentLink(), false));
    }

    setExpanded(mobile.matches && navigation.contains(document.activeElement));
    document.documentElement.classList.add('site-nav-ready');
})();
