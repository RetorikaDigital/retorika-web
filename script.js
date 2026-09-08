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

    locked = true;
    setTimeout(() => { locked = false; }, reduceMotion ? 60 : 900);
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
      if (!modal.hidden) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (scrollsInside(screens[current], dir)) return;

      e.preventDefault();
      if (locked) return;

      wheelSum += e.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => { wheelSum = 0; }, 220);

      if (Math.abs(wheelSum) > 42) {
        wheelSum = 0;
        goTo(current + dir);
      }
    }, { passive: false });

    // gesto táctil en tabletas
    let touchY = null;
    window.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', e => {
      if (!deckOn.matches || touchY === null || !modal.hidden) return;
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 60 && !scrollsInside(screens[current], dy > 0 ? 1 : -1)) {
        goTo(current + (dy > 0 ? 1 : -1));
      }
      touchY = null;
    }, { passive: true });

    document.addEventListener('keydown', e => {
      if (!deckOn.matches || !modal.hidden) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goTo(current - 1); }
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

  /* ---------- 3. La franja de logos, recogida hasta que se pulsa ---------- */

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

  /* ---------- 4. Contenido de cada punto del camino ---------- */

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

  /* ---------- 5. Formulario de contacto (demo, sin envío real) ---------- */

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

  /* ---------- 6. Ventana semi-transparente ---------- */

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
})();
