// ============================================================
// Experimento "Laboratorio": paisaje de montaña día/noche.
// Vive dentro de la card "Logos" (#lab-logos-gallery). Igual que
// galaxy.js con la card "Laboratorio", la construcción del SVG
// (colinas, nieve, pinos, estrellas) se difiere hasta que la card
// se expande por primera vez, en vez de correr apenas carga la
// página. A diferencia de la galaxia, acá no hay ningún loop de
// render (requestAnimationFrame) que pausar/reanudar: todo es SVG
// estático + transiciones de CSS disparadas por el click del botón,
// así que no hace falta un stop().
// ============================================================

(function () {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const cardEl = document.getElementById('lab-logos');
    const scene = document.getElementById('sunsetScene');

    if (!cardEl || !scene) return;

    const sceneDefs = document.getElementById('sunsetSceneDefs');
    const pinesGroup = document.getElementById('sunsetPines');
    const starsGroup = document.getElementById('sunsetStars');
    const mountainFarEl = document.getElementById('sunsetMountainFar');
    const mountainMidEl = document.getElementById('sunsetMountainMid');
    const mountainNearEl = document.getElementById('sunsetMountainNear');
    const snowCapsFarGroup = document.getElementById('sunsetSnowCapsFar');
    const snowCapsMidGroup = document.getElementById('sunsetSnowCapsMid');
    const toggleBtn = document.getElementById('sunsetToggleBtn');
    const toggleIcon = toggleBtn.querySelector('.sunset-toggle-icon');
    const toggleLabel = toggleBtn.querySelector('.sunset-toggle-label');

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    // ---------- Colinas onduladas ----------
    // Cada capa se define como una lista de puntos (x,y) irregulares
    // (altura y espaciado variable). En vez de unirlos con líneas rectas,
    // se traza una curva suave: cada punto interior se usa como control
    // de una Bézier cuadrática hacia el punto medio con su vecino
    // siguiente, así la curva nunca toca un punto en un ángulo agudo —
    // sube y baja en lomas redondeadas.
    const farHillPoints = [
        { x: 0, y: 385 }, { x: 95, y: 335 }, { x: 180, y: 365 }, { x: 370, y: 255 },
        { x: 455, y: 310 }, { x: 590, y: 340 }, { x: 680, y: 290 }, { x: 830, y: 350 },
        { x: 970, y: 265 }, { x: 1090, y: 320 }, { x: 1200, y: 300 },
    ];

    const midHillPoints = [
        { x: 0, y: 490 }, { x: 120, y: 410 }, { x: 230, y: 455 }, { x: 420, y: 395 },
        { x: 600, y: 350 }, { x: 690, y: 420 }, { x: 880, y: 330 }, { x: 960, y: 400 },
        { x: 1080, y: 360 }, { x: 1200, y: 430 },
    ];

    const nearHillPoints = [
        { x: 0, y: 570 }, { x: 160, y: 520 }, { x: 280, y: 555 }, { x: 520, y: 470 },
        { x: 650, y: 540 }, { x: 760, y: 500 }, { x: 900, y: 560 }, { x: 1050, y: 480 },
        { x: 1200, y: 530 },
    ];

    function hillPath(points) {
        let d = `M${points[0].x},${points[0].y}`;

        for (let i = 1; i < points.length - 1; i++) {
            const p = points[i];
            const next = points[i + 1];
            const midX = (p.x + next.x) / 2;
            const midY = (p.y + next.y) / 2;
            d += ` Q${p.x},${p.y} ${midX.toFixed(1)},${midY.toFixed(1)}`;
        }

        const last = points[points.length - 1];
        d += ` L${last.x},${last.y} L1200,600 L0,600 Z`;
        return d;
    }

    function buildHills() {
        const farD = hillPath(farHillPoints);
        const midD = hillPath(midHillPoints);
        mountainFarEl.setAttribute('d', farD);
        mountainMidEl.setAttribute('d', midD);
        mountainNearEl.setAttribute('d', hillPath(nearHillPoints));
        return { far: farD, mid: midD };
    }

    // ---------- Nieve en las cimas ----------
    // La nieve NO es una forma nueva adivinando el contorno: es un
    // duplicado exacto del mismo `d` de la montaña (blanco, superpuesto),
    // recortado con un <clipPath> elíptico centrado en el pico. Como el
    // duplicado comparte el trazado real de la colina, el borde superior
    // de la nieve después del recorte es matemáticamente la misma curva
    // de la montaña — nunca puede quedar "flotando" separado de la
    // cresta. Solo el tamaño de la elipse (cuánto baja/ancho es la nieve)
    // varía al azar entre picos.
    let clipIdSeq = 0;

    function addSnowCap(mountainD, groupEl, peak, rx, ry) {
        const clipId = `sunsetSnowClip${clipIdSeq++}`;

        const clipPath = document.createElementNS(SVG_NS, 'clipPath');
        clipPath.setAttribute('id', clipId);
        const ellipse = document.createElementNS(SVG_NS, 'ellipse');
        ellipse.setAttribute('cx', peak.x.toFixed(1));
        ellipse.setAttribute('cy', peak.y.toFixed(1));
        ellipse.setAttribute('rx', rx.toFixed(1));
        ellipse.setAttribute('ry', ry.toFixed(1));
        clipPath.appendChild(ellipse);
        sceneDefs.appendChild(clipPath);

        const snowPath = document.createElementNS(SVG_NS, 'path');
        snowPath.setAttribute('d', mountainD);
        snowPath.setAttribute('clip-path', `url(#${clipId})`);
        snowPath.classList.add('sunset-snow-cap');
        groupEl.appendChild(snowPath);
    }

    function buildSnowCaps(farD, midD) {
        // Solo las cimas más altas/prominentes de cada capa llevan nieve.
        // La más baja de la capa lejana (95,335) queda pelada a propósito.
        const farPeaks = [farHillPoints[3], farHillPoints[6], farHillPoints[8]];
        const midPeaks = [midHillPoints[6]];

        farPeaks.forEach((peak) => {
            addSnowCap(farD, snowCapsFarGroup, peak, randomBetween(58, 82), randomBetween(20, 28));
        });

        midPeaks.forEach((peak) => {
            addSnowCap(midD, snowCapsMidGroup, peak, randomBetween(60, 78), randomBetween(22, 30));
        });
    }

    // ---------- Pinos ----------
    // Cada nivel deja de ser un triángulo liso: el borde de cada lado
    // (ápice -> esquina de la base) se recorre con un patrón fijo de
    // "punta de rama / muesca" alternado (siempre la misma estructura,
    // solo la profundidad de cada muesca varía un poco al azar), lo que
    // festonea el contorno sin que se vea caótico. El tronco ocupa buena
    // parte de la altura y queda claramente visible bajo el primer nivel.
    function scallopedTier(x, apexY, baseY, halfWidth, teeth) {
        const steps = teeth * 2;
        const rightPts = [];

        for (let i = 1; i <= steps; i++) {
            const t = i / (steps + 1);
            const y = apexY + t * (baseY - apexY);
            const lineHalfW = t * halfWidth;
            const isNotch = i % 2 === 0;
            const hw = isNotch ? lineHalfW * randomBetween(0.55, 0.72) : lineHalfW;
            rightPts.push({ x: x + hw, y });
        }
        rightPts.push({ x: x + halfWidth, y: baseY });

        let d = `M${x.toFixed(1)},${apexY.toFixed(1)}`;
        rightPts.forEach((p) => {
            d += ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        });
        d += ` L${(x - halfWidth).toFixed(1)},${baseY.toFixed(1)}`;
        for (let i = rightPts.length - 2; i >= 0; i--) {
            const p = rightPts[i];
            d += ` L${(x - (p.x - x)).toFixed(1)},${p.y.toFixed(1)}`;
        }
        d += ' Z';
        return d;
    }

    function pinePath(x, baseY, h, w) {
        const trunkW = w * 0.18;
        const trunkTopY = baseY - h * 0.16;

        const trunk = `M${(x - trunkW / 2).toFixed(1)},${trunkTopY.toFixed(1)} L${(x + trunkW / 2).toFixed(1)},${trunkTopY.toFixed(1)} L${(x + trunkW / 2).toFixed(1)},${baseY.toFixed(1)} L${(x - trunkW / 2).toFixed(1)},${baseY.toFixed(1)} Z`;

        const tier1 = scallopedTier(x, baseY - h * 0.52, baseY - h * 0.12, w / 2, 3);
        const tier2 = scallopedTier(x, baseY - h * 0.74, baseY - h * 0.38, w * 0.36, 3);
        const tier3 = scallopedTier(x, baseY - h, baseY - h * 0.64, w * 0.22, 2);

        return [trunk, tier1, tier2, tier3].join(' ');
    }

    function buildPines() {
        const count = 26;
        const spacing = 1200 / count;

        for (let i = 0; i < count; i++) {
            const x = spacing * i + spacing / 2 + randomBetween(-10, 10);
            const baseY = randomBetween(565, 585);
            const h = randomBetween(32, 78);
            const w = h * randomBetween(0.42, 0.58);

            const path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('d', pinePath(x, baseY, h, w));
            pinesGroup.appendChild(path);
        }
    }

    // ---------- Estrellas ----------
    // Solo en la franja de cielo por encima de la cordillera lejana.
    function buildStars() {
        const count = 55;

        for (let i = 0; i < count; i++) {
            const circle = document.createElementNS(SVG_NS, 'circle');
            const cx = randomBetween(20, 1180);
            const cy = randomBetween(20, 300);
            const r = randomBetween(0.6, 1.8);
            const baseOpacity = randomBetween(0.35, 0.9);
            const twinkle = Math.random() < 0.4;

            circle.setAttribute('cx', cx.toFixed(1));
            circle.setAttribute('cy', cy.toFixed(1));
            circle.setAttribute('r', r.toFixed(2));
            circle.classList.add('sunset-star');
            circle.style.setProperty('--sunset-star-opacity', baseOpacity.toFixed(2));

            if (twinkle) {
                circle.classList.add('sunset-star-twinkle');
                circle.style.setProperty('--sunset-twinkle-duration', `${randomBetween(2.5, 4.5).toFixed(1)}s`);
                circle.style.setProperty('--sunset-twinkle-delay', `-${randomBetween(0, 4).toFixed(1)}s`);
            }

            // Cascada de aparición al pasar a modo noche.
            circle.style.transitionDelay = `${randomBetween(0, 1.4).toFixed(2)}s`;

            starsGroup.appendChild(circle);
        }
    }

    // ---------- Toggle día / noche ----------
    function setNight(isNight) {
        scene.classList.toggle('is-night', isNight);
        toggleBtn.setAttribute('aria-pressed', String(isNight));
        toggleIcon.textContent = isNight ? '☀️' : '🌙';
        toggleLabel.textContent = isNight ? 'Día' : 'Noche';
    }

    toggleBtn.addEventListener('click', () => {
        const isNight = !scene.classList.contains('is-night');
        setNight(isNight);
    });

    // ============================================================
    // CONTROL DE CICLO DE VIDA: igual que galaxy.js con la card
    // "Laboratorio", la construcción se difiere hasta que la card
    // "Logos" se expande por primera vez. No hay un loop de render
    // que pausar/reanudar (todo es SVG estático + transiciones de
    // CSS disparadas por click), así que solo hace falta un start()
    // que corra una única vez.
    // ============================================================

    let initialized = false;

    function start() {
        if (initialized) return;
        initialized = true;

        const hillPaths = buildHills();
        buildPines();
        buildStars();
        buildSnowCaps(hillPaths.far, hillPaths.mid);
    }

    function syncWithCardState() {
        if (cardEl.classList.contains('is-expanded')) {
            start();
        }
    }

    new MutationObserver(syncWithCardState)
        .observe(cardEl, { attributes: true, attributeFilter: ['class'] });

    // Cubre el caso de que la card ya esté expandida al cargar.
    syncWithCardState();
})();
