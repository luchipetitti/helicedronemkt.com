// ===== INTRO / SPLASH DE ENTRADA =====
// La clase "js-intro" ya la decidió (o no) el script inline del <head>,
// antes del primer paint. Si no está, el splash nunca se mostró
// (CSS lo mantiene con display:none) y no hay nada que hacer acá.
if (document.documentElement.classList.contains('js-intro')) {
  const introSplash = document.getElementById('intro-splash');
  if (introSplash) {
    const INTRO_DURATION = 2000;  // ms: tiempo que se ve el logo armándose antes de abrir paso
    const INTRO_FADE_OUT = 650;   // debe coincidir con la transition de #intro-splash en style.css

    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      introSplash.classList.add('intro-hide');
      document.documentElement.classList.add('intro-done');
      document.body.style.overflow = '';
      try { sessionStorage.setItem('helicedrone-intro-seen', '1'); } catch (e) {}

      setTimeout(() => introSplash.remove(), INTRO_FADE_OUT);
    }, INTRO_DURATION);
  }
}


// ===== SIDEBAR (menú de 3 puntitos) =====
const navToggle = document.getElementById('nav-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const sidebarClose = document.getElementById('sidebar-close');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarBackdrop.classList.add('open');
  navToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarBackdrop.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  // No liberar el scroll si el click en un link de la sidebar abrió otra
  // capa (ej: "Marketing" abre .marketing-overlay): esa capa necesita el
  // body bloqueado. Solo se libera si no queda ningún overlay activo.
  if (!document.querySelector('.marketing-overlay.active, .modal-overlay.active')) {
    document.body.style.overflow = '';
  }
}

navToggle.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});
sidebarClose.addEventListener('click', closeSidebar);
sidebarBackdrop.addEventListener('click', closeSidebar);

sidebar.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeSidebar);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSidebar();
});


// ===== SIDEBAR: acordeón de subsecciones (Servicios / Proyectos) =====
// Botón separado del link principal (ver .sidebar-expand): así tocar la
// palabra "Servicios" navega y cierra el panel, mientras que la flechita
// solo despliega los sublinks sin salir del menú.
document.querySelectorAll('.sidebar-expand').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap = document.getElementById(btn.getAttribute('aria-controls'));
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    if (wrap) wrap.classList.toggle('expanded', !isOpen);
  });
});


// ===== SIDEBAR: resaltar la sección que se está viendo =====
// Cada link de .sidebar-nav cuyo href apunte a un id que existe en la
// página se vuelve "candidato". Un IntersectionObserver mira esos ids y
// prende la clase .active en el/los link(s) correspondientes. Las tarjetas
// de servicio (#servicio-tomas, etc.) además prenden el link padre
// "Servicios" y despliegan su acordeón, para que quede claro en qué
// subsección se está aunque el grupo esté colapsado.
const sidebarLinksBySection = new Map();
document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach(link => {
  const id = link.getAttribute('href').slice(1);
  if (!sidebarLinksBySection.has(id)) sidebarLinksBySection.set(id, []);
  sidebarLinksBySection.get(id).push(link);
});
const sidebarObservedSections = [...sidebarLinksBySection.keys()]
  .map(id => document.getElementById(id))
  .filter(Boolean);

function expandSidebarGroup(wrapId) {
  const wrap = document.getElementById(wrapId);
  const btn = document.querySelector(`.sidebar-expand[aria-controls="${wrapId}"]`);
  if (wrap && btn && btn.getAttribute('aria-expanded') !== 'true') {
    btn.setAttribute('aria-expanded', 'true');
    wrap.classList.add('expanded');
  }
}

function setActiveSidebarSection(id) {
  document.querySelectorAll('.sidebar-nav a.active').forEach(el => el.classList.remove('active'));
  (sidebarLinksBySection.get(id) || []).forEach(link => link.classList.add('active'));
  if (id.startsWith('servicio-')) {
    (sidebarLinksBySection.get('servicios') || []).forEach(link => link.classList.add('active'));
    expandSidebarGroup('sub-servicios');
  }
}

if (sidebarObservedSections.length && 'IntersectionObserver' in window) {
  const sidebarSectionObserver = new IntersectionObserver((entries) => {
    const mostVisible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (mostVisible) setActiveSidebarSection(mostVisible.target.id);
  }, { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
  sidebarObservedSections.forEach(section => sidebarSectionObserver.observe(section));
}


// ===== NAVBAR SCROLL STYLE =====
// Se usa una clase (no un color inline) para que el fondo del navbar
// respete el tema claro/oscuro actual en vez de quedar siempre oscuro.
// El listener es "passive" y se agrupa con requestAnimationFrame: así el
// scroll nunca espera a este cálculo para moverse, aunque se dispare
// muchas veces por segundo.
const navbarEl = document.querySelector('.navbar');
let navbarRafId = null;
window.addEventListener('scroll', () => {
  if (navbarRafId) return;
  navbarRafId = requestAnimationFrame(() => {
    navbarEl.classList.toggle('scrolled', window.scrollY > 60);
    navbarRafId = null;
  });
}, { passive: true });



// ===== OPEN / CLOSE MODAL (el modal/lightbox de proyecto, más abajo) =====
const modalEl = document.querySelector('.modal');
let lastFocusedEl = null; // para devolver el foco al cerrar (accesibilidad)

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  // Sin esta guarda, tocar Escape con el modal ya cerrado igual devolvía
  // el foco a lastFocusedEl (un elemento viejo) y liberaba el scroll.
  if (!overlay.classList.contains('active')) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  modalEl.classList.remove('modal--project');
  // Vaciar el contenido detiene cualquier <video>/<iframe> que estuviera
  // reproduciéndose (al sacarlo del DOM corta la reproducción).
  document.getElementById('modal-content').innerHTML = '';
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});


// ===== SERVICIO DE MARKETING: página flotante =====
// Overlay independiente del modal genérico (ver .marketing-overlay en
// style.css): más grande, con su propio hero, y se abre desde el CTA
// "Servicio de Marketing" del hero y de la barra lateral.
const marketingOverlay = document.getElementById('marketing-overlay');
let marketingLastFocusedEl = null;

function openMarketingPage() {
  if (!marketingOverlay) return;
  marketingLastFocusedEl = document.activeElement;
  marketingOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  marketingOverlay.querySelector('.marketing-close').focus();
}

function closeMarketingPage() {
  if (!marketingOverlay || !marketingOverlay.classList.contains('active')) return;
  marketingOverlay.classList.remove('active');
  document.body.style.overflow = '';
  if (marketingLastFocusedEl && typeof marketingLastFocusedEl.focus === 'function') marketingLastFocusedEl.focus();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMarketingPage();
});


// ===== FOCUS TRAP (compartido por los 3 overlays) =====
// Mientras un overlay está abierto (.active), Tab / Shift+Tab quedan
// encerrados dentro de su diálogo, en vez de saltar a los links de la
// página de atrás. Sirve para el modal de servicio, el de proyecto
// (ambos usan .modal) y la página de Marketing (.marketing-page).
function getOpenDialog() {
  return document.querySelector('.marketing-overlay.active .marketing-page')
      || document.querySelector('.modal-overlay.active .modal')
      || null;
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const dialog = getOpenDialog();
  if (!dialog) return;

  const focusables = Array.from(dialog.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null || el === document.activeElement);
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (e.shiftKey && (active === first || !dialog.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
    e.preventDefault();
    first.focus();
  }
});


// ===== CONTACT FORM: arma el mensaje y abre WhatsApp =====
const WHATSAPP_NUMBER = '5493534273691'; // +54 9 353 427-3691

function handleForm(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const status = document.getElementById('form-status');
  const originalLabel = btn.textContent;

  const nombre = form.nombre.value.trim();
  const email = form.email.value.trim();
  const servicio = form.servicio.value;
  const mensaje = form.mensaje.value.trim();

  const lineas = [
    'Hola! Quiero consultar por un proyecto con Hélice Drone.',
    '',
    `Nombre: ${nombre}`,
    `Email: ${email}`,
  ];
  if (servicio) lineas.push(`Servicio: ${servicio}`);
  lineas.push(`Mensaje: ${mensaje}`);

  const texto = encodeURIComponent(lineas.join('\n'));
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${texto}`, '_blank');

  btn.textContent = 'Abrimos WhatsApp ✓';
  btn.style.background = '#00e5ff';
  if (status) {
    status.textContent = 'Se abrió WhatsApp con tu mensaje ya armado: solo tenés que enviarlo.';
    status.className = 'form-status success';
  }
  form.reset();

  setTimeout(() => {
    btn.textContent = originalLabel;
    btn.style.background = '';
  }, 4000);
}


// ===== PROYECTOS: DATA + RENDER =====
// Fuente única de verdad de cada proyecto. Para agregar uno nuevo alcanza
// con sumar un objeto acá; el render, el carrusel y el modal se arman solos.
//
// media.type acepta:
//   'image'   -> { type: 'image', src: 'ruta/o/url.jpg' }
//   'video'   -> { type: 'video', src: 'ruta/o/url.mp4', poster: 'opcional.jpg',
//                  preview: 'clip-corto.mp4' (opcional), reel: true (opcional) }
//
// Los reels de Instagram van como 'video' con reel: true (tarjeta vertical)
// y dos archivos: `preview` es un clip de 8 s sin audio que se reproduce
// solo en la miniatura, y `src` el reel completo (con audio) del modal.
//   'youtube' -> { type: 'youtube', videoId: 'XXXXXXXXXXX' }
//   'vimeo'   -> { type: 'vimeo', videoId: '000000000' }
const categoryLabels = {
  tomas: 'Tomas Aéreas',
  inmobiliaria: 'Inmobiliarias',
  eventos: 'Eventos Privados',
  viajes: 'Viajes & Turismo',
  villamaria: 'Villa María',
};

const projectsData = [
  // --- TOMAS AÉREAS ---
  {
    id: 'tomas-reel-manisel', category: 'tomas', title: 'Rodaje de obra: llenado de pozos',
    client: 'Planta MANISEL · Pasco',
    description: 'Un rodaje durante la mañana, cuando se llenaron los pozos para poder avanzar con la obra de los tanques biodigestores.',
    thumbnail: 'assets/projects/tomas/reel-manisel-rodaje.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/tomas/reel-manisel-rodaje.mp4', preview: 'assets/projects/tomas/reel-manisel-rodaje-preview.mp4', poster: 'assets/projects/tomas/reel-manisel-rodaje.jpg' },
  },
  {
    id: 'tomas-reel-seguimiento', category: 'tomas', title: 'Seguimiento de obra terminado',
    client: 'Planta MANISEL · Pasco',
    description: 'El cierre del seguimiento aéreo de la obra: el registro de cada etapa, de principio a fin.',
    thumbnail: 'assets/projects/tomas/reel-seguimiento-terminado.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/tomas/reel-seguimiento-terminado.mp4', preview: 'assets/projects/tomas/reel-seguimiento-terminado-preview.mp4', poster: 'assets/projects/tomas/reel-seguimiento-terminado.jpg' },
  },
  {
    id: 'tomas-2', category: 'tomas', title: 'Instalación de tanques biodigestores',
    client: 'Planta MANISEL · Pasco',
    description: 'Vista cenital de los tanques recién instalados y las zanjas de conexión.',
    thumbnail: 'assets/projects/tomas/2.jpg',
    media: { type: 'image', src: 'assets/projects/tomas/2.jpg' },
  },
  {
    id: 'tomas-3', category: 'villamaria', title: 'Puente sobre el río en Villa María',
    client: 'Contenido propio',
    description: 'Sobrevuelo cinematográfico del puente y el río al atardecer.',
    thumbnail: 'assets/projects/tomas/3.jpg',
    media: { type: 'image', src: 'assets/projects/tomas/3.jpg' },
  },
  {
    id: 'tomas-4', category: 'tomas', title: 'Obra en estación de GNC',
    client: 'Autopista Córdoba–Rosario',
    description: 'Seguimiento aéreo de cada etapa de instalación, para reporte de progreso y difusión.',
    thumbnail: 'assets/projects/tomas/4.jpg',
    media: { type: 'image', src: 'assets/projects/tomas/4.jpg' },
  },
  {
    id: 'tomas-5', category: 'tomas', title: 'Seguimiento de instalación',
    client: 'Planta MANISEL · Pasco',
    description: 'Seguimiento de cerca de cada etapa de instalación de los tanques en el predio.',
    thumbnail: 'assets/projects/tomas/5.jpg',
    media: { type: 'image', src: 'assets/projects/tomas/5.jpg' },
  },

  // --- INMOBILIARIAS ---
  {
    id: 'inmobiliaria-reel-innovar', category: 'inmobiliaria', title: 'Departamento en alquiler',
    client: 'Innovar Inmobiliaria · Altos del Río',
    description: 'Recorrido aéreo y por dentro de un departamento de 2 dormitorios.',
    thumbnail: 'assets/projects/inmobiliaria/reel-innovar-altos-del-rio.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/inmobiliaria/reel-innovar-altos-del-rio.mp4', preview: 'assets/projects/inmobiliaria/reel-innovar-altos-del-rio-preview.mp4', poster: 'assets/projects/inmobiliaria/reel-innovar-altos-del-rio.jpg' },
  },
  {
    id: 'inmobiliaria-2', category: 'inmobiliaria', title: 'Propiedad comercial en alquiler',
    client: 'Eugenia Astiz Negocios Inmobiliarios',
    description: 'Vista aérea del predio, los galpones y su ubicación estratégica.',
    thumbnail: 'assets/projects/inmobiliaria/reel-eugenia-astiz-galpon.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/inmobiliaria/reel-eugenia-astiz-galpon.mp4', preview: 'assets/projects/inmobiliaria/reel-eugenia-astiz-galpon-preview.mp4', poster: 'assets/projects/inmobiliaria/reel-eugenia-astiz-galpon.jpg' },
  },
  {
    id: 'inmobiliaria-edificio-1', category: 'inmobiliaria', title: 'Piletas',
    client: 'Complejo Altos del Río · Villa María',
    description: 'Vista cenital de las piletas del complejo.',
    thumbnail: 'assets/projects/inmobiliaria/edificio-1.jpg',
    media: { type: 'image', src: 'assets/projects/inmobiliaria/edificio-1.jpg' },
  },
  {
    id: 'inmobiliaria-edificio-2', category: 'inmobiliaria', title: 'Edificio desde el parque',
    client: 'Complejo Altos del Río · Villa María',
    description: 'La fachada y el jardín, a la altura del peatón.',
    thumbnail: 'assets/projects/inmobiliaria/edificio-2.jpg',
    media: { type: 'image', src: 'assets/projects/inmobiliaria/edificio-2.jpg' },
  },
  {
    id: 'inmobiliaria-edificio-3', category: 'inmobiliaria', title: 'Terrazas con pileta',
    client: 'Complejo Altos del Río · Villa María',
    description: 'Las terrazas de los últimos pisos, sobre el bosque.',
    thumbnail: 'assets/projects/inmobiliaria/edificio-3.jpg',
    media: { type: 'image', src: 'assets/projects/inmobiliaria/edificio-3.jpg' },
  },
  {
    id: 'inmobiliaria-edificio-4', category: 'inmobiliaria', title: 'Vista aérea del complejo',
    client: 'Complejo Altos del Río · Villa María',
    description: 'El edificio de frente, con la arboleda y las cocheras.',
    thumbnail: 'assets/projects/inmobiliaria/edificio-4.jpg',
    media: { type: 'image', src: 'assets/projects/inmobiliaria/edificio-4.jpg' },
  },

  // --- EVENTOS PRIVADOS ---
  {
    id: 'eventos-reel-megaexpo-domingo', category: 'eventos', title: '4ta MegaExpo: cobertura aérea completa',
    client: 'Agrupación Almafierrera · Villa Nueva',
    description: 'Un domingo lleno de pasión y fierros: la cobertura aérea del cierre de la 4ta MegaExpo Multimarcas.',
    thumbnail: 'assets/projects/eventos/reel-megaexpo-domingo.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/eventos/reel-megaexpo-domingo.mp4', preview: 'assets/projects/eventos/reel-megaexpo-domingo-preview.mp4', poster: 'assets/projects/eventos/reel-megaexpo-domingo.jpg' },
  },
  {
    id: 'eventos-reel-megaexpo-destrezas', category: 'eventos', title: 'Destrezas 4x4 en la MegaExpo',
    client: 'Parque Hipólito Yrigoyen · Villa Nueva',
    description: 'El primer día de la MegaExpo: destrezas 4x4, vehículos clásicos, camiones, motos, stands y música en vivo.',
    thumbnail: 'assets/projects/eventos/reel-megaexpo-destrezas.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/eventos/reel-megaexpo-destrezas.mp4', preview: 'assets/projects/eventos/reel-megaexpo-destrezas-preview.mp4', poster: 'assets/projects/eventos/reel-megaexpo-destrezas.jpg' },
  },
  {
    id: 'eventos-reel-megaexpo-arranque', category: 'eventos', title: 'Arranca la MegaExpo',
    client: 'Agrupación Almafierrera · Villa Nueva',
    description: 'Contra todo pronóstico, el predio listo para el día más esperado de la 4ta MegaExpo.',
    thumbnail: 'assets/projects/eventos/reel-megaexpo-arranque.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/eventos/reel-megaexpo-arranque.mp4', preview: 'assets/projects/eventos/reel-megaexpo-arranque-preview.mp4', poster: 'assets/projects/eventos/reel-megaexpo-arranque.jpg' },
  },
  {
    id: 'eventos-reel-megaexpo-gracias', category: 'eventos', title: 'Más de 500 vehículos',
    client: 'Agrupación Almafierrera · Villa Nueva',
    description: 'El balance de la 4ta MegaExpo, declarada de interés municipal: más de 500 vehículos en el predio.',
    thumbnail: 'assets/projects/eventos/reel-megaexpo-gracias.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/eventos/reel-megaexpo-gracias.mp4', preview: 'assets/projects/eventos/reel-megaexpo-gracias-preview.mp4', poster: 'assets/projects/eventos/reel-megaexpo-gracias.jpg' },
  },
  {
    id: 'eventos-reel-aeroclub', category: 'eventos', title: 'Jornada de paracaidismo',
    client: 'Aeroclub Villa María',
    description: 'Cada despegue y cada salto de la jornada en el Aeroclub, desde nuestro lente.',
    thumbnail: 'assets/projects/eventos/reel-aeroclub.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/eventos/reel-aeroclub.mp4', preview: 'assets/projects/eventos/reel-aeroclub-preview.mp4', poster: 'assets/projects/eventos/reel-aeroclub.jpg' },
  },
  {
    id: 'eventos-cano', category: 'eventos', title: 'Jornada STIHL en CANO',
    client: 'CANO Riego y Jardín',
    description: 'Los gazebos de STIHL y la gente frente al local, desde el aire.',
    thumbnail: 'assets/projects/eventos/cano-stihl.jpg',
    media: { type: 'image', src: 'assets/projects/eventos/cano-stihl.jpg' },
  },
  {
    id: 'eventos-1', category: 'eventos', title: 'Estadio desde arriba',
    client: 'Plaza Ocampo · Villa María',
    description: 'Vista aérea del estadio y la cancha completa.',
    thumbnail: 'assets/projects/eventos/1.jpg',
    media: { type: 'image', src: 'assets/projects/eventos/1.jpg' },
  },
  {
    id: 'eventos-2', category: 'eventos', title: 'Carrera de karting',
    client: 'General Cabrera · Córdoba',
    description: 'Vistas aéreas de la carrera y el circuito en general.',
    thumbnail: 'assets/projects/eventos/2.jpg',
    media: { type: 'image', src: 'assets/projects/eventos/2.jpg' },
  },
  {
    id: 'eventos-3', category: 'eventos', title: 'Partido de fútbol',
    client: 'Liga local · Las Perdices',
    description: 'Vista general de la cancha y los jugadores en acción.',
    thumbnail: 'assets/projects/eventos/3.jpg',
    media: { type: 'image', src: 'assets/projects/eventos/3.jpg' },
  },
  {
    id: 'eventos-4', category: 'eventos', title: 'Tribuna a pleno',
    client: 'Liga Villamariense de Fútbol',
    description: 'La tribuna a pleno de público y banderas, en la final del Torneo Apertura.',
    thumbnail: 'assets/projects/eventos/4.jpg',
    media: { type: 'image', src: 'assets/projects/eventos/4.jpg' },
  },
  {
    id: 'eventos-5', category: 'eventos', title: 'Estadio al atardecer',
    client: 'Estadio Mario Alberto Kempes · Córdoba',
    description: 'El estadio vacío, recortado contra un cielo de atardecer.',
    thumbnail: 'assets/projects/eventos/5.jpg',
    media: { type: 'image', src: 'assets/projects/eventos/5.jpg' },
  },
  {
    id: 'eventos-6', category: 'eventos', title: 'Estadio completo desde el aire',
    client: 'Estadio Mario Alberto Kempes · Córdoba',
    description: 'Vista panorámica del estadio y todo su entorno.',
    thumbnail: 'assets/projects/eventos/6.jpg',
    media: { type: 'image', src: 'assets/projects/eventos/6.jpg' },
  },
  {
    id: 'eventos-7', category: 'eventos', title: 'Saludo previo al partido',
    client: 'Plaza Ocampo · Villa María',
    description: 'El saludo entre planteles, justo antes del pitazo inicial.',
    thumbnail: 'assets/projects/eventos/7.jpg',
    media: { type: 'image', src: 'assets/projects/eventos/7.jpg' },
  },

  // --- VIAJES & TURISMO ---
  {
    id: 'viajes-1', category: 'viajes', title: 'Costanera y río',
    client: 'Corrientes',
    description: 'La costanera, el parque y el río, captados desde el aire.',
    thumbnail: 'assets/projects/viajes/1.jpg',
    media: { type: 'image', src: 'assets/projects/viajes/1.jpg' },
  },
  {
    id: 'viajes-2', category: 'villamaria', title: 'Villa María Golf Club',
    client: 'Villa María · Córdoba',
    description: 'El campo de golf y todas sus instalaciones.',
    thumbnail: 'assets/projects/viajes/2.jpg',
    media: { type: 'image', src: 'assets/projects/viajes/2.jpg' },
  },
  {
    id: 'viajes-3', category: 'viajes', title: 'Excursión por los esteros',
    client: 'Esteros del Iberá · Corrientes',
    description: 'Un yacaré asomando entre los juncos, junto al grupo en la lancha.',
    thumbnail: 'assets/projects/viajes/3.jpg',
    media: { type: 'image', src: 'assets/projects/viajes/3.jpg' },
  },
  {
    id: 'viajes-4', category: 'viajes', title: 'Alojamiento en contenedor remodelado',
    client: 'Las Perdices · Córdoba',
    description: 'Recorrido por el interior del contenedor remodelado, ideal para atraer huéspedes.',
    thumbnail: 'assets/projects/viajes/4.jpg',
    media: { type: 'image', src: 'assets/projects/viajes/4.jpg' },
  },

  // --- VILLA MARÍA ---
  // La ciudad desde el aire, separada del resto. El puente (tomas-3) y el
  // golf (viajes-2) mantienen su id y sus fotos en las carpetas de antes.
  {
    id: 'villamaria-reel-circunvalacion', category: 'villamaria', title: 'Nueva Circunvalación Sur',
    client: 'Villa María – Villa Nueva',
    description: 'Antes de la inauguración, recorrimos en auto con el modo seguimiento parte de la nueva Circunvalación Sur.',
    thumbnail: 'assets/projects/villamaria/reel-circunvalacion.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/villamaria/reel-circunvalacion.mp4', preview: 'assets/projects/villamaria/reel-circunvalacion-preview.mp4', poster: 'assets/projects/villamaria/reel-circunvalacion.jpg' },
  },
  {
    id: 'villamaria-reel-cara-al-sol', category: 'villamaria', title: 'La ciudad de cara al sol',
    client: 'Villa María · Córdoba',
    description: 'El cielo encendido sobre la ciudad en un atardecer nublado.',
    thumbnail: 'assets/projects/villamaria/reel-ciudad-cara-al-sol.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/villamaria/reel-ciudad-cara-al-sol.mp4', preview: 'assets/projects/villamaria/reel-ciudad-cara-al-sol-preview.mp4', poster: 'assets/projects/villamaria/reel-ciudad-cara-al-sol.jpg' },
  },
  {
    id: 'villamaria-reel-hora-dorada', category: 'villamaria', title: 'Hora dorada sobre la ciudad',
    client: 'Villa María · Córdoba',
    description: 'La hora dorada tiñe de naranja los rincones que caminamos todos los días.',
    thumbnail: 'assets/projects/villamaria/reel-hora-dorada.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/villamaria/reel-hora-dorada.mp4', preview: 'assets/projects/villamaria/reel-hora-dorada-preview.mp4', poster: 'assets/projects/villamaria/reel-hora-dorada.jpg' },
  },
  {
    id: 'villamaria-reel-cielo-rosado', category: 'villamaria', title: 'Cielo rosado después de la lluvia',
    client: 'Villa María · Córdoba',
    description: 'La ciudad bajo un cielo rosado, apenas pasada la tormenta.',
    thumbnail: 'assets/projects/villamaria/reel-cielo-rosado.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/villamaria/reel-cielo-rosado.mp4', preview: 'assets/projects/villamaria/reel-cielo-rosado-preview.mp4', poster: 'assets/projects/villamaria/reel-cielo-rosado.jpg' },
  },
  {
    id: 'villamaria-reel-unvm-atardecer', category: 'villamaria', title: 'Últimos rayos de sol en la UNVM',
    client: 'Campus UNVM · Villa María',
    description: 'Los últimos rayos de sol sobre el campus de la Universidad Nacional de Villa María.',
    thumbnail: 'assets/projects/villamaria/reel-unvm-atardecer.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/villamaria/reel-unvm-atardecer.mp4', preview: 'assets/projects/villamaria/reel-unvm-atardecer-preview.mp4', poster: 'assets/projects/villamaria/reel-unvm-atardecer.jpg' },
  },
  {
    id: 'villamaria-reel-unvm-tormenta', category: 'villamaria', title: 'Atardecer tormentoso en el campus',
    client: 'Campus UNVM · Villa María',
    description: 'Un atardecer tormentoso sobre el campus, mientras esperábamos la lluvia.',
    thumbnail: 'assets/projects/villamaria/reel-unvm-tormenta.jpg',
    media: { type: 'video', reel: true, src: 'assets/projects/villamaria/reel-unvm-tormenta.mp4', preview: 'assets/projects/villamaria/reel-unvm-tormenta-preview.mp4', poster: 'assets/projects/villamaria/reel-unvm-tormenta.jpg' },
  },
  {
    id: 'villamaria-tardecita', category: 'villamaria', title: 'La ciudad a la tardecita',
    client: 'Villa María · Córdoba',
    description: 'Las luces de la ciudad empezando a encenderse, en foto aérea.',
    thumbnail: 'assets/projects/villamaria/ciudad-tardecita-1.jpg',
    media: { type: 'image', src: 'assets/projects/villamaria/ciudad-tardecita-1.jpg' },
  },
];

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function projectSlideHTML(p) {
  const isVideo = p.media && p.media.type !== 'image';
  // Solo el video local (media.type 'video') se puede previsualizar andando
  // en la miniatura; youtube/vimeo se quedan con la imagen + ícono de play,
  // que ya abren el reproductor en el modal.
  const isPlayableThumb = p.media && p.media.type === 'video' && p.media.src;
  const isReel = isPlayableThumb && p.media.reel;
  const label = `${categoryLabels[p.category] || ''} — ${p.title}`;
  const media = isPlayableThumb
    ? `<video class="project-slide-video" src="${p.media.preview || p.media.src}" poster="${p.thumbnail}"
             muted loop playsinline preload="metadata" aria-hidden="true"
             onloadeddata="this.classList.add('loaded')"
             onerror="this.style.display='none'; this.parentElement.classList.add('empty')"></video>`
    : `<img src="${p.thumbnail}" alt="${escapeHTML(p.title)}" loading="lazy" decoding="async"
           onload="this.classList.add('loaded')"
           onerror="this.style.display='none'; this.parentElement.classList.add('empty')">`;
  return `
    <div class="project-slide${isReel ? ' project-slide--reel' : ''}" data-id="${p.id}" data-label="${escapeHTML(label)}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="Ver proyecto: ${escapeHTML(p.title)}">
      ${media}
      <span class="project-slide-expand" aria-hidden="true">+</span>
      ${isVideo && !isPlayableThumb ? '<span class="project-slide-play" aria-hidden="true">▶</span>' : ''}
      <span class="project-slide-overlay"><span class="project-slide-title">${escapeHTML(p.title)}</span></span>
    </div>`;
}

// Las miniaturas con video (.project-slide-video) arrancan a reproducirse
// solas un poco antes de entrar en pantalla, y se pausan al salir: así el
// carrusel no gasta ancho de banda de sobra reproduciendo clips fuera de
// vista. Andan aunque Windows tenga apagadas las animaciones (como en la web
// de Instalaciones Mateo): son clips mudos y en loop, no movimiento de la UI.
function setupProjectVideoAutoplay() {
  const videos = document.querySelectorAll('.project-slide-video');
  if (!videos.length) return;
  videos.forEach(v => {
    // los navegadores solo dejan arrancar solo a un video mudo
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
  });
  if (!('IntersectionObserver' in window)) {
    videos.forEach(v => v.play().catch(() => {}));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0, rootMargin: '150px' });
  videos.forEach(v => observer.observe(v));
}

function renderProjects() {
  const byCategory = projectsData.reduce((acc, p) => {
    (acc[p.category] || (acc[p.category] = [])).push(p);
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([category, items]) => {
    const track = document.querySelector(`#panel-${category} .carousel-track`);
    if (!track) return;
    // los reels van primero en cada pestaña; el resto respeta el orden de projectsData
    const isReel = p => p.media && p.media.reel ? 1 : 0;
    items.sort((a, b) => isReel(b) - isReel(a));
    track.innerHTML = items.map(projectSlideHTML).join('');
  });
  // Las miniaturas recién se insertan acá, así que el observer de autoplay
  // se arma después de tener los <video> ya en el DOM.
  setupProjectVideoAutoplay();
}
renderProjects();


// ===== PROYECTOS: MODAL / LIGHTBOX DE PROYECTO =====
function projectMediaHTML(media, title) {
  if (!media) return '';
  const safeTitle = escapeHTML(title);

  if (media.type === 'youtube') {
    return `<div class="project-modal-media">
      <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(media.videoId)}?rel=0&modestbranding=1"
        title="${safeTitle}" loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        onerror="this.closest('.project-modal-media').classList.add('empty')"></iframe>
    </div>`;
  }
  if (media.type === 'vimeo') {
    return `<div class="project-modal-media">
      <iframe src="https://player.vimeo.com/video/${encodeURIComponent(media.videoId)}"
        title="${safeTitle}" loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture" allowfullscreen
        onerror="this.closest('.project-modal-media').classList.add('empty')"></iframe>
    </div>`;
  }
  if (media.type === 'video') {
    return `<div class="project-modal-media${media.reel ? ' project-modal-media--reel' : ''}">
      <video src="${media.src}" ${media.poster ? `poster="${media.poster}"` : ''} controls autoplay muted playsinline
        onerror="this.closest('.project-modal-media').classList.add('empty'); this.style.display='none'">
        Tu navegador no soporta reproducción de video HTML5.
      </video>
    </div>`;
  }
  return `<div class="project-modal-media project-modal-media--image">
    <img src="${media.src}" alt="${safeTitle}" loading="lazy"
      onerror="this.closest('.project-modal-media').classList.add('empty'); this.style.display='none'">
  </div>`;
}

function projectModalHTML(p) {
  const waMessage = `Hola! Vi el proyecto "${p.title}" de Hélice Drone y quiero consultar por un proyecto similar.`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  return `
    ${projectMediaHTML(p.media, p.title)}
    <div class="project-modal-body">
      ${p.client ? `<p class="project-modal-meta">${escapeHTML(p.client)}</p>` : ''}
      <h3 id="modal-title">${escapeHTML(p.title)}</h3>
      <a class="btn-primary" href="${waHref}" target="_blank" rel="noopener" style="display:inline-block;">
        Consultar por un proyecto similar →
      </a>
    </div>`;
}

function openProjectModal(id) {
  const project = projectsData.find(p => p.id === id);
  if (!project) return;

  lastFocusedEl = document.activeElement;
  modalEl.classList.add('modal--project');
  document.getElementById('modal-content').innerHTML = projectModalHTML(project);

  document.getElementById('modal-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.querySelector('.modal-close').focus();
}


// ===== PROYECTOS: TABS =====
const projectTabs = document.querySelectorAll('.proyectos-tabs .tab-btn');
const projectPanels = document.querySelectorAll('.proyectos-panels .carousel');

function showProjectTab(service) {
  projectTabs.forEach(btn => {
    const active = btn.dataset.tab === service;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
    btn.tabIndex = active ? 0 : -1;
  });
  projectPanels.forEach(panel => {
    const show = panel.dataset.panel === service;
    if (show) {
      panel.hidden = false;
      // Fuerza un reflow para poder relanzar la animación de entrada cada
      // vez que se vuelve a mostrar el mismo panel (fade + slide sutil).
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = 'fadeUp 0.35s ease both';
      // El panel estaba oculto (hidden) y su carrusel medía 0px: se recalcula
      // el estado de las flechas prev/next ahora que tiene ancho real.
      window.dispatchEvent(new Event('resize'));
    } else {
      panel.hidden = true;
      panel.style.animation = '';
    }
  });
}

projectTabs.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    showProjectTab(btn.dataset.tab);
  });
  // Navegación de pestañas con flechas / Home / End (patrón estándar de ARIA tabs)
  btn.addEventListener('keydown', (e) => {
    let targetIndex = null;
    if (e.key === 'ArrowRight') targetIndex = (i + 1) % projectTabs.length;
    else if (e.key === 'ArrowLeft') targetIndex = (i - 1 + projectTabs.length) % projectTabs.length;
    else if (e.key === 'Home') targetIndex = 0;
    else if (e.key === 'End') targetIndex = projectTabs.length - 1;
    if (targetIndex === null) return;
    e.preventDefault();
    const targetTab = projectTabs[targetIndex];
    targetTab.focus();
    showProjectTab(targetTab.dataset.tab);
  });
});

function goToProjects(service) {
  showProjectTab(service);
  document.getElementById('proyectos').scrollIntoView({ behavior: 'smooth' });
}


// ===== CARRUSELES: drag-to-scroll, teclado y flechas de navegación =====
// Distancia que avanza el carrusel por cada paso de teclado/flecha: el
// ancho real del primer elemento del track + el gap entre elementos.
function getCarouselStep(track) {
  const first = track.firstElementChild;
  if (!first) return track.clientWidth * 0.85;
  const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
  return first.getBoundingClientRect().width + gap;
}

// Deslizar con mouse (click + arrastrar) en desktop; en mobile el swipe táctil
// ya funciona nativo gracias a overflow-x + scroll-snap, sin JS adicional.
// Los listeners de mousemove/mouseup en window solo existen MIENTRAS se
// arrastra (se agregan en mousedown, se sacan en mouseup): con 6 carruseles
// en la página, tenerlos siempre activos significaría 6 funciones corriendo
// en cada movimiento de mouse en cualquier parte del sitio, arrastrando o no.
// Ajusta el scroll a la tarjeta más cercana, a mano. Hace falta en dos casos:
// 1) el drag con mouse de abajo mueve "scrollLeft" por script, y eso no
//    dispara el snap nativo del navegador.
// 2) con rueda o trackpad horizontal, el snap "mandatory" del CSS a veces
//    no termina de aplicarse solo y el carrusel queda a mitad de camino
//    entre dos tarjetas (se usa como red de seguridad en ese caso).
function snapToNearest(track) {
  const trackLeft = track.getBoundingClientRect().left;
  let nearestDelta = null;
  for (const kid of track.children) {
    const delta = kid.getBoundingClientRect().left - trackLeft;
    if (nearestDelta === null || Math.abs(delta) < Math.abs(nearestDelta)) nearestDelta = delta;
  }
  if (nearestDelta) track.scrollTo({ left: track.scrollLeft + nearestDelta, behavior: 'smooth' });
}

document.querySelectorAll('.carousel-track').forEach(track => {
  let startX = 0;
  let startScroll = 0;
  let moved = false;
  let latestPageX = 0;
  let dragRafId = null;

  const applyDrag = () => {
    const delta = latestPageX - startX;
    if (Math.abs(delta) > 5) moved = true;
    track.scrollLeft = startScroll - delta;
    dragRafId = null;
  };

  const onMouseMove = (e) => {
    latestPageX = e.pageX;
    // Agrupa varios mousemove en un solo movimiento por frame, en vez de
    // mover el scroll una vez por cada evento (pueden ser más de 60/seg).
    if (dragRafId === null) dragRafId = requestAnimationFrame(applyDrag);
  };

  const onMouseUp = () => {
    track.classList.remove('dragging');
    if (dragRafId !== null) { cancelAnimationFrame(dragRafId); dragRafId = null; }
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    // El scrollLeft de arriba lo pisa JS a mano, así que el navegador nunca ve
    // el "fin de gesto" que necesita para aplicar el scroll-snap solo: sin esto,
    // soltar a mitad de camino entre dos tarjetas las dejaba trabadas ahí.
    if (moved) snapToNearest(track);
  };

  track.addEventListener('mousedown', (e) => {
    moved = false;
    track.classList.add('dragging');
    startX = e.pageX;
    startScroll = track.scrollLeft;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  // Red de seguridad para rueda/trackpad: cuando el scroll horizontal se
  // queda quieto (nada de scroll en los últimos 120ms) y no es porque se
  // está arrastrando con el mouse (eso ya snapea solo en onMouseUp),
  // reacomoda a la tarjeta más cercana.
  let snapTimeout = null;
  track.addEventListener('scroll', () => {
    if (track.classList.contains('dragging')) return;
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(() => snapToNearest(track), 120);
  }, { passive: true });

  // Click sobre una tarjeta de proyecto: abre el lightbox, salvo que
  // el click haya sido en realidad el final de un arrastre.
  track.addEventListener('click', (e) => {
    if (moved) { e.preventDefault(); return; }
    const slide = e.target.closest('.project-slide');
    if (slide) openProjectModal(slide.dataset.id);
  });

  // Navegación por teclado: flechas para desplazar, Enter/Espacio para
  // abrir el proyecto que tiene el foco.
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      track.scrollBy({ left: getCarouselStep(track), behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      track.scrollBy({ left: -getCarouselStep(track), behavior: 'smooth' });
    } else if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('project-slide')) {
      e.preventDefault();
      openProjectModal(e.target.dataset.id);
    }
  });
});

// Flechas prev/next sutiles, inyectadas en todos los carruseles del sitio
// (Servicios, Proyectos y Vistas Aéreas comparten la misma estructura .carousel).
function enhanceCarouselNav(carousel) {
  const track = carousel.querySelector('.carousel-track');
  if (!track || carousel.querySelector('.carousel-nav')) return;

  const arrowSVG = (points) =>
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="${points}"></polyline></svg>`;

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'carousel-nav prev';
  prevBtn.setAttribute('aria-label', 'Anterior');
  prevBtn.innerHTML = arrowSVG('15 18 9 12 15 6');

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'carousel-nav next';
  nextBtn.setAttribute('aria-label', 'Siguiente');
  nextBtn.innerHTML = arrowSVG('9 18 15 12 9 6');

  const updateDisabled = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    prevBtn.disabled = track.scrollLeft <= 1;
    nextBtn.disabled = max <= 0 || track.scrollLeft >= max;
  };
  // El scroll del track puede disparar decenas de eventos por segundo
  // (drag, momentum táctil): se agrupa a un solo recálculo por frame para
  // no forzar lecturas de layout (scrollWidth/clientWidth) de más.
  let navRafId = null;
  const scheduleUpdateDisabled = () => {
    if (navRafId !== null) return;
    navRafId = requestAnimationFrame(() => { updateDisabled(); navRafId = null; });
  };

  prevBtn.addEventListener('click', () => track.scrollBy({ left: -getCarouselStep(track), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => track.scrollBy({ left: getCarouselStep(track), behavior: 'smooth' }));
  track.addEventListener('scroll', scheduleUpdateDisabled, { passive: true });
  window.addEventListener('resize', scheduleUpdateDisabled);

  carousel.append(prevBtn, nextBtn);
  updateDisabled();
}

document.querySelectorAll('.carousel').forEach(enhanceCarouselNav);


// ===== SCROLL REVEAL =====
// Nada queda estático esperando ya visible: prácticamente todo el
// contenido entra con fade + slide al aparecer en pantalla. Los elementos
// que viven en una misma fila (cards de servicios, miniaturas de proyecto,
// vistas aéreas, tarjetas de "Detrás del Sistema", las dos columnas de
// contacto) además se
// escalonan entre sí, para que la fila se sienta como una cascada y no
// como un bloque que aparece todo junto.
const revealEls = document.querySelectorAll(
  '.section-header, .contact-info, .contact-form'
);
const REVEAL_STAGGER_STEP = 0.06; // segundos entre cada elemento de una misma fila
const REVEAL_STAGGER_MAX = 0.36;  // tope para que filas largas (ej: 13 vistas) no tarden de más

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const siblingIndex = Array.from(el.parentElement.children).indexOf(el);
      const delay = Math.min(siblingIndex * REVEAL_STAGGER_STEP, REVEAL_STAGGER_MAX);
      el.style.animation = `fadeUp 0.6s ease ${delay}s both`;
      // Al terminar, se limpia el "animation" inline: si no, el fill-mode "both"
      // deja el transform de la animación fijo y pisa el hover (ej: el translateY
      // del hover en .card dejaría de funcionar en las cards ya reveladas).
      el.addEventListener('animationend', () => {
        el.style.animation = '';
        el.style.opacity = '';
      }, { once: true });
      observer.unobserve(el);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach(el => {
  el.style.opacity = '0';
  observer.observe(el);
});
