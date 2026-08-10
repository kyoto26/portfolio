(function () {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const staticGroup = document.getElementById('heroStarsStatic');
    const twinkleGroup = document.getElementById('heroStarsTwinkle');

    if (!staticGroup || !twinkleGroup) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function makeStar(group, { twinkle }) {
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', randomBetween(0, 1600).toFixed(1));
        circle.setAttribute('cy', randomBetween(0, 900).toFixed(1));
        circle.setAttribute('r', randomBetween(0.5, 2).toFixed(2));
        circle.classList.add('hero-star');

        const baseOpacity = randomBetween(0.15, 0.6);

        if (twinkle && !reduceMotion) {
            circle.classList.add('hero-star-twinkle');
            circle.style.setProperty('--star-opacity', baseOpacity.toFixed(2));
            circle.style.animationDuration = `${randomBetween(2.5, 5).toFixed(1)}s`;
            circle.style.animationDelay = `-${randomBetween(0, 5).toFixed(1)}s`;
        } else {
            circle.setAttribute('opacity', baseOpacity.toFixed(2));
        }

        group.appendChild(circle);
    }

    for (let i = 0; i < 45; i++) makeStar(staticGroup, { twinkle: false });
    for (let i = 0; i < 15; i++) makeStar(twinkleGroup, { twinkle: true });
})();

(function () {
    const hero = document.querySelector('.hero');
    const layers = document.querySelectorAll('.parallax-layer');

    if (!hero || !layers.length) return;

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

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouseX = e.clientX - rect.left - rect.width / 2;
        mouseY = e.clientY - rect.top - rect.height / 2;
        updateLayers();
    });

    hero.addEventListener('mouseleave', () => {
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
