// ============================================================
// i18n del portafolio — ES/EN.
// Sin build step: diccionario plano + reemplazo de textContent/
// innerHTML/aria-label sobre elementos marcados con data-i18n*.
// Persistencia en localStorage; dispara 'i18n:languagechange' en
// document para que otros scripts (sunset.js, galaxy.js) puedan
// resincronizar el texto que ellos mismos escriben en runtime.
// ============================================================

(function () {
    const STORAGE_KEY = 'lang';
    const DEFAULT_LANG = 'es';

    const translations = {
        es: {
            'nav.toggle_aria': 'Abrir menú',
            'nav.animations': 'Animaciones',
            'nav.contact': 'Contacto',

            'hero.eyebrow': 'SOFTWARE DEVELOPER',
            'hero.tagline': 'Construyo cosas y aprendo construyéndolas.',
            'hero.description_1': 'Exploro desarrollo web, sistemas, algoritmos, bases de datos e inteligencia artificial.',
            'hero.description_2': 'Estudiante de Ingeniería de Sistemas en la Universidad Tecnológica de Pereira, actualmente enfocado en el desarrollo de software con asistencia de inteligencia artificial. Trabajo con NestJS, FastAPI, PostgreSQL y React, priorizando la comprensión profunda de cada solución que construyo por encima de la velocidad de entrega. Me interesa particularmente la integración de sistemas de IA en flujos de desarrollo reales, así como las buenas prácticas de seguridad y arquitectura de software.',
            'hero.cta_projects': 'Ver proyectos',
            'hero.cta_lab': 'Explorar laboratorio',
            'hero.aria_github': 'GitHub',
            'hero.aria_linkedin': 'LinkedIn',
            'hero.aria_email': 'Email',

            'projects.eyebrow': 'PROYECTOS',
            'projects.heading': 'Trabajo destacado',
            'project.reservas.mockup_alt': 'Portada ilustrada del sistema de reservas de canchas deportivas',
            'project.reservas.hint': 'Ver detalles del proyecto',
            'project.reservas.title': 'Sistema de Reservas de Canchas',
            'project.reservas.description': 'Plataforma full-stack para la gestión de reservas de canchas deportivas: los usuarios consultan disponibilidad y reservan horarios, mientras los administradores gestionan canchas y reservas desde un panel dedicado. Backend en NestJS con TypeORM sobre PostgreSQL; frontend en Next.js con TypeScript y Tailwind v4.',
            'project.section_label.stack': 'Stack técnico',
            'project.section_label.decisions': 'Decisiones técnicas',
            'project.reservas.decision_1': '<strong>Lock de concurrencia:</strong> bloqueo con <code>pg_advisory_xact_lock</code> a nivel de transacción para evitar reservas dobles sobre el mismo horario y cancha.',
            'project.reservas.decision_2': '<strong>Rate limiting en login:</strong> throttling por IP/usuario para mitigar ataques de fuerza bruta sobre las credenciales.',
            'project.reservas.decision_3': '<strong>Disponibilidad en tiempo real:</strong> el filtro de horarios cruza las reservas existentes contra el rango solicitado antes de confirmar, evitando condiciones de carrera visibles para el usuario.',
            'project.reservas.link_backend': 'Backend',
            'project.reservas.link_frontend': 'Frontend',
            'project.reservas.link_demo': 'Ver demo en vivo',
            'common.collapse_aria': 'Colapsar tarjeta',

            'lab.section_label.animations': 'Animaciones',
            'lab.logos.mockup_alt': 'Vista previa del experimento de animaciones',
            'lab.logos.hint': 'Ver galería de animaciones',
            'lab.logos.title': 'Animaciones',
            'lab.logos.description': 'Piezas visuales hechas a mano con CSS y SVG — sin frameworks, sin librerías de animación, solo transiciones y curvas construidas desde cero para entender cómo funcionan de verdad.',
            'lab.logos.gallery_svg_subtitle': 'Experimentos de animaciones',
            'sunset.scene_alt': 'Paisaje de montañas en atardecer, transformable a escena nocturna',
            'sunset.toggle_label_night': 'Noche',
            'sunset.toggle_label_day': 'Día',
            'lab.section_label.lab': 'Laboratorio',
            'lab.experiments.mockup_alt': 'Vista previa del laboratorio de experimentos',
            'lab.experiments.hint': 'Ver detalles del laboratorio',
            'lab.experiments.title': 'Laboratorio',
            'lab.experiments.description': 'Experimentos técnicos fuera del formato de un proyecto — donde pruebo cosas nuevas antes de saber si van a servir para algo. Por ahora, una galaxia interactiva construida con Three.js.',
            'lab.experiments.gallery_svg_subtitle': 'Pruebas y experimentos',
            'galaxy.fullscreen_aria_expand': 'Ver galaxia en pantalla completa',
            'galaxy.fullscreen_aria_collapse': 'Salir de pantalla completa',

            'skills.eyebrow': 'TECNOLOGÍAS',
            'skills.heading': 'Con qué trabajo',
            'skills.cluster.frontend': 'Frontend',
            'skills.cluster.backend': 'Backend',
            'skills.cluster.databases': 'Bases de datos',
            'skills.cluster.tools': 'Herramientas',
            'skills.cluster.learning': 'Aprendiendo',

            'contact.eyebrow': 'CONTACTO',
            'contact.heading': '¿Trabajamos juntos?',
            'contact.text': 'Siempre estoy abierto a conversar sobre proyectos, colaboraciones o simplemente para conectar. Si tienes una idea en mente o quieres charlar sobre desarrollo de software, escríbeme.',
            'contact.link_github': 'GitHub',
            'contact.link_linkedin': 'LinkedIn',

            'common.lang_switch_aria': 'Selector de idioma',
        },
        en: {
            'nav.toggle_aria': 'Open menu',
            'nav.animations': 'Animations',
            'nav.contact': 'Contact',

            'hero.eyebrow': 'SOFTWARE DEVELOPER',
            'hero.tagline': 'I build things and learn by building them.',
            'hero.description_1': 'I explore web development, systems, algorithms, databases, and artificial intelligence.',
            'hero.description_2': "Systems Engineering student at Universidad Tecnológica de Pereira, currently focused on AI-assisted software development. I work with NestJS, FastAPI, PostgreSQL, and React, prioritizing a deep understanding of every solution I build over delivery speed. I'm particularly interested in integrating AI systems into real development workflows, as well as security and software architecture best practices.",
            'hero.cta_projects': 'View projects',
            'hero.cta_lab': 'Explore lab',
            'hero.aria_github': 'GitHub',
            'hero.aria_linkedin': 'LinkedIn',
            'hero.aria_email': 'Email',

            'projects.eyebrow': 'PROJECTS',
            'projects.heading': 'Featured work',
            'project.reservas.mockup_alt': 'Illustrated cover of the sports court booking system',
            'project.reservas.hint': 'View project details',
            'project.reservas.title': 'Sports Court Booking System',
            'project.reservas.description': 'Full-stack platform for managing sports court bookings: users check availability and book time slots, while admins manage courts and bookings from a dedicated panel. Backend built with NestJS and TypeORM on PostgreSQL; frontend built with Next.js, TypeScript, and Tailwind v4.',
            'project.section_label.stack': 'Tech stack',
            'project.section_label.decisions': 'Technical decisions',
            'project.reservas.decision_1': '<strong>Concurrency lock:</strong> transaction-level locking with <code>pg_advisory_xact_lock</code> to prevent double bookings on the same time slot and court.',
            'project.reservas.decision_2': '<strong>Login rate limiting:</strong> per IP/user throttling to mitigate brute-force attacks against credentials.',
            'project.reservas.decision_3': '<strong>Real-time availability:</strong> the schedule filter cross-checks existing bookings against the requested range before confirming, preventing race conditions visible to the user.',
            'project.reservas.link_backend': 'Backend',
            'project.reservas.link_frontend': 'Frontend',
            'project.reservas.link_demo': 'View live demo',
            'common.collapse_aria': 'Collapse card',

            'lab.section_label.animations': 'Animations',
            'lab.logos.mockup_alt': 'Preview of the animation experiment',
            'lab.logos.hint': 'View animation gallery',
            'lab.logos.title': 'Animations',
            'lab.logos.description': 'Visual pieces hand-built with CSS and SVG — no frameworks, no animation libraries, just transitions and curves built from scratch to really understand how they work.',
            'lab.logos.gallery_svg_subtitle': 'Animation experiments',
            'sunset.scene_alt': 'Mountain landscape at sunset, transformable into a night scene',
            'sunset.toggle_label_night': 'Night',
            'sunset.toggle_label_day': 'Day',
            'lab.section_label.lab': 'Lab',
            'lab.experiments.mockup_alt': 'Preview of the experiments lab',
            'lab.experiments.hint': 'View lab details',
            'lab.experiments.title': 'Lab',
            'lab.experiments.description': "Technical experiments outside the usual project format — where I try new things before knowing whether they'll be useful. For now, an interactive galaxy built with Three.js.",
            'lab.experiments.gallery_svg_subtitle': 'Tests and experiments',
            'galaxy.fullscreen_aria_expand': 'View galaxy in fullscreen',
            'galaxy.fullscreen_aria_collapse': 'Exit fullscreen',

            'skills.eyebrow': 'TECHNOLOGIES',
            'skills.heading': 'What I work with',
            'skills.cluster.frontend': 'Frontend',
            'skills.cluster.backend': 'Backend',
            'skills.cluster.databases': 'Databases',
            'skills.cluster.tools': 'Tools',
            'skills.cluster.learning': 'Learning',

            'contact.eyebrow': 'CONTACT',
            'contact.heading': 'Want to work together?',
            'contact.text': "I'm always open to talk about projects, collaborations, or just to connect. If you have an idea in mind or want to chat about software development, reach out.",
            'contact.link_github': 'GitHub',
            'contact.link_linkedin': 'LinkedIn',

            'common.lang_switch_aria': 'Language switch',
        },
    };

    function getStoredLang() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'en' || stored === 'es' ? stored : DEFAULT_LANG;
    }

    let currentLang = getStoredLang();

    function t(key) {
        return translations[currentLang][key] ?? translations[DEFAULT_LANG][key] ?? key;
    }

    function apply() {
        document.documentElement.lang = currentLang;

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            el.textContent = t(el.getAttribute('data-i18n'));
        });

        document.querySelectorAll('[data-i18n-html]').forEach((el) => {
            el.innerHTML = t(el.getAttribute('data-i18n-html'));
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
            el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
        });

        document.querySelectorAll('.lang-switch-btn').forEach((btn) => {
            const isActive = btn.dataset.lang === currentLang;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });
    }

    function setLang(lang) {
        if (lang !== 'es' && lang !== 'en') return;
        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        apply();
        document.dispatchEvent(new CustomEvent('i18n:languagechange', { detail: { lang } }));
    }

    document.querySelectorAll('.lang-switch-btn').forEach((btn) => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    window.i18n = { t: t, setLang: setLang, getLang: function () { return currentLang; } };

    apply();
})();
