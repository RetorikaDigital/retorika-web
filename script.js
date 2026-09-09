/* ============================================================
   Retorika — camino sobre la imagen + ventanas de cada punto
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. El camino se alinea con el encuadre de la imagen -------
     La imagen se recorta con object-fit:cover, así que el SVG del camino
     se coloca sobre el rectángulo real que ocupa; los pines se
     clavan luego en sus anclajes, de modo que siempre caen sobre la
     pasarela sea cual sea la proporción de la pantalla.                */

  const IMG_W = 1672, IMG_H = 941;
  const stage = document.getElementById('stage');
  const routeSvg = document.getElementById('routeSvg');
  const photo = document.getElementById('bgPhoto');
  const pins = Array.from(document.querySelectorAll('.pin[data-anchor]'));

  function coverBox(w, h) {
    const scale = Math.max(w / IMG_W, h / IMG_H);
    const cw = IMG_W * scale, ch = IMG_H * scale;
    return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch, scale };
  }

  // el alto real de la cabecera se publica como variable: las secciones
  // reservan ese espacio y nunca quedan por debajo del menú
  const header = document.querySelector('.site-header');
  function measureHeader() {
    if (!header) return;
    document.documentElement.style.setProperty('--header-h', Math.round(header.getBoundingClientRect().height) + 'px');
  }

  function layout() {
    measureHeader();
    if (!stage || !routeSvg) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;

    const box = coverBox(w, h);
    routeSvg.style.left = box.x + 'px';
    routeSvg.style.top = box.y + 'px';
    routeSvg.style.width = box.w + 'px';
    routeSvg.style.height = box.h + 'px';

    // los pines acompañan el tamaño del encuadre, sin pasarse de grandes
    const zoom = Math.min(Math.max(box.h / 900, 0.62), 1.15);
    stage.style.setProperty('--zoom', zoom.toFixed(3));

    placePins();
    stage.classList.add('is-ready');
  }

  function placePins() {
    const base = stage.getBoundingClientRect();
    pins.forEach(pin => {
      const anchor = document.getElementById(pin.dataset.anchor);
      if (!anchor) return;
      const a = anchor.getBoundingClientRect();
      pin.style.left = (a.left + a.width / 2 - base.left) + 'px';
      pin.style.top = (a.top + a.height / 2 - base.top) + 'px';
    });
  }

  layout();
  window.addEventListener('resize', layout, { passive: true });
  window.addEventListener('orientationchange', layout);
  window.addEventListener('load', layout);
  if ('ResizeObserver' in window && stage) new ResizeObserver(layout).observe(stage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  if (photo) photo.addEventListener('load', layout);

  /* ---------- 2. Pase de secciones ----------
     En escritorio la web no baja: cada sección releva a la anterior con un
     fundido. Como ambas comparten encuadre, la escena no se mueve y sólo se
     disuelve la figura. En móvil se deja el desplazamiento normal.      */

  const deck = document.getElementById('deck');
  const screens = deck ? Array.from(deck.children).filter(el => el.tagName === 'SECTION') : [];
  const dots = Array.from(document.querySelectorAll('.deck-nav button'));
  const deckOn = window.matchMedia('(min-width:861px)');
  let current = 0, locked = false;

  function goTo(i, viaHash) {
    if (!screens.length) return;
    i = Math.min(Math.max(i, 0), screens.length - 1);
    if (i === current) return;

    const anterior = current;
    screens[current].classList.remove('is-active');
    screens[i].classList.add('is-active');
    dots.forEach((d, n) => d.classList.toggle('is-on', n === i));
    current = i;
    screens[i].scrollTop = 0;

    if (!viaHash && screens[i].id) {
      history.replaceState(null, '', '#' + screens[i].id);
    }
    // los pines se recolocan por si el encuadre cambió mientras estaba oculta
    if (typeof layout === 'function') layout();
    if (screens[i].id === 'servicios') reiniciarTendedero();
    if (screens[i].id === 'nosotros') irPlano(i > anterior ? 0 : planos.length - 1, true);

    locked = true;
    setTimeout(() => { locked = false; }, reduceMotion ? 60 : 900);
  }

  // dentro de Nosotros el gesto cambia de plano antes de saltar de sección
  function avanzar(dir) {
    if (screens[current] && screens[current].id === 'nosotros' && puedePlano(dir)) {
      irPlano(planoActual + dir);
      locked = true;
      setTimeout(() => { locked = false; }, reduceMotion ? 60 : 780);
      return;
    }
    goTo(current + dir);
  }

  function indexOfHash(hash) {
    const id = (hash || '').replace('#', '');
    return screens.findIndex(s => s.id === id);
  }

  // ¿la sección activa aún puede desplazarse por dentro?
  function scrollsInside(el, dir) {
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 2) return false;
    return dir > 0 ? el.scrollTop < max - 1 : el.scrollTop > 1;
  }

  if (deck && screens.length > 1) {
    let wheelSum = 0, wheelTimer = null;

    window.addEventListener('wheel', e => {
      if (!deckOn.matches) return;
      if (!modal.hidden || (bio && !bio.hidden) || escenaOcupada()) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (scrollsInside(screens[current], dir)) return;

      e.preventDefault();
      if (locked) return;

      wheelSum += e.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => { wheelSum = 0; }, 220);

      if (Math.abs(wheelSum) > 42) {
        wheelSum = 0;
        avanzar(dir);
      }
    }, { passive: false });

    // gesto táctil en tabletas
    let touchY = null;
    window.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', e => {
      if (!deckOn.matches || touchY === null || !modal.hidden || (bio && !bio.hidden) || escenaOcupada()) return;
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 60 && !scrollsInside(screens[current], dy > 0 ? 1 : -1)) {
        avanzar(dy > 0 ? 1 : -1);
      }
      touchY = null;
    }, { passive: true });

    document.addEventListener('keydown', e => {
      if (!deckOn.matches || !modal.hidden || (bio && !bio.hidden) || escenaOcupada()) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); avanzar(1); }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); avanzar(-1); }
      if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      if (e.key === 'End') { e.preventDefault(); goTo(screens.length - 1); }
    });

    dots.forEach(d => d.addEventListener('click', () => goTo(Number(d.dataset.go))));

    // cualquier enlace a una sección cambia de pantalla en vez de saltar
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const i = indexOfHash(a.getAttribute('href'));
        if (i < 0) return;
        if (!deckOn.matches) return;      // en móvil, desplazamiento normal
        e.preventDefault();
        if (!modal.hidden) closeModal();
        goTo(i);
      });
    });

    // entrada directa por url (#contacto)
    const start = indexOfHash(location.hash);
    if (start > 0) {
      screens[0].classList.remove('is-active');
      screens[start].classList.add('is-active');
      dots.forEach((d, n) => d.classList.toggle('is-on', n === start));
      current = start;
    }

    // al pasar a móvil se muestran todas; al volver, sólo la activa
    deckOn.addEventListener('change', () => {
      screens.forEach((s, n) => s.classList.toggle('is-active', n === current));
      if (typeof layout === 'function') layout();
    });
  }

  /* ---------- 3. La escena de Servicios ----------
     Es la animación original, cargada tal cual en su propio marco. Desde
     aquí sólo se le quita el reproductor del editor (viene marcado como
     "chrome"), se deja que la rueda siga cambiando de sección y se rearranca
     al volver a entrar.                                                  */

  const marco = document.getElementById('tendFrame');

  function escenaDoc() {
    try { return marco && marco.contentDocument; } catch (e) { return null; }
  }

  // con una hoja desplegada aparecen sus pinzas: entonces la rueda no navega
  function escenaOcupada() {
    const doc = escenaDoc();
    return !!(doc && doc.querySelector('img[src*="pinza"]'));
  }

  function vestirEscena() {
    const doc = escenaDoc();
    if (!doc || !doc.head || doc.getElementById('sin-chrome')) return;

    const est = doc.createElement('style');
    est.id = 'sin-chrome';
    est.textContent =
      '[data-omelette-chrome]{display:none!important}' +
      'html,body{background:transparent!important;overflow:hidden!important}' +
      '[data-om-starter="animations-v3"]{background:transparent!important}' +
      '[data-om-starter="animations-v3"] svg{box-shadow:none!important}';
    doc.head.appendChild(est);
    try { marco.contentWindow.dispatchEvent(new Event('resize')); } catch (e) {}

    // los gestos dentro del marco tienen que seguir moviendo el pase
    doc.addEventListener('wheel', e => {
      if (escenaOcupada()) return;
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: e.deltaY }));
    }, { passive: true });

    doc.addEventListener('keydown', e => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].indexOf(e.key) < 0) return;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, bubbles: true }));
    });

    let dedo = null;
    doc.addEventListener('touchstart', e => { dedo = e.touches[0].clientY; }, { passive: true });
    doc.addEventListener('touchend', e => {
      if (dedo === null || escenaOcupada()) { dedo = null; return; }
      const dy = dedo - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 60) window.dispatchEvent(new WheelEvent('wheel', { deltaY: dy > 0 ? 200 : -200 }));
      dedo = null;
    }, { passive: true });
  }

  if (marco) {
    marco.addEventListener('load', vestirEscena);
    vestirEscena();
  }

  // al volver a la sección, la escena arranca de nuevo desde el principio
  let escenaTimer = null;
  function reiniciarTendedero() {
    if (!marco || reduceMotion) return;
    clearTimeout(escenaTimer);
    escenaTimer = setTimeout(() => {
      try { marco.contentWindow.location.reload(); }
      catch (e) { marco.setAttribute('src', marco.getAttribute('src')); }
    }, 120);
  }

  /* ---------- 4. La franja de logos, recogida hasta que se pulsa ---------- */

  const trust = document.querySelector('.trust');
  const trustToggle = document.getElementById('trustToggle');

  const hero = document.querySelector('.hero');

  if (trust && trustToggle) {
    trustToggle.addEventListener('click', () => {
      const open = trust.classList.toggle('is-open');
      trustToggle.setAttribute('aria-expanded', String(open));
      // con el cajón abierto los rótulos del camino ceden el protagonismo
      if (hero) hero.classList.toggle('is-trust-open', open);
    });
  }

  /* ---------- 5. Contenido de cada punto del camino ---------- */

  const ICONS = {
    aprende:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20c.5-3.4 3.1-5.6 6.2-5.6 1.2 0 2.3.3 3.2.9"/>' +
      '<path d="M14.5 4.5h6.7a1 1 0 0 1 1 1v4.6a1 1 0 0 1-1 1h-3.3L15 13.6v-2.5h-.5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z"/></svg>',
    destaca:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3 10.2v3.6a1.6 1.6 0 0 0 1.6 1.6H7l7.6 4.3a.9.9 0 0 0 1.4-.8V4.9a.9.9 0 0 0-1.4-.8L7 8.6H4.6A1.6 1.6 0 0 0 3 10.2z"/>' +
      '<path d="M19.2 9.4a4 4 0 0 1 0 5.2M7 15.4V20"/></svg>',
    escala:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M8.6 7.5 3.8 12l4.8 4.5M15.4 7.5 20.2 12l-4.8 4.5M13.4 4.6l-2.8 14.8"/></svg>'
  };

  const POINTS = {
    aprende: {
      title: 'Aprende',
      kicker: 'Construye tu base',
      accent: 'var(--pink)',
      deep: '#A81250',
      rgb: '244,22,107',
      text: 'Formación personalizada en oratoria, liderazgo, media training y soft skills.',
      items: [
        'Oratoria y presentaciones de alto impacto',
        'Liderazgo y comunicación de equipos',
        'Media training para portavoces',
        'Soft skills aplicadas al día a día'
      ]
    },
    destaca: {
      title: 'Destaca',
      kicker: 'Haz que te escuchen',
      accent: 'var(--green)',
      deep: '#0A7D43',
      rgb: '18,197,107',
      text: 'Campañas publicitarias y políticas, branding, rebranding y posicionamiento.',
      items: [
        'Estrategia de marca y posicionamiento',
        'Branding y rebranding completo',
        'Campañas publicitarias 360º',
        'Contenido y storytelling de marca'
      ]
    },
    escala: {
      title: 'Escala',
      kicker: 'Lleva tu mensaje más lejos',
      accent: 'var(--blue)',
      deep: '#123C86',
      rgb: '29,109,240',
      text: 'Páginas web, aplicaciones y herramientas digitales a medida.',
      items: [
        'Webs corporativas y landings de conversión',
        'Aplicaciones web y móviles a medida',
        'Herramientas digitales internas',
        'Analítica, SEO y mejora continua'
      ]
    }
  };

  /* ---------- 6. Formulario de contacto (demo, sin envío real) ---------- */

  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const btn = form.querySelector('.form__send span');
      form.classList.add('is-sent');
      if (btn) btn.textContent = 'Mensaje enviado';
      setTimeout(() => {
        form.classList.remove('is-sent');
        if (btn) btn.textContent = 'Enviar mensaje';
        form.reset();
      }, 2600);
    });
  }

  /* ---------- 7. Ventana semi-transparente ---------- */

  const modal = document.getElementById('modal');
  const card = document.getElementById('modalCard');
  const elIcon = document.getElementById('modalIcon');
  const elTitle = document.getElementById('modalTitle');
  const elKicker = document.getElementById('modalKicker');
  const elText = document.getElementById('modalText');
  const elList = document.getElementById('modalList');

  let lastFocused = null;
  let openKey = null;

  /* La ventana se despliega pegada a su puntero: se busca hueco a un lado
     u otro del pin y el origen de la animación apunta hacia él.        */
  function placeCard(key) {
    const pin = document.querySelector('.pin[data-point="' + key + '"]');
    const vw = window.innerWidth, vh = window.innerHeight;
    const cw = card.offsetWidth, ch = card.offsetHeight;
    const M = 16, GAP = 26;
    let left, top, origin = 'center center';

    const r = pin ? pin.getBoundingClientRect() : null;
    const onScreen = r && r.width > 0 &&
      r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;

    if (onScreen && vw >= 760 && vh >= 520) {
      if (r.right + GAP + cw <= vw - M) {
        left = r.right + GAP; origin = 'left center';
      } else if (r.left - GAP - cw >= M) {
        left = r.left - GAP - cw; origin = 'right center';
      } else {
        left = Math.min(Math.max(M, r.left + r.width / 2 - cw / 2), vw - cw - M);
        origin = 'center top';
      }
      top = Math.min(Math.max(M, r.top + r.height / 2 - ch / 2), vh - ch - M);
    } else {
      left = (vw - cw) / 2;
      top = Math.max(M, (vh - ch) / 2);
    }

    card.style.left = Math.round(left) + 'px';
    card.style.top = Math.round(top) + 'px';
    card.style.transformOrigin = origin;
  }

  function openModal(key) {
    const data = POINTS[key];
    if (!data) return;

    lastFocused = document.activeElement;

    card.style.setProperty('--accent', data.accent);
    card.style.setProperty('--accent-rgb', data.rgb);
    card.style.setProperty('--accent-deep', data.deep);
    elIcon.innerHTML = ICONS[key] || '';
    elTitle.textContent = data.title;
    elKicker.textContent = data.kicker;
    elText.textContent = data.text;
    elList.innerHTML = data.items.map(i => `<li>${i}</li>`).join('');

    openKey = key;
    modal.hidden = false;
    placeCard(key);
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    card.focus({ preventScroll: true });
  }

  function closeModal() {
    if (modal.hidden) return;
    openKey = null;
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    const hide = () => { modal.hidden = true; };
    if (reduceMotion) hide();
    else setTimeout(hide, 380);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-point]').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.point));
  });

  modal.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeModal();
  });

  window.addEventListener('resize', () => { if (openKey) placeCard(openKey); }, { passive: true });

  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    // foco atrapado dentro de la ventana
    const focusables = modal.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  /* ---------- 8. Nosotros: los dos planos y las fichas del equipo ----------
     El primer plano cuenta el proceso; el segundo presenta al equipo. El
     gesto de rueda pasa de uno a otro antes de cambiar de sección.      */

  const planosCaja = document.getElementById('planos');
  const planos = planosCaja ? Array.from(planosCaja.querySelectorAll('.plano')) : [];
  const pager = Array.from(document.querySelectorAll('.about__pager button'));
  let planoActual = 0;

  function puedePlano(dir) {
    if (planos.length < 2 || !deckOn.matches) return false;
    return dir > 0 ? planoActual < planos.length - 1 : planoActual > 0;
  }

  function irPlano(n, inmediato) {
    if (!planos.length) return;
    n = Math.min(Math.max(n, 0), planos.length - 1);
    if (n === planoActual && !inmediato) return;
    planosCaja.dataset.sentido = n > planoActual ? 'abajo' : 'arriba';
    planos.forEach((p, i) => p.classList.toggle('is-on', i === n));
    pager.forEach((b, i) => b.classList.toggle('is-on', i === n));
    planoActual = n;
  }

  pager.forEach(b => b.addEventListener('click', () => irPlano(Number(b.dataset.plano))));

  /* las fotos reales, si están puestas, sustituyen al monograma */
  document.querySelectorAll('[data-foto]').forEach(caja => {
    const img = new Image();
    img.onload = () => {
      caja.style.backgroundImage = 'url("' + caja.dataset.foto + '")';
      caja.classList.add('tiene-foto');
    };
    img.src = caja.dataset.foto;
  });

  /* ---- ficha con la trayectoria ---- */
  const FICHAS = {
    belen: {
      puesto: 'CEO y fundadora de Retorika',
      items: [
        'Asesora en el Congreso de los Diputados.',
        '5.ª mejor oradora del mundo (CMUDE Perú 2019), 2.º mejor equipo de la historia de España en el World Universities Debating Championship (WUDC Thailand 2020), mejor oradora y campeona de multitud de torneos de debate y representante de España en el Consejo Mundial de Debate (2021-2023).',
        'Profesora de comunicación en universidades (U. Pontificia Comillas, U. Francisco de Vitoria y U. Nacional a Distancia).',
        'Graduada en ICADE (Universidad Pontificia Comillas) en Derecho y Business Law. Actualmente doctorando sobre la IA y la comunicación política.'
      ]
    },
    carlosg: {
      puesto: 'Director General y consultor estratégico para corporaciones y gobiernos en países en vías de desarrollo',
      items: [
        'Ingeniero industrial con más de 20 años de experiencia en África.',
        'Experto en estrategia y consolidación de marca corporativa en mercados emergentes. Ha trabajado con gobiernos y empresas multinacionales ayudándoles a fortalecer su presencia y a crear estrategias de comunicación efectivas en entornos complejos.',
        'Desarrollo y control de procesos industriales y empresariales.'
      ]
    },
    cristina: {
      puesto: 'Consultora de comunicación estratégica',
      items: [
        'Licenciada en Periodismo.',
        'Premio Extraordinario de la Comunidad de Madrid. Máster en Comunicación Estratégica y Política.',
        'Profesora en varias universidades (U. Francisco de Vitoria y U. Nacional a Distancia).',
        'Casi diez años como periodista en televisión, radio y prensa, y cuatro como asesora de comunicación política.'
      ]
    },
    jorge: {
      puesto: 'Consultor de comunicación estratégica',
      items: [
        'Coach dialógico por el IDDI y acreditado por ICF.',
        'Profesor en la U. Francisco de Vitoria.',
        'Subcampeón del mundo de debate y campeón iberoamericano de debate político.'
      ]
    },
    oriana: {
      puesto: 'Consultora en comunicación corporativa para empresas y corporaciones',
      items: [
        'Mejor equipo venezolano en el Campeonato Mundial Universitario de Debate en Español (CMUDE 2020, Ecuador).',
        'Campeona y mejor oradora en torneos internacionales de debate (Venezuela y México).',
        'Experiencia destacada en Modelo de Naciones Unidas.'
      ]
    },
    rodrigo: {
      puesto: 'Productor audiovisual',
      items: [
        'Especialista en grabación y edición de vídeo.',
        'Responsable técnico de las sesiones de media training.',
        'Periodista y comunicador audiovisual.'
      ]
    },
    carloss: {
      puesto: 'Programador',
      items: ['Desarrollo web, apps y soluciones digitales.'],
      pendiente: true
    },
    amalia: {
      puesto: 'Community Manager',
      items: ['Redes sociales, contenidos y estrategia digital.'],
      pendiente: true
    }
  };

  const bio = document.getElementById('bio');
  const bioCard = document.getElementById('bioCard');
  let bioVuelve = null;

  function abrirFicha(card) {
    const quien = card.dataset.quien;
    const datos = FICHAS[quien];
    if (!bio || !datos) return;

    const foto = card.querySelector('.member__foto');
    const cajaFoto = document.getElementById('bioFoto');
    cajaFoto.className = 'bio__foto' + (foto.classList.contains('tiene-foto') ? ' tiene-foto' : '');
    cajaFoto.style.backgroundImage = foto.style.backgroundImage || '';
    document.getElementById('bioIni').textContent = card.querySelector('.member__ini').textContent;
    document.getElementById('bioNombre').textContent = card.querySelector('.member__name').textContent.trim();
    document.getElementById('bioPuesto').textContent = datos.puesto;

    const lista = document.getElementById('bioLista');
    lista.innerHTML = '';
    datos.items.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      lista.appendChild(li);
    });
    if (datos.pendiente) {
      const li = document.createElement('li');
      li.className = 'bio__pendiente';
      li.textContent = 'Trayectoria pendiente de completar.';
      lista.appendChild(li);
    }

    bioVuelve = card;
    bio.hidden = false;
    requestAnimationFrame(() => bio.classList.add('is-open'));
    bioCard.focus();
  }

  function cerrarFicha() {
    if (!bio || bio.hidden) return;
    bio.classList.remove('is-open');
    setTimeout(() => { bio.hidden = true; }, reduceMotion ? 0 : 380);
    if (bioVuelve) { bioVuelve.focus(); bioVuelve = null; }
  }

  document.querySelectorAll('.member__card').forEach(card => {
    card.addEventListener('click', () => abrirFicha(card));
  });
  if (bio) {
    bio.querySelectorAll('[data-cerrar]').forEach(el => el.addEventListener('click', cerrarFicha));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !bio.hidden) cerrarFicha();
    });
  }

})();
