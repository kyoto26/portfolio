// ============================================================
// Portfolio i18n — ES/EN.
// No build step: flat dictionary + textContent/innerHTML/
// aria-label replacement on elements marked with data-i18n*.
// Persisted to localStorage; fires 'i18n:languagechange' on
// document so other scripts (sunset.js, galaxy.js) can
// resynchronize text they write themselves at runtime.
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
            'hero.aria_upwork': 'Upwork',

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
            'project.traductor.mockup_alt': 'Portada ilustrada del traductor de documentos con IA, con una página en inglés transformándose en español',
            'project.traductor.hint': 'Ver detalles del proyecto',
            'project.traductor.title': 'Traductor de Documentos con IA',
            'project.traductor.description': 'Herramienta para traducir documentos completos (EPUB, PDF, TXT) del inglés al español preservando el formato original, usando LLMs con contexto y glosario para lograr traducciones naturales en vez de literales. Backend en FastAPI con una representación intermedia (Document → Chapter → Block) que desacopla el formato de entrada del proceso de traducción; frontend en React con seguimiento de progreso en tiempo real. Actualmente en mejora activa: migrando del modelo local (Ollama) a uno más grande para aumentar la calidad de traducción y reducir la pérdida de contexto en documentos largos.',
            'project.traductor.decision_1': '<strong>Representación intermedia:</strong> arquitectura Document→Chapter→Block que desacopla extracción, traducción y reconstrucción — agregar un formato nuevo no toca el núcleo de traducción.',
            'project.traductor.decision_2': '<strong>Cliente LLM intercambiable:</strong> capa de abstracción que alterna entre un modelo local (Ollama) y la API de Claude sin cambiar el resto del sistema, con reporte de uso de tokens desde el diseño.',
            'project.traductor.decision_3': '<strong>Reflow de PDF:</strong> reconstrucción con la API Story de PyMuPDF para manejar que el texto traducido no ocupa el mismo espacio que el original, en vez de forzar posiciones fijas.',
            'project.traductor.link_source': 'Código fuente',
            'common.collapse_aria': 'Colapsar tarjeta',

            'lab.section_label.animations': 'Animaciones',
            'lab.logos.mockup_alt': 'Vista previa del experimento de animaciones',
            'lab.logos.hint': 'Ver galería de animaciones',
            'lab.logos.title': 'Animaciones',
            'lab.logos.description': 'Piezas visuales hechas a mano, explorando distintas formas de animar en la web — desde transiciones CSS y SVG construidas desde cero, hasta partículas en Three.js. El objetivo es siempre el mismo: entender cómo funcionan de verdad, sea cual sea la herramienta.',
            'lab.logos.gallery_svg_subtitle': 'Experimentos de animaciones',
            'sunset.scene_alt': 'Paisaje de montañas en atardecer, transformable a escena nocturna',
            'sunset.toggle_label_night': 'Noche',
            'sunset.toggle_label_day': 'Día',
            'lab.desk.title': 'Escritorio interactivo',
            'lab.desk.description': 'Lámpara con física de péndulo, monitor que enciende un editor de código y partículas de polvo en Three.js flotando dentro del haz de luz.',
            'desk.fullscreen_aria_expand': 'Ver escritorio en pantalla completa',
            'desk.fullscreen_aria_collapse': 'Salir de pantalla completa',
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
            'contact.link_upwork': 'Upwork',

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
            'hero.aria_upwork': 'Upwork',

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
            'project.traductor.mockup_alt': 'Illustrated cover of the AI document translator, showing an English page turning into Spanish',
            'project.traductor.hint': 'View project details',
            'project.traductor.title': 'AI Document Translator',
            'project.traductor.description': "Tool for translating full documents (EPUB, PDF, TXT) from English to Spanish while preserving the original formatting, using LLMs with context and a glossary to produce natural translations instead of literal ones. Backend built with FastAPI around an intermediate representation (Document → Chapter → Block) that decouples the input format from the translation process; frontend built with React with real-time progress tracking. Currently under active improvement: migrating from a local model (Ollama) to a larger one to increase translation quality and reduce context loss in long documents.",
            'project.traductor.decision_1': "<strong>Intermediate representation:</strong> a Document→Chapter→Block architecture that decouples extraction, translation, and reconstruction — adding a new format doesn't touch the translation core.",
            'project.traductor.decision_2': '<strong>Swappable LLM client:</strong> an abstraction layer that switches between a local model (Ollama) and the Claude API without changing the rest of the system, with token usage reporting built in from the start.',
            'project.traductor.decision_3': "<strong>PDF reflow:</strong> reconstruction using PyMuPDF's Story API to handle translated text not taking up the same space as the original, instead of forcing fixed positions.",
            'project.traductor.link_source': 'Source code',
            'common.collapse_aria': 'Collapse card',

            'lab.section_label.animations': 'Animations',
            'lab.logos.mockup_alt': 'Preview of the animation experiment',
            'lab.logos.hint': 'View animation gallery',
            'lab.logos.title': 'Animations',
            'lab.logos.description': 'Hand-built visual pieces exploring different ways of animating on the web — from CSS and SVG transitions built from scratch to Three.js particle effects. The goal stays the same: understanding how they really work, whatever the tool.',
            'lab.logos.gallery_svg_subtitle': 'Animation experiments',
            'sunset.scene_alt': 'Mountain landscape at sunset, transformable into a night scene',
            'sunset.toggle_label_night': 'Night',
            'sunset.toggle_label_day': 'Day',
            'lab.desk.title': 'Interactive desk',
            'lab.desk.description': 'A lamp with pendulum physics, a monitor that switches on a code editor, and Three.js dust particles floating inside the light beam.',
            'desk.fullscreen_aria_expand': 'View desk in fullscreen',
            'desk.fullscreen_aria_collapse': 'Exit fullscreen',
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
            'contact.link_upwork': 'Upwork',

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
