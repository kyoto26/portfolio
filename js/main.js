(function () {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.getElementById('siteStars');
    const staticGroup = document.getElementById('siteStarsStatic');
    const twinkleGroup = document.getElementById('siteStarsTwinkle');
    const iconDrifts = document.querySelectorAll('.site-float-icon-drift');

    if (!svg || !staticGroup || !twinkleGroup) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    const driftTargets = [];

    function addStarDrift(circle, speedMin, speedMax) {
        const angle = randomBetween(0, Math.PI * 2);
        const speed = randomBetween(speedMin, speedMax);
        driftTargets.push({
            kind: 'svg',
            el: circle,
            x: parseFloat(circle.getAttribute('cx')),
            y: parseFloat(circle.getAttribute('cy')),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            margin: 4,
            boundsW: W,
            boundsH: H,
        });
    }

    function addIconDrift(el, speedMin, speedMax) {
        const rect = el.getBoundingClientRect();
        const angle = randomBetween(0, Math.PI * 2);
        const speed = randomBetween(speedMin, speedMax);
        driftTargets.push({
            kind: 'transform',
            el,
            baseX: rect.left + rect.width / 2,
            baseY: rect.top + rect.height / 2,
            x: 0,
            y: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            margin: 60,
            boundsW: W,
            boundsH: H,
        });
    }

    function makeStar(group, { twinkle }) {
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', randomBetween(0, W).toFixed(1));
        circle.setAttribute('cy', randomBetween(0, H).toFixed(1));
        circle.setAttribute('r', randomBetween(0.5, 2).toFixed(2));
        circle.classList.add('site-star');

        const baseOpacity = randomBetween(0.15, 0.6);

        if (twinkle && !reduceMotion) {
            circle.classList.add('site-star-twinkle');
            circle.style.setProperty('--star-opacity', baseOpacity.toFixed(2));
            circle.style.animationDuration = `${randomBetween(2.5, 5).toFixed(1)}s`;
            circle.style.animationDelay = `-${randomBetween(0, 5).toFixed(1)}s`;
        } else {
            circle.setAttribute('opacity', baseOpacity.toFixed(2));
        }

        group.appendChild(circle);
        if (!reduceMotion) addStarDrift(circle, 2, 5);
    }

    for (let i = 0; i < 65; i++) makeStar(staticGroup, { twinkle: false });
    for (let i = 0; i < 20; i++) makeStar(twinkleGroup, { twinkle: true });

    if (reduceMotion) return;

    iconDrifts.forEach((el) => addIconDrift(el, 1.5, 3.5));

    const FRAME_INTERVAL = 1000 / 15;
    let lastUpdate = null;

    function wrap(value, span, margin) {
        const total = span + margin * 2;
        if (value < -margin) return value + total;
        if (value > span + margin) return value - total;
        return value;
    }

    function step(dt) {
        driftTargets.forEach((t) => {
            t.x += t.vx * dt;
            t.y += t.vy * dt;

            if (t.kind === 'svg') {
                t.x = wrap(t.x, t.boundsW, t.margin);
                t.y = wrap(t.y, t.boundsH, t.margin);
                t.el.setAttribute('cx', t.x.toFixed(1));
                t.el.setAttribute('cy', t.y.toFixed(1));
            } else {
                const absX = wrap(t.baseX + t.x, t.boundsW, t.margin);
                const absY = wrap(t.baseY + t.y, t.boundsH, t.margin);
                t.x = absX - t.baseX;
                t.y = absY - t.baseY;
                t.el.style.transform = `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px)`;
            }
        });
    }

    function tick(now) {
        if (lastUpdate === null) lastUpdate = now;
        const elapsed = now - lastUpdate;

        if (elapsed >= FRAME_INTERVAL) {
            step(elapsed / 1000);
            lastUpdate = now;
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();

(function () {
    const layers = document.querySelectorAll('.parallax-layer');

    if (!layers.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let mouseX = 0;
    let mouseY = 0;
    let ticking = false;

    function updateLayers() {
        const scrollY = window.scrollY;
        layers.forEach((layer) => {
            const depth = parseFloat(layer.dataset.depth) || 0;
            const x = mouseX * depth;
            const y = mouseY * depth + scrollY * depth * 0.5;
            layer.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX - window.innerWidth / 2;
        mouseY = e.clientY - window.innerHeight / 2;
        updateLayers();
    });

    document.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
        updateLayers();
    });

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateLayers();
                ticking = false;
            });
            ticking = true;
        }
    });
})();

(function () {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach((card) => {
        const trigger = card.querySelector('.project-card-trigger');
        const collapseBtn = card.querySelector('.project-card-collapse');

        if (!trigger) return;

        function setExpanded(expand) {
            card.classList.toggle('is-expanded', expand);
            trigger.setAttribute('aria-expanded', String(expand));
        }

        trigger.addEventListener('click', () => {
            setExpanded(!card.classList.contains('is-expanded'));
        });

        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                setExpanded(false);
                trigger.focus();
            });
        }
    });
})();

(function () {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');

    if (!toggle || !menu) return;

    function setOpen(open) {
        menu.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', () => {
        setOpen(!menu.classList.contains('is-open'));
    });

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });
})();
