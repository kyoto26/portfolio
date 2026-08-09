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
