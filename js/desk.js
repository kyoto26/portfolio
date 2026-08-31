import * as THREE from "three";

// ============================================================
// LIFECYCLE: the dust-particle scene and the pendulum physics
// loop are merged into a single render loop that only runs while
// the "Animaciones" card (#lab-logos) is expanded (same pattern
// as js/galaxy.js). The desk scene lives as a second item inside
// that card's gallery, alongside the sunset scene, so it shares
// that card's expand/collapse state rather than having its own.
// The scene is created lazily on the first expand; after that,
// start()/stop() just pause/resume the loop.
// ============================================================

const frameEl = document.getElementById("desk-frame");
const cardEl = document.getElementById("lab-logos");
const stageEl = document.getElementById("desk-stage");

if (frameEl && cardEl && stageEl) {

    // ============================================================
    // STAGE FIT (fixed 1600x1000 coordinate space, scaled to fit
    // .lab-desk-frame instead of the window)
    // ============================================================

    const STAGE_WIDTH = 1600;
    const STAGE_HEIGHT = 1000;

    function fitStage() {

        const scale = Math.min(
            frameEl.clientWidth / STAGE_WIDTH,
            frameEl.clientHeight / STAGE_HEIGHT
        );

        // The frame can measure 0 before the card's expand
        // transition has laid out, or while it's collapsed.
        if (!Number.isFinite(scale) || scale <= 0) return;

        stageEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    fitStage();

    new ResizeObserver(fitStage).observe(frameEl);

    // ============================================================
    // LAMP: on/off state (pull cord)
    // ============================================================

    const lampEl = document.getElementById("desk-lamp");
    const pullCordEl = document.getElementById("desk-pull-cord");
    const lightPoolEl = document.getElementById("desk-light-pool");

    let lampOn = false;

    function toggleLamp() {

        lampOn = !lampOn;

        lampEl.classList.toggle("desk-is-on", lampOn);
        lightPoolEl.classList.toggle("desk-is-on", lampOn);

        pullCordEl.classList.remove("desk-is-pulling");

        // restart the tug animation even on rapid consecutive clicks
        void pullCordEl.offsetWidth;

        pullCordEl.classList.add("desk-is-pulling");

    }

    pullCordEl.addEventListener("click", toggleLamp);

    // ============================================================
    // LAMP: draggable pendulum (click-and-drag on the lamp body,
    // spring-damped oscillation on release)
    // ============================================================

    const lampRigEl = document.getElementById("desk-lamp-rig");

    // anchor point: where .desk-lamp-cord meets the ceiling (stage coords)
    const PIVOT_X = 800;
    const PIVOT_Y = 0;

    const MAX_ANGLE_DEG = 22; // drag range, in degrees from rest

    // distance from the pivot to the bottom of the light beam — used
    // so the light pool moves proportionally to where the cone
    // points, not at the same rate as the bulb (much closer to the pivot)
    const POOL_RADIUS = 830;

    // damped harmonic oscillator: approximates a pendulum with
    // friction for small angles (sin(angle) ~= angle)
    const SPRING_K = 45;   // "stiffness" — controls how fast it returns to center
    const DAMPING = 2.2;   // friction — controls how long it takes to settle

    let angle = 0;          // degrees, 0 = hanging straight
    let angularVel = 0;     // degrees / second
    let dragging = false;
    let lastDragTime = 0;
    let lastPhysicsTime = performance.now();

    function stageCoordsFromEvent(e) {

        // .lab-desk-frame keeps the same 1600:1000 aspect ratio as
        // the stage, so its box is the stage's exact visual bounds —
        // no letterboxing to account for.
        const rect = frameEl.getBoundingClientRect();

        return {
            x: ((e.clientX - rect.left) / rect.width) * STAGE_WIDTH,
            y: ((e.clientY - rect.top) / rect.height) * STAGE_HEIGHT
        };

    }

    function angleFromPointer(x, y) {

        const dx = x - PIVOT_X;
        const dy = y - PIVOT_Y;

        const deg = Math.atan2(dx, dy) * (180 / Math.PI);

        return Math.max(-MAX_ANGLE_DEG, Math.min(MAX_ANGLE_DEG, deg));

    }

    function applyLampTransform() {

        stageEl.style.setProperty("--desk-lamp-angle", `${angle}deg`);

        const poolX = -POOL_RADIUS * Math.sin(angle * Math.PI / 180);
        stageEl.style.setProperty("--desk-lamp-x", `${poolX}px`);

    }

    function onGrabStart(e) {

        dragging = true;
        angularVel = 0;
        lastDragTime = performance.now();

        lampRigEl.classList.add("desk-is-dragging");

        const p = stageCoordsFromEvent(e);
        angle = angleFromPointer(p.x, p.y);
        applyLampTransform();

        e.preventDefault();

    }

    function onGrabMove(e) {

        if (!dragging) return;

        const p = stageCoordsFromEvent(e);
        const newAngle = angleFromPointer(p.x, p.y);

        const now = performance.now();
        const dt = Math.max((now - lastDragTime) / 1000, 1 / 120);

        angularVel = (newAngle - angle) / dt;
        angle = newAngle;
        lastDragTime = now;

        applyLampTransform();

    }

    function onGrabEnd() {

        if (!dragging) return;

        dragging = false;
        lampRigEl.classList.remove("desk-is-dragging");

    }

    [".desk-lamp-cord", ".desk-lamp-shade", ".desk-lamp-bulb-socket", ".desk-lamp-bulb"].forEach((selector) => {

        stageEl.querySelector(selector).addEventListener("mousedown", onGrabStart);

    });

    window.addEventListener("mousemove", onGrabMove);
    window.addEventListener("mouseup", onGrabEnd);

    // ============================================================
    // MONITOR: on/off state
    // ============================================================

    const monitorEl = document.getElementById("desk-monitor");
    const monitorScreenEl = document.getElementById("desk-monitor-screen");

    let monitorOn = false;

    function toggleMonitor() {

        monitorOn = !monitorOn;

        monitorEl.classList.toggle("desk-is-on", monitorOn);

    }

    monitorScreenEl.addEventListener("click", toggleMonitor);

    // ============================================================
    // THREE.JS — dust particles inside the light beam (only 3D
    // part of the whole scene). Created lazily, on the card's
    // first expand.
    // ============================================================

    const beamWrapEl = stageEl.querySelector(".desk-beam-wrap");
    const dustCanvas = document.getElementById("desk-dust-canvas");

    const DUST_COUNT = 42;

    let initialized = false;
    let running = false;
    let rafId = null;

    let dustScene, dustCamera, dustRenderer;
    let dustGeometry, dustMaterial, dustPositions;
    let dustT, dustSpeed, dustFrac, dustPhase;
    let clock, dustOpacity;
    let BEAM_W, BEAM_H, TOP_HALF_WIDTH, BOTTOM_HALF_WIDTH;

    function lerp(a, b, t) {

        return a + (b - a) * t;

    }

    function makeDustTexture() {

        const size = 64;
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;

        const ctx = c.getContext("2d");

        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
        );

        gradient.addColorStop(0, "rgba(255,235,200,0.9)");
        gradient.addColorStop(0.4, "rgba(255,210,150,0.5)");
        gradient.addColorStop(1, "rgba(255,200,140,0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        return new THREE.CanvasTexture(c);

    }

    function initScene() {

        // .desk-beam-wrap has a fixed pixel size (600x620), set
        // directly in CSS, so it's already measurable here even if
        // this is the card's very first expand.
        BEAM_W = beamWrapEl.clientWidth;
        BEAM_H = beamWrapEl.clientHeight;

        TOP_HALF_WIDTH = BEAM_W * 0.02;
        BOTTOM_HALF_WIDTH = BEAM_W * 0.5;

        dustScene = new THREE.Scene();

        dustCamera = new THREE.OrthographicCamera(
            -BEAM_W / 2,
            BEAM_W / 2,
            BEAM_H / 2,
            -BEAM_H / 2,
            0.1,
            10
        );

        dustCamera.position.z = 5;

        dustRenderer = new THREE.WebGLRenderer({
            canvas: dustCanvas,
            alpha: true,
            antialias: true
        });

        dustRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        dustRenderer.setSize(BEAM_W, BEAM_H);
        dustCanvas.style.opacity = "1";

        const dustTexture = makeDustTexture();

        dustT = new Float32Array(DUST_COUNT);
        dustSpeed = new Float32Array(DUST_COUNT);
        dustFrac = new Float32Array(DUST_COUNT);
        dustPhase = new Float32Array(DUST_COUNT);

        for (let i = 0; i < DUST_COUNT; i++) {

            dustT[i] = Math.random();
            dustSpeed[i] = 0.045 + Math.random() * 0.05;
            dustFrac[i] = Math.random() * 2 - 1;
            dustPhase[i] = Math.random() * Math.PI * 2;

        }

        dustPositions = new Float32Array(DUST_COUNT * 3);

        dustGeometry = new THREE.BufferGeometry();

        dustGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(dustPositions, 3)
        );

        dustMaterial = new THREE.PointsMaterial({

            map: dustTexture,
            size: 3.4,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            sizeAttenuation: false,
            blending: THREE.AdditiveBlending

        });

        const dustPoints = new THREE.Points(dustGeometry, dustMaterial);

        dustScene.add(dustPoints);

        clock = new THREE.Clock();
        dustOpacity = 0;

    }

    // ============================================================
    // ANIMATION LOOP — pendulum physics (when not dragging) and
    // dust particles, gated together by start()/stop().
    // ============================================================

    function animate() {

        if (!running) return;

        rafId = requestAnimationFrame(animate);

        // -------------------------
        // pendulum physics
        // -------------------------

        const now = performance.now();
        const physicsDt = Math.min((now - lastPhysicsTime) / 1000, 1 / 30);
        lastPhysicsTime = now;

        if (!dragging) {

            const angleRad = angle * Math.PI / 180;
            const angularVelRad = angularVel * Math.PI / 180;

            const angularAccelRad = -SPRING_K * angleRad - DAMPING * angularVelRad;

            angularVel += angularAccelRad * (180 / Math.PI) * physicsDt;
            angle += angularVel * physicsDt;

            if (Math.abs(angle) < 0.05 && Math.abs(angularVel) < 0.5) {

                angle = 0;
                angularVel = 0;

            }

            applyLampTransform();

        }

        // -------------------------
        // dust particle positions
        // -------------------------

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        for (let i = 0; i < DUST_COUNT; i++) {

            dustT[i] += dustSpeed[i] * delta;

            if (dustT[i] > 1) {

                dustT[i] -= 1;
                dustFrac[i] = Math.random() * 2 - 1;

            }

            const halfWidth = lerp(
                TOP_HALF_WIDTH,
                BOTTOM_HALF_WIDTH,
                dustT[i]
            );

            const sway = Math.sin(elapsed * 0.6 + dustPhase[i]) * 6;

            const x = dustFrac[i] * halfWidth + sway;
            const y = BEAM_H / 2 - dustT[i] * BEAM_H;

            dustPositions[i * 3] = x;
            dustPositions[i * 3 + 1] = y;
            dustPositions[i * 3 + 2] = 0;

        }

        dustGeometry.attributes.position.needsUpdate = true;

        // -------------------------
        // opacity fade based on lamp state
        // -------------------------

        const targetDustOpacity = lampOn ? 0.85 : 0;

        dustOpacity += (targetDustOpacity - dustOpacity) * 0.04;

        dustMaterial.opacity = dustOpacity;

        if (dustOpacity > 0.002) {

            dustRenderer.render(dustScene, dustCamera);

        }

    }

    // ============================================================
    // LIFECYCLE CONTROL: pauses/resumes the loop depending on
    // whether the card is expanded, to avoid consuming GPU/CPU in
    // the background while it's collapsed.
    // ============================================================

    function start() {

        if (!initialized) {
            initScene();
            initialized = true;
        }

        if (!running) {
            running = true;
            lastPhysicsTime = performance.now();
            rafId = requestAnimationFrame(animate);
        }
    }

    function stop() {

        running = false;

        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function syncWithCardState() {

        if (cardEl.classList.contains("is-expanded")) {
            start();
        } else {
            stop();
        }
    }

    new MutationObserver(syncWithCardState)
        .observe(cardEl, { attributes: true, attributeFilter: ["class"] });

    // Covers the case where the card is already expanded on load
    // (for example, navigating directly to an anchor inside it).
    syncWithCardState();

    // ============================================================
    // FULLSCREEN — native Fullscreen API on .lab-desk-frame (so the
    // button stays visible/clickable inside the fullscreen element).
    // Same pattern as js/galaxy.js, adapted: fitStage() has no
    // dependency on the Three.js scene being initialized, so unlike
    // galaxy's resizeToContainer() this doesn't need an
    // "initialized" guard before running.
    //
    // Resize is NOT left solely in the ResizeObserver's hands: in
    // real browsers, requestFullscreen() triggers an animated
    // OS/window-level transition, and "fullscreenchange" can fire
    // before the final layout has settled. If the ResizeObserver
    // happens to read an intermediate size from that animation and
    // doesn't fire again, the stage ends up scaled to the wrong
    // size. That's why fitStage() is also called explicitly here,
    // with a margin rAF to let the transition's layout finish
    // settling.
    // ============================================================

    const fullscreenBtn = frameEl.querySelector(".desk-fullscreen-btn");

    if (fullscreenBtn) {

        fullscreenBtn.addEventListener("click", () => {

            if (document.fullscreenElement === frameEl) {
                document.exitFullscreen();
            } else {
                frameEl.requestFullscreen();
            }
        });

        function updateFullscreenAria() {
            const isFullscreen = document.fullscreenElement === frameEl;
            fullscreenBtn.setAttribute(
                "aria-label",
                window.i18n.t(isFullscreen ? "desk.fullscreen_aria_collapse" : "desk.fullscreen_aria_expand")
            );
        }

        document.addEventListener("i18n:languagechange", updateFullscreenAria);

        document.addEventListener("fullscreenchange", () => {

            const isFullscreen =
                document.fullscreenElement === frameEl;

            fullscreenBtn.classList.toggle("is-fullscreen", isFullscreen);

            updateFullscreenAria();

            // Double rAF: the first one already runs in the frame
            // where the fullscreen layout was applied, the second
            // confirms that layout was actually painted before
            // measuring the size.
            requestAnimationFrame(() => {
                requestAnimationFrame(fitStage);
            });
        });
    }

}
