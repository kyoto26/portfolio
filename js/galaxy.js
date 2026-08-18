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
// CICLO DE VIDA: la escena solo se crea al primer expand de la
// card "Laboratorio", y el render loop se pausa/reanuda según
// la clase "is-expanded" del article, para no gastar recursos
// mientras la card está colapsada.
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

    // Definida antes de initScene para poder invocarla explícitamente
    // desde el handler de fullscreenchange, no solo desde el
    // ResizeObserver (ver bloque de PANTALLA COMPLETA más abajo).
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
        // ESCENA
        // ============================================================

        const scene = new THREE.Scene();

        scene.background = new THREE.Color(0x02030a);


        // ============================================================
        // CÁMARA
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
        // CONTROLES
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
        // CONFIGURACIÓN DE LA GALAXIA
        // ============================================================

        const starCount = 30000;

        const galaxyRadius = 25;

        const numberOfArms = 5;

        const spin = 0.35;


        // ============================================================
        // GEOMETRÍA DE LAS ESTRELLAS
        // ============================================================

        const positions = new Float32Array(
            starCount * 3
        );

        const colors = new Float32Array(
            starCount * 3
        );

        const starPalette = [
            new THREE.Color(0xffffff), // blanco
            new THREE.Color(0xcfe0ff), // blanco azulado
            new THREE.Color(0xaac4ff), // azul muy tenue
            new THREE.Color(0xfff2cc), // amarillo pálido
            new THREE.Color(0xffd9b3), // naranja tenue
        ];

        // Anclas del gradiente cálido (núcleo) / frío (bordes),
        // reutilizando dos tonos que ya existen en starPalette

        const coreColor = new THREE.Color(0xffd9b3); // naranja tenue

        const rimColor = new THREE.Color(0xaac4ff); // azul muy tenue


        // ============================================================
        // GENERACIÓN DE LA GALAXIA
        // ============================================================

        for (let i = 0; i < starCount; i++) {

            const i3 = i * 3;


            // --------------------------------------------------------
            // DISTANCIA AL CENTRO
            // --------------------------------------------------------

            const radius =
                Math.random() * galaxyRadius;


            // --------------------------------------------------------
            // BRAZO AL QUE PERTENECE
            // --------------------------------------------------------

            const arm =
                i % numberOfArms;


            // --------------------------------------------------------
            // ÁNGULO BASE DEL BRAZO
            // --------------------------------------------------------

            const armAngle =
                (arm / numberOfArms) * Math.PI * 2;


            // --------------------------------------------------------
            // CURVATURA DE LA ESPIRAL
            // --------------------------------------------------------

            const spinAngle =
                radius * spin;


            // --------------------------------------------------------
            // ÁNGULO FINAL
            // --------------------------------------------------------

            const angle =
                armAngle + spinAngle;


            // --------------------------------------------------------
            // DISPERSIÓN ALEATORIA
            // --------------------------------------------------------

            const random =
                (Math.random() - 0.5) * 2;


            // --------------------------------------------------------
            // POSICIÓN X
            // --------------------------------------------------------

            positions[i3] =
                Math.cos(angle) * radius + random;


            // --------------------------------------------------------
            // POSICIÓN Y
            // --------------------------------------------------------

            const height =
                (Math.random() - 0.5) *
                (3 - radius * 0.08);

            positions[i3 + 1] =
                height;


            // --------------------------------------------------------
            // POSICIÓN Z
            // --------------------------------------------------------

            positions[i3 + 2] =
                Math.sin(angle) * radius + random;


            // --------------------------------------------------------
            // COLOR DE LA ESTRELLA
            // --------------------------------------------------------

            // Tendencia cálido-centro / frío-borde según el radio

            const t =
                Math.min(radius / galaxyRadius, 1);


            // Jitter: evita que el gradiente se vea perfecto/artificial

            const jitteredT =
                Math.min(Math.max(t + (Math.random() - 0.5) * 0.3, 0), 1);

            const starColor =
                coreColor.clone().lerp(rimColor, jitteredT);


            // Pequeño empujón hacia un color de la paleta original

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
        // GALAXIA
        // ============================================================

        galaxy =
            new THREE.Points(
                geometry,
                material
            );

        scene.add(galaxy);


        // ============================================================
        // CONFIGURACIÓN DE LAS NEBULOSAS
        // ============================================================

        const nebulaParticleCount = 4200;

        const particlesPerTier =
            Math.floor(nebulaParticleCount / 3);

        // Dispersión ancha alrededor del brazo (más difusa que la de
        // las estrellas) para dar aspecto de neblina, no de línea

        const nebulaScatter = 4;

        const nebulaSizeTiers = [0.5, 0.8, 1.2];

        const nebulaOpacity = 0.1;

        // Tono único (regiones de hidrógeno ionizado)

        const nebulaColor = new THREE.Color(0xff8a3d);


        // ============================================================
        // GENERACIÓN DE LAS PARTÍCULAS DE NEBULOSA
        // ============================================================

        // Cada tier de tamaño es un THREE.Points independiente, ya
        // que PointsMaterial solo admite un tamaño fijo por objeto
        // (sin ShaderMaterial no hay tamaño por-partícula).

        // Las partículas se generan directamente sobre la misma
        // fórmula de brazo espiral que usan las estrellas (armAngle +
        // radius * spin), en vez de agruparse alrededor de centros —
        // así la neblina queda dispersa a lo largo de los brazos.

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


                // Misma fórmula de brazo espiral que usan las estrellas

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


                // Mismo grosor de disco que usan las estrellas

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
        // AGUJERO NEGRO
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
        // POST-PROCESADO
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

        // Fuera de la cadena activa del composer: se deja definido
        // como referencia del ejercicio, pero no se aplica al render.
        // composer.addPass(testPass);

        clock = new THREE.Clock();


        // ============================================================
        // POST-PROCESADO: distorsión real del agujero negro
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

        // Distancia cámara↔agujero negro de referencia (la vista
        // inicial, ya calibrada) y el uRadius que le corresponde.
        // Sirven para escalar uRadius según el zoom cada frame.

        distortionReferenceDistance =
            camera.position.length();

        distortionBaseRadius = 0.01;


        // ============================================================
        // RESIZE — atado al tamaño del contenedor #galaxy, no al
        // viewport, ya que vive dentro de una card expandible.
        // ============================================================

        resizeObserver = new ResizeObserver(resizeToContainer);

        resizeObserver.observe(galaxyEl);
    }


    // ============================================================
    // ANIMACIÓN
    // ============================================================

    function animate() {

        if (!running) return;

        rafId = requestAnimationFrame(animate);


        // Rotación global de la galaxia

        galaxy.rotation.y += 0.0008;


        // Actualizar controles

        controls.update();


        // Actualizar uniform de tiempo del shader de prueba

        testPass.uniforms.uTime.value =
            clock.getElapsedTime();


        // Proyectar el agujero negro a coordenadas de pantalla (UV)

        projectedBlackHole
            .copy(blackHole.position)
            .project(camera);

        distortionPass.uniforms.uCenter.value.set(
            (projectedBlackHole.x + 1) / 2,
            (projectedBlackHole.y + 1) / 2
        );


        // Escalar uRadius según la distancia actual de la cámara,
        // para que el área de distorsión no crezca/encoja con el zoom

        const currentDistance =
            camera.position.length();

        const scaledRadius =
            distortionBaseRadius *
            (distortionReferenceDistance / currentDistance);

        distortionPass.uniforms.uRadius.value =
            Math.min(Math.max(scaledRadius, 0.01), 0.6);


        // Renderizar (a través del composer de post-procesado)

        composer.render();
    }


    // ============================================================
    // CONTROL DE CICLO DE VIDA: pausa/reanuda el loop según si la
    // card "Laboratorio" está expandida, para no consumir GPU/CPU
    // en segundo plano mientras está colapsada.
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

    // Cubre el caso de que la card ya esté expandida al cargar
    // (por ejemplo, navegación directa a un ancla dentro de ella).
    syncWithCardState();


    // ============================================================
    // PANTALLA COMPLETA — Fullscreen API nativa sobre el wrapper
    // .lab-galaxy-frame (así el botón sigue visible/clickeable
    // dentro del elemento en fullscreen).
    //
    // El resize NO se deja solo en manos del ResizeObserver: en
    // navegadores reales, requestFullscreen() dispara una
    // transición animada a nivel de SO/ventana, y "fullscreenchange"
    // puede llegar antes de que el layout final (p.ej. 1920x1080)
    // esté asentado. Si el ResizeObserver llega a leer un tamaño
    // intermedio de esa animación y no vuelve a dispararse, el
    // renderer queda con un tamaño incorrecto (canvas ocupando solo
    // una fracción de la pantalla). Por eso acá se llama a
    // resizeToContainer() de forma explícita, con un rAF de margen
    // para dejar que el layout de la transición termine de asentar.
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

        document.addEventListener("fullscreenchange", () => {

            const isFullscreen =
                document.fullscreenElement === frameEl;

            fullscreenBtn.classList.toggle("is-fullscreen", isFullscreen);

            fullscreenBtn.setAttribute(
                "aria-label",
                isFullscreen
                    ? "Salir de pantalla completa"
                    : "Ver galaxia en pantalla completa"
            );

            if (!initialized) return;

            // Doble rAF: el primero corre ya en el frame donde el
            // layout de fullscreen se aplicó, el segundo confirma
            // que ese layout ya se pintó antes de medir el tamaño.
            requestAnimationFrame(() => {
                requestAnimationFrame(resizeToContainer);
            });
        });
    }
}
