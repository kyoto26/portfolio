// ============================================================
// "Lab" experiment: day/night mountain landscape.
// Lives inside the "Logos" card (#lab-logos-gallery). Same as
// galaxy.js with the "Lab" card, building the SVG (hills, snow,
// pines, stars) is deferred until the card is expanded for the
// first time, instead of running as soon as the page loads.
// Unlike the galaxy, there's no render loop here
// (requestAnimationFrame) to pause/resume: it's all static SVG
// + CSS transitions triggered by the button click, so there's
// no need for a stop().
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

    // ---------- Rolling hills ----------
    // Each layer is defined as a list of irregular (x,y) points
    // (variable height and spacing). Instead of joining them with
    // straight lines, a smooth curve is traced: each interior point
    // is used as the control for a quadratic Bézier toward the
    // midpoint with its next neighbor, so the curve never touches a
    // point at a sharp angle — it rises and falls in rounded humps.
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

    // ---------- Snow on the peaks ----------
    // The snow is NOT a new shape guessing at the outline: it's an
    // exact duplicate of the same mountain `d` (white, overlaid),
    // clipped with an elliptical <clipPath> centered on the peak.
    // Since the duplicate shares the hill's actual path, the snow's
    // upper edge after clipping is mathematically the same curve as
    // the mountain — it can never end up "floating" apart from the
    // ridge. Only the ellipse size (how far down/wide the snow is)
    // varies randomly between peaks.
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
        // Only the tallest/most prominent peaks of each layer get snow.
        // The lowest one in the far layer (95,335) is left bare on purpose.
        const farPeaks = [farHillPoints[3], farHillPoints[6], farHillPoints[8]];
        const midPeaks = [midHillPoints[6]];

        farPeaks.forEach((peak) => {
            addSnowCap(farD, snowCapsFarGroup, peak, randomBetween(58, 82), randomBetween(20, 28));
        });

        midPeaks.forEach((peak) => {
            addSnowCap(midD, snowCapsMidGroup, peak, randomBetween(60, 78), randomBetween(22, 30));
        });
    }

    // ---------- Pines ----------
    // Each tier stops being a plain triangle: the edge on each side
    // (apex -> base corner) is traced with a fixed alternating
    // "branch tip / notch" pattern (always the same structure, only
    // the depth of each notch varies slightly at random), which
    // scallops the outline without it looking chaotic. The trunk
    // takes up a good part of the height and stays clearly visible
    // under the first tier.
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

    // ---------- Stars ----------
    // Only in the strip of sky above the far mountain range.
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

            // Staggered appearance cascade when switching to night mode.
            circle.style.transitionDelay = `${randomBetween(0, 1.4).toFixed(2)}s`;

            starsGroup.appendChild(circle);
        }
    }

    // ---------- Day / night toggle ----------
    function setNight(isNight) {
        scene.classList.toggle('is-night', isNight);
        toggleBtn.setAttribute('aria-pressed', String(isNight));
        toggleIcon.textContent = isNight ? '☀️' : '🌙';
        toggleLabel.textContent = window.i18n.t(isNight ? 'sunset.toggle_label_day' : 'sunset.toggle_label_night');
    }

    toggleBtn.addEventListener('click', () => {
        const isNight = !scene.classList.contains('is-night');
        setNight(isNight);
    });

    // Resyncs the label (not the day/night state itself) when the
    // language changes, since setNight() is the only source of that
    // text and it isn't marked with data-i18n in the HTML.
    document.addEventListener('i18n:languagechange', () => {
        setNight(scene.classList.contains('is-night'));
    });

    setNight(scene.classList.contains('is-night'));

    // ============================================================
    // LIFECYCLE CONTROL: same as galaxy.js with the "Lab" card,
    // building it is deferred until the "Logos" card is expanded
    // for the first time. There's no render loop to pause/resume
    // (it's all static SVG + CSS transitions triggered by click),
    // so all that's needed is a start() that runs once.
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

    // Covers the case where the card is already expanded on load.
    syncWithCardState();
})();
