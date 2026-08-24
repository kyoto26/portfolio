import * as THREE from "three";

import { OrbitControls } from
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

import { EffectComposer } from
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";

import { RenderPass } from
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";

import { ShaderPass } from
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js";


// ============================================================
// LIFECYCLE: the scene is only created on the first expand of
// the "Lab" card, and the render loop is paused/resumed based
// on the article's "is-expanded" class, to avoid spending
// resources while the card is collapsed.
// ============================================================

const galaxyEl = document.getElementById("galaxy");
const cardEl = document.getElementById("lab-experiments");

if (galaxyEl && cardEl) {

    let initialized = false;
    let running = false;
    let rafId = null;

    let camera, renderer, composer, controls, resizeObserver;
    let galaxy, testPass, distortionPass, clock;
    let blackHole, projectedBlackHole;
    let distortionReferenceDistance, distortionBaseRadius;

    // Defined before initScene so it can be called explicitly
    // from the fullscreenchange handler, not just from the
    // ResizeObserver (see the FULLSCREEN block further below).
    function resizeToContainer() {

        const width = galaxyEl.clientWidth;
        const height = galaxyEl.clientHeight;

        if (width === 0 || height === 0) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        composer.setSize(width, height);
    }

    function initScene() {

        // ============================================================
        // SCENE
        // ============================================================

        const scene = new THREE.Scene();

        scene.background = new THREE.Color(0x02030a);


        // ============================================================
        // CAMERA
        // ============================================================

        camera = new THREE.PerspectiveCamera(
            60,
            galaxyEl.clientWidth / galaxyEl.clientHeight,
            0.1,
            1000
        );

        camera.position.set(0, 18, 32);


        // ============================================================
        // RENDERER
        // ============================================================

        renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        renderer.setSize(
            galaxyEl.clientWidth,
            galaxyEl.clientHeight
        );

        galaxyEl.appendChild(renderer.domElement);


        // ============================================================
        // CONTROLS
        // ============================================================

        controls = new OrbitControls(
            camera,
            renderer.domElement
        );

        controls.enableDamping = true;

        controls.dampingFactor = 0.05;

        controls.minDistance = 5;

        controls.maxDistance = 100;


        // ============================================================
        // GALAXY CONFIGURATION
        // ============================================================

        const starCount = 30000;

        const galaxyRadius = 25;

        const numberOfArms = 5;

        const spin = 0.35;


        // ============================================================
        // STAR GEOMETRY
        // ============================================================

        const positions = new Float32Array(
            starCount * 3
        );

        const colors = new Float32Array(
            starCount * 3
        );

        const starPalette = [
            new THREE.Color(0xffffff), // white
            new THREE.Color(0xcfe0ff), // bluish white
            new THREE.Color(0xaac4ff), // very faint blue
            new THREE.Color(0xfff2cc), // pale yellow
            new THREE.Color(0xffd9b3), // faint orange
        ];

        // Anchors for the warm (core) / cool (edges) gradient,
        // reusing two tones that already exist in starPalette

        const coreColor = new THREE.Color(0xffd9b3); // faint orange

        const rimColor = new THREE.Color(0xaac4ff); // very faint blue


        // ============================================================
        // GALAXY GENERATION
        // ============================================================

        for (let i = 0; i < starCount; i++) {

            const i3 = i * 3;


            // --------------------------------------------------------
            // DISTANCE TO CENTER
            // --------------------------------------------------------

            const radius =
                Math.random() * galaxyRadius;


            // --------------------------------------------------------
            // ARM IT BELONGS TO
            // --------------------------------------------------------

            const arm =
                i % numberOfArms;


            // --------------------------------------------------------
            // ARM BASE ANGLE
            // --------------------------------------------------------

            const armAngle =
                (arm / numberOfArms) * Math.PI * 2;


            // --------------------------------------------------------
            // SPIRAL CURVATURE
            // --------------------------------------------------------

            const spinAngle =
                radius * spin;


            // --------------------------------------------------------
            // FINAL ANGLE
            // --------------------------------------------------------

            const angle =
                armAngle + spinAngle;


            // --------------------------------------------------------
            // RANDOM SCATTER
            // --------------------------------------------------------

            const random =
                (Math.random() - 0.5) * 2;


            // --------------------------------------------------------
            // X POSITION
            // --------------------------------------------------------

            positions[i3] =
                Math.cos(angle) * radius + random;


            // --------------------------------------------------------
            // Y POSITION
            // --------------------------------------------------------

            const height =
                (Math.random() - 0.5) *
                (3 - radius * 0.08);

            positions[i3 + 1] =
                height;


            // --------------------------------------------------------
            // Z POSITION
            // --------------------------------------------------------

            positions[i3 + 2] =
                Math.sin(angle) * radius + random;


            // --------------------------------------------------------
            // STAR COLOR
            // --------------------------------------------------------

            // Warm-center / cool-edge tendency based on radius

            const t =
                Math.min(radius / galaxyRadius, 1);


            // Jitter: keeps the gradient from looking perfect/artificial

            const jitteredT =
                Math.min(Math.max(t + (Math.random() - 0.5) * 0.3, 0), 1);

            const starColor =
                coreColor.clone().lerp(rimColor, jitteredT);


            // Small nudge toward a color from the original palette

            const paletteColor =
                starPalette[Math.floor(Math.random() * starPalette.length)];

            starColor.lerp(paletteColor, 0.15);

            starColor.toArray(colors, i3);
        }


        // ============================================================
        // BUFFER GEOMETRY
        // ============================================================

        const geometry =
            new THREE.BufferGeometry();

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                positions,
                3
            )
        );

        geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(
                colors,
                3
            )
        );


        // ============================================================
        // MATERIAL
        // ============================================================

        const material =
            new THREE.PointsMaterial({

                color: 0xffffff,

                vertexColors: true,

                size: 0.05,

                transparent: true,

                opacity: 0.8,

                blending: THREE.AdditiveBlending,

                depthWrite: false

            });


        // ============================================================
        // GALAXY
        // ============================================================

        galaxy =
            new THREE.Points(
                geometry,
                material
            );

        scene.add(galaxy);


        // ============================================================
        // NEBULA CONFIGURATION
        // ============================================================

        const nebulaParticleCount = 4200;

        const particlesPerTier =
            Math.floor(nebulaParticleCount / 3);

        // Wide scatter around the arm (more diffuse than the stars')
        // to give it a haze look rather than a line

        const nebulaScatter = 4;

        const nebulaSizeTiers = [0.5, 0.8, 1.2];

        const nebulaOpacity = 0.1;

        // Single hue (ionized hydrogen regions)

        const nebulaColor = new THREE.Color(0xff8a3d);


        // ============================================================
        // NEBULA PARTICLE GENERATION
        // ============================================================

        // Each size tier is an independent THREE.Points, since
        // PointsMaterial only supports one fixed size per object
        // (without a ShaderMaterial there's no per-particle size).

        // Particles are generated directly on the same spiral-arm
        // formula the stars use (armAngle + radius * spin), instead
        // of clustering around centers — so the haze stays spread
        // out along the arms.

        const nebulae = new THREE.Group();

        function createNebulaTexture() {

            const size = 128;

            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext("2d");

            const gradient = ctx.createRadialGradient(
                size / 2, size / 2, 0,
                size / 2, size / 2, size / 2
            );

            gradient.addColorStop(0, "rgba(255,255,255,1)");
            gradient.addColorStop(0.4, "rgba(255,255,255,0.5)");
            gradient.addColorStop(1, "rgba(255,255,255,0)");

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            return new THREE.CanvasTexture(canvas);
        }

        const nebulaTexture = createNebulaTexture();

        nebulaSizeTiers.forEach((tierSize) => {

            const tierPositions =
                new Float32Array(particlesPerTier * 3);

            for (let p = 0; p < particlesPerTier; p++) {

                const i3 = p * 3;


                // Same spiral-arm formula the stars use

                const radius =
                    Math.random() * galaxyRadius;

                const arm =
                    p % numberOfArms;

                const armAngleForParticle =
                    (arm / numberOfArms) * Math.PI * 2;

                const spinAngleForParticle =
                    radius * spin;

                const angle =
                    armAngleForParticle + spinAngleForParticle;

                const scatter =
                    (Math.random() - 0.5) * nebulaScatter;

                tierPositions[i3] =
                    Math.cos(angle) * radius + scatter;


                // Same disc thickness the stars use

                tierPositions[i3 + 1] =
                    (Math.random() - 0.5) * (3 - radius * 0.08);

                tierPositions[i3 + 2] =
                    Math.sin(angle) * radius + scatter;
            }

            const nebulaGeometry =
                new THREE.BufferGeometry();

            nebulaGeometry.setAttribute(
                "position",
                new THREE.BufferAttribute(tierPositions, 3)
            );

            const nebulaMaterial =
                new THREE.PointsMaterial({

                    size: tierSize,

                    map: nebulaTexture,

                    color: nebulaColor,

                    transparent: true,

                    opacity: nebulaOpacity,

                    blending: THREE.AdditiveBlending,

                    depthWrite: false

                });

            const nebulaPoints =
                new THREE.Points(
                    nebulaGeometry,
                    nebulaMaterial
                );

            nebulae.add(nebulaPoints);
        });

        galaxy.add(nebulae);


        // ============================================================
        // BLACK HOLE
        // ============================================================

        const blackHoleRadius = 0.6;

        const blackHoleGeometry =
            new THREE.SphereGeometry(
                blackHoleRadius,
                32,
                32
            );

        const blackHoleMaterial =
            new THREE.MeshBasicMaterial({
                color: 0x000000
            });

        blackHole =
            new THREE.Mesh(
                blackHoleGeometry,
                blackHoleMaterial
            );

        blackHole.position.set(0, 0, 0);

        scene.add(blackHole);


        // ============================================================
        // POST-PROCESSING
        // ============================================================

        const PassthroughShader = {

            uniforms: {
                tDiffuse: { value: null }
            },

            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,

            fragmentShader: `
                uniform sampler2D tDiffuse;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                }
            `
        };

        composer =
            new EffectComposer(renderer);

        composer.addPass(
            new RenderPass(scene, camera)
        );

        composer.addPass(
            new ShaderPass(PassthroughShader)
        );

        const TestShader = {

            uniforms: {
                tDiffuse: { value: null },
                uTime: { value: 0 },
                uCenter: { value: new THREE.Vector2(0.5, 0.5) }
            },

            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,

            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float uTime;
                uniform vec2 uCenter;
                varying vec2 vUv;

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);

                    float dist = distance(vUv, uCenter);

                    float falloff = 1.0 - smoothstep(0.0, 0.4, dist);

                    float pulse = 0.5 + 0.5 * sin(uTime);

                    vec3 tint = vec3(1.0, 0.3, 0.3) * falloff * pulse;

                    gl_FragColor = vec4(color.rgb + tint * 0.3, color.a);
                }
            `
        };

        testPass =
            new ShaderPass(TestShader);

        // Outside the composer's active chain: left defined as a
        // reference from the exercise, but not applied to the render.
        // composer.addPass(testPass);

        clock = new THREE.Clock();


        // ============================================================
        // POST-PROCESSING: actual black hole distortion
        // ============================================================

        const DistortionShader = {

            uniforms: {
                tDiffuse: { value: null },
                uCenter: { value: new THREE.Vector2(0.5, 0.5) },
                uRadius: { value: 0.25 },
                uStrength: { value: 0.05 }
            },

            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,

            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 uCenter;
                uniform float uRadius;
                uniform float uStrength;
                varying vec2 vUv;

                void main() {
                    vec2 delta = vUv - uCenter;
                    float dist = length(delta);

                    float falloff = 1.0 - smoothstep(0.0, uRadius, dist);

                    vec2 offset = dist > 0.0001
                        ? normalize(delta) * falloff * uStrength
                        : vec2(0.0);

                    vec2 warpedUv = vUv - offset;

                    gl_FragColor = texture2D(tDiffuse, warpedUv);
                }
            `
        };

        distortionPass =
            new ShaderPass(DistortionShader);

        composer.addPass(distortionPass);

        projectedBlackHole = new THREE.Vector3();

        // Reference camera↔black hole distance (the initial view,
        // already calibrated) and its corresponding uRadius.
        // Used to scale uRadius based on zoom every frame.

        distortionReferenceDistance =
            camera.position.length();

        distortionBaseRadius = 0.01;


        // ============================================================
        // RESIZE — tied to the #galaxy container's size, not the
        // viewport, since it lives inside an expandable card.
        // ============================================================

        resizeObserver = new ResizeObserver(resizeToContainer);

        resizeObserver.observe(galaxyEl);
    }


    // ============================================================
    // ANIMATION
    // ============================================================

    function animate() {

        if (!running) return;

        rafId = requestAnimationFrame(animate);


        // Global galaxy rotation

        galaxy.rotation.y += 0.0008;


        // Update controls

        controls.update();


        // Update the test shader's time uniform

        testPass.uniforms.uTime.value =
            clock.getElapsedTime();


        // Project the black hole onto screen coordinates (UV)

        projectedBlackHole
            .copy(blackHole.position)
            .project(camera);

        distortionPass.uniforms.uCenter.value.set(
            (projectedBlackHole.x + 1) / 2,
            (projectedBlackHole.y + 1) / 2
        );


        // Scale uRadius based on the camera's current distance, so
        // the distortion area doesn't grow/shrink with zoom

        const currentDistance =
            camera.position.length();

        const scaledRadius =
            distortionBaseRadius *
            (distortionReferenceDistance / currentDistance);

        distortionPass.uniforms.uRadius.value =
            Math.min(Math.max(scaledRadius, 0.01), 0.6);


        // Render (through the post-processing composer)

        composer.render();
    }


    // ============================================================
    // LIFECYCLE CONTROL: pauses/resumes the loop depending on
    // whether the "Lab" card is expanded, to avoid consuming
    // GPU/CPU in the background while it's collapsed.
    // ============================================================

    function start() {

        if (!initialized) {
            initScene();
            initialized = true;
        }

        if (!running) {
            running = true;
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
    // FULLSCREEN — native Fullscreen API on the .lab-galaxy-frame
    // wrapper (so the button stays visible/clickable inside the
    // fullscreen element).
    //
    // Resize is NOT left solely in the ResizeObserver's hands: in
    // real browsers, requestFullscreen() triggers an animated
    // OS/window-level transition, and "fullscreenchange" can fire
    // before the final layout (e.g. 1920x1080) has settled. If the
    // ResizeObserver happens to read an intermediate size from that
    // animation and doesn't fire again, the renderer ends up with
    // the wrong size (canvas taking up only a fraction of the
    // screen). That's why resizeToContainer() is called explicitly
    // here, with a margin rAF to let the transition's layout finish
    // settling.
    // ============================================================

    const frameEl = galaxyEl.closest(".lab-galaxy-frame");
    const fullscreenBtn = frameEl
        ? frameEl.querySelector(".galaxy-fullscreen-btn")
        : null;

    if (frameEl && fullscreenBtn) {

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
                window.i18n.t(isFullscreen ? "galaxy.fullscreen_aria_collapse" : "galaxy.fullscreen_aria_expand")
            );
        }

        document.addEventListener("i18n:languagechange", updateFullscreenAria);

        document.addEventListener("fullscreenchange", () => {

            const isFullscreen =
                document.fullscreenElement === frameEl;

            fullscreenBtn.classList.toggle("is-fullscreen", isFullscreen);

            updateFullscreenAria();

            if (!initialized) return;

            // Double rAF: the first one already runs in the frame
            // where the fullscreen layout was applied, the second
            // confirms that layout was actually painted before
            // measuring the size.
            requestAnimationFrame(() => {
                requestAnimationFrame(resizeToContainer);
            });
        });
    }
}
