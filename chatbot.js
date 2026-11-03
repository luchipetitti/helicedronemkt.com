// ===== HIPER: asistente virtual de Hélice Drone (preguntas frecuentes, sin API ni servidor) =====
let chatStarted = false;

// Cada entrada: si el mensaje del visitante contiene alguna de las keywords, responde con "reply".
// Se evalúa en orden, así que las preguntas más específicas van primero.
const FAQ = [
  {
    keywords: ['precio', 'presupuesto', 'cuanto sale', 'cuanto cuesta', 'cuanto vale', 'costo', 'cotizacion', 'tarifa'],
    reply: 'Los presupuestos se pasan por WhatsApp según el servicio que te interese (varía por tipo de servicio, duración y ubicación). Escribinos al +54 9 353 427-3691 y te lo confirmamos para tu caso puntual.',
  },
  {
    keywords: ['horario', 'atienden', 'abren', 'cierran', 'que dias atienden', 'que dias trabajan', 'dias trabajan', 'dias abren'],
    reply: 'Atendemos de lunes a sábado, de 8:00 a 18:00 hs.',
  },
  {
    keywords: ['ubicacion', 'donde estan', 'donde quedan', 'direccion', 'zona', 'se mueven', 'viajan'],
    reply: 'Operamos desde Villa María, Córdoba, hacia todo el país. Viajamos fuera de la zona cuando el proyecto lo requiere (ya hicimos trabajos en Pasco, Córdoba Capital y Corrientes). No tenemos local físico de atención, coordinamos todo por WhatsApp al +54 9 353 427-3691.',
  },
  {
    keywords: ['toma aerea', 'tomas aereas', 'video hd', 'video 4k', '4k', 'filmacion'],
    reply: 'Tomas Aéreas: fotografía y video cinematográfico desde el aire en HD, con edición y postproducción opcional. Ideal para redes, publicidad y producciones audiovisuales.',
  },
  {
    keywords: ['inmobiliaria', 'propiedad', 'departamento', 'terreno', 'campo', 'lote', 'casa en venta', 'galpon', 'alquiler', 'alquilan', 'alquilar', 'casas', 'inmueble', 'vender', 'venta'],
    reply: 'Para inmobiliarias hacemos tomas y recorridos aéreos de propiedades, además de recorridos a pie por dentro cuando el espacio lo pide, más fotografía de barrios y entornos. En "Proyectos > Inmobiliarias" podés ver trabajos reales: el reel de un departamento en el Complejo Altos del Río (Innovar Inmobiliaria), el de una propiedad comercial en alquiler (Eugenia Astiz Negocios Inmobiliarios) y fotos aéreas del edificio con sus piletas, terrazas y parque. Hay paquetes con entrega rápida lista para publicar.',
  },
  {
    keywords: ['evento', 'boda', 'casamiento', 'cumple', 'quince', 'corporativo'],
    reply: 'Cubrimos eventos privados: bodas, quince años, cumpleaños y eventos corporativos, con cobertura aérea y edición de highlights. El presupuesto varía según la duración del evento.',
  },
  {
    keywords: ['viaje', 'turismo', 'destino', 'paisaje', 'cabaña', 'cabanas', 'hotel', 'hoteles', 'hospedaje', 'alojamiento', 'complejo', 'parque nacional', 'parques nacionales', 'cabañas'],
    reply: 'Para Viajes y Turismo filmamos cabañas, hoteles y complejos turísticos, además de parques nacionales, destinos y paisajes desde el aire. Ideal para alojamientos, agencias de viaje e influencers.',
  },
  {
    keywords: ['equipo', 'dron', 'drone', 'camara', 'dji'],
    reply: 'Volamos con un DJI Mini 5 Pro, con video HD cinematográfico en formato vertical y horizontal.',
  },
  {
    keywords: ['edicion', 'edito', 'editan', 'postproduccion', 'capcut', 'edits', 'montaje', 'correccion de color', 'que programa usan', 'software'],
    reply: 'La edición y postproducción son opcionales. Cuando las querés, el montaje y la corrección de color se hacen en CapCut y Edits. Todo se entrega en HD por una carpeta de Google Drive.',
  },
  {
    keywords: ['vistas aereas', 'vistas conocidas', 'lugares famosos', 'lugares conocidos', 'torre eiffel', 'machu picchu', 'santorini', 'miami', 'inspiracion'],
    reply: 'En "Vistas Aéreas Conocidas" mostramos lugares famosos del mundo vistos desde el cielo (Torre Eiffel, Santorini, Machu Picchu, Miami Beach y más) como inspiración de lo que se puede lograr con una toma aérea.',
  },
  {
    keywords: ['como trabajan', 'como trabajas', 'como es el proceso', 'proceso de trabajo', 'como trabajo'],
    reply: 'No se trata solo de hacer tomas lindas desde arriba: primero definimos juntos qué necesita comunicar tu marca, el objetivo del video, el estilo visual y el público al que queremos llegar. Después se filma, se edita (opcional) y se entrega en HD por Google Drive.',
  },
  {
    keywords: ['en cuanto responden', 'cuando responden', 'responden rapido', 'tiempo de respuesta', '24 horas'],
    reply: 'Respondemos en menos de 24 horas. Por WhatsApp (+54 9 353 427-3691) solemos responder más rápido.',
  },
  {
    keywords: ['entrega', 'demora', 'tarda', 'cuando tengo', 'tiempo de entrega', 'drive'],
    reply: 'La entrega se hace en HD a través de una carpeta de Google Drive.',
  },
  {
    keywords: ['servicio aereo', 'servicio aereo profesional'],
    reply: 'Nuestro Servicio Aéreo incluye Tomas Aéreas, Inmobiliarias, Eventos Privados y Viajes & Turismo, todo con dron. ¿Sobre cuál de estos querés saber más?',
  },
  {
    keywords: ['marketing', 'redes sociales', 'gestion de redes', 'campaña', 'campanas', 'pauta', 'meta ads', 'google ads', 'publicidad', 'pagina web', 'sitio web', 'diseño web', 'diseno web', 'contenido'],
    reply: 'Además del servicio aéreo, ofrecemos Servicio de Marketing (independiente del dron): gestión de redes sociales, campañas publicitarias, estrategia de contenido y creación de páginas web. Lo ves completo en la sección "Servicio de Marketing" de la web.',
  },
  {
    keywords: ['proyecto', 'trabajos anteriores', 'trabajos hechos', 'ejemplos', 'portfolio', 'portafolio', 'ya hicieron', 'mostrame'],
    reply: 'Sí, tenemos ejemplos reales en la sección "Proyectos" de la web, organizados por Tomas Aéreas, Inmobiliarias, Eventos Privados, Viajes & Turismo y una sección aparte de Villa María.',
  },
  {
    keywords: ['quienes son', 'que es helice drone', 'de que se trata', 'sobre helice drone', 'que empresa'],
    reply: 'Hélice Drone es un servicio aéreo profesional: video y fotografía cinematográfica en HD para inmobiliarias, eventos privados, viajes/turismo y producciones en general, con base en Villa María, Córdoba.',
  },
  {
    keywords: ['quien sos', 'quien esta detras', 'con quien hablo', 'tu nombre', 'como te llamas', 'luciano', 'petitti', 'detras del sistema', 'quien maneja', 'formacion', 'estudias', 'estudiaste', 'leibnitz', 'experiencia', 'trayectoria'],
    reply: 'Detrás de Hélice Drone está Luciano Petitti. Opera desde Villa María hacia todo el país, es estudiante de Marketing Digital en el Instituto Leibnitz.',
  },
  {
    keywords: ['servicio', 'que hacen', 'que ofrecen'],
    reply: 'Ofrecemos Tomas Aéreas, servicios para Inmobiliarias, Eventos Privados y Viajes & Turismo — y por separado, Servicio de Marketing (redes, campañas, contenido y páginas web). ¿Sobre cuál querés saber más?',
  },
  {
    keywords: ['email', 'e-mail', 'correo', 'mail', 'gmail'],
    reply: 'Podés escribirnos por email a luchipetifer@gmail.com, o por WhatsApp al +54 9 353 427-3691 (respondemos más rápido por WhatsApp).',
  },
  {
    keywords: ['whatsapp', 'telefono', 'numero', 'contacto', 'contactar'],
    reply: 'Podés escribirnos por WhatsApp al +54 9 353 427-3691 o por email a luchipetifer@gmail.com.',
  },
  {
    keywords: ['instagram', 'tiktok', 'youtube', 'redes'],
    reply: 'Nos encontrás como @helicedronemkt en Instagram, TikTok y YouTube.',
  },
  {
    keywords: ['gracias'],
    reply: 'De nada. Si tenés otra consulta, acá estoy.',
  },
  {
    keywords: ['hola', 'buenas', 'que tal', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches'],
    reply: 'Hola! ¿En qué te puedo ayudar? Puedo contarte sobre nuestros servicios, el servicio de marketing, proyectos anteriores, precios, horarios, entrega o ubicación.',
  },
];

const FALLBACK_REPLY = 'No tengo ese dato puntual a mano. Escribinos por WhatsApp al +54 9 353 427-3691 y te lo confirmamos.';

// Saca tildes/mayúsculas para que "cuánto" y "cuanto" matcheen igual.
function normalizar(texto) {
  return texto
    .toLowerCase()
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ñ/g, 'n');
}

function buscarRespuesta(pregunta) {
  const texto = normalizar(pregunta);
  const encontrada = FAQ.find(item => item.keywords.some(k => texto.includes(normalizar(k))));
  return encontrada ? encontrada.reply : FALLBACK_REPLY;
}

function toggleChat() {
  const widget = document.getElementById('hm-chat-widget');
  const launcher = document.getElementById('hm-chat-launcher');
  const isOpen = widget.classList.contains('open');
  widget.classList.toggle('open', !isOpen);
  if (launcher) launcher.setAttribute('aria-expanded', String(!isOpen));
  if (!isOpen) {
    document.getElementById('hm-chat-badge')?.remove();
    document.getElementById('hm-chat-input')?.focus();
    if (!chatStarted) {
      chatStarted = true;
      appendMessage('bot', '¡Hola! Soy HIPER, el asistente virtual de Hélice Drone. ¿Estás buscando el Servicio Aéreo Profesional o el Servicio de Marketing?');
      appendQuickReplies([
        { label: 'Servicio Aéreo Profesional', value: 'servicio aereo profesional' },
        { label: 'Servicio de Marketing', value: 'servicio de marketing' },
      ]);
    }
  }
}

function appendMessage(role, text) {
  const container = document.getElementById('hm-chat-messages');
  const div = document.createElement('div');
  div.className = role === 'user' ? 'hm-msg hm-msg-user' : 'hm-msg hm-msg-bot';
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('hm-chat-messages');
  const div = document.createElement('div');
  div.id = 'hm-typing';
  div.className = 'hm-typing';
  div.textContent = 'escribiendo...';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTyping() {
  document.getElementById('hm-typing')?.remove();
}

// Lógica compartida entre "escribir y enviar" y los chips de respuesta
// rápida: agrega el mensaje del visitante (con el texto que se ve en la
// burbuja, que puede diferir del texto usado para buscar la respuesta)
// y contesta con una pequeña demora artificial (no hay servidor real).
function runChat(matchText, displayText) {
  appendMessage('user', displayText);
  showTyping();
  const reply = buscarRespuesta(matchText);
  setTimeout(() => {
    removeTyping();
    appendMessage('bot', reply);
  }, 450);
}

function sendChatMessage() {
  const input = document.getElementById('hm-chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  document.getElementById('hm-quick-replies')?.remove();
  runChat(text, text);
}

// Chips tipo "¿Servicio Aéreo o de Marketing?": cada botón dispara la
// misma búsqueda en el FAQ que si el visitante hubiera escrito esa frase.
function appendQuickReplies(options) {
  const container = document.getElementById('hm-chat-messages');
  const wrap = document.createElement('div');
  wrap.className = 'hm-quick-replies';
  wrap.id = 'hm-quick-replies';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hm-quick-reply-btn';
    btn.textContent = opt.label;
    btn.onclick = () => {
      wrap.remove();
      runChat(opt.value, opt.label);
    };
    wrap.appendChild(btn);
  });
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
  // Crear el widget del chat. Todo el estilo vive en style.css (sección
  // "CHATBOT WIDGET"), así que respeta el tema claro/oscuro del sitio.
  const widget = document.createElement('div');
  widget.innerHTML = `
    <div id="hm-chat-widget">
      <button
        id="hm-chat-launcher"
        onclick="toggleChat()"
        aria-label="Abrir chat con HIPER, el asistente virtual de Hélice Drone"
        aria-expanded="false"
      ><img class="hm-drone-icon" src="assets/logo-icon.png" alt="" width="320" height="152" /><span id="hm-chat-badge">1</span></button>
      <div id="hm-chat-box">

        <div class="hm-chat-header">
          <div class="hm-chat-header-info">
            <span class="hm-chat-dot"></span>
            <span class="hm-chat-title">HIPER</span>
          </div>
          <button class="hm-chat-close" onclick="toggleChat()" aria-label="Cerrar chat">✕</button>
        </div>

        <div class="hm-chat-subbar">
          <span>Asistente virtual de Hélice Drone · Respondemos al instante</span>
        </div>

        <div id="hm-chat-messages" aria-live="polite"></div>

        <div class="hm-chat-inputrow">
          <input
            id="hm-chat-input"
            type="text"
            placeholder="Escribí tu consulta..."
            onkeydown="if(event.key==='Enter') sendChatMessage()"
          />
          <button class="hm-chat-send" onclick="sendChatMessage()" aria-label="Enviar consulta">→</button>
        </div>

        <div class="hm-chat-footer">
          <span>¿Preferís hablar con una persona? </span>
          <a href="https://wa.me/5493534273691" target="_blank">WhatsApp →</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(widget);
});
