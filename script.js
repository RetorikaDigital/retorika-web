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
    if (header) {
      document.documentElement.style.setProperty('--header-h', Math.round(header.getBoundingClientRect().height) + 'px');
    }
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

  /* el enlace del menú que corresponde a la sección en la que estás */
  const enlacesNav = Array.from(document.querySelectorAll('.site-nav a'));
  function marcarNav(id) {
    enlacesNav.forEach(a => {
      const suyo = a.getAttribute('href') === '#' + id;
      a.classList.toggle('esta-en', suyo);
      if (suyo) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function goTo(i, viaHash) {
    if (!screens.length) return;
    i = Math.min(Math.max(i, 0), screens.length - 1);
    if (i === current) return;

    const anterior = current;
    document.querySelectorAll('.voz.esta-abierta').forEach(v => v.classList.remove('esta-abierta'));
    screens[current].classList.remove('is-active');
    screens[i].classList.add('is-active');
    dots.forEach((d, n) => d.classList.toggle('is-on', n === i));
    marcarNav(screens[i].id);
    current = i;
    screens[i].scrollTop = 0;

    if (!viaHash && screens[i].id) {
      history.replaceState(null, '', '#' + screens[i].id);
    }
    // los pines se recolocan por si el encuadre cambió mientras estaba oculta
    if (typeof layout === 'function') layout();
    if (screens[i].id === 'servicios') reiniciarTendedero();
    else if (screens[anterior] && screens[anterior].id === 'servicios' &&
             typeof pararEscena === 'function') pararEscena();
    const grupoDestino = typeof grupoDe === 'function' ? grupoDe(screens[i].id) : null;
    if (grupoDestino) irPlano(i > anterior ? 0 : grupoDestino.planos.length - 1, true, grupoDestino);

    locked = true;
    setTimeout(() => { locked = false; }, reduceMotion ? 60 : 900);
  }

  // dentro de Nosotros el gesto cambia de plano antes de saltar de sección
  function avanzar(dir) {
    if (puedePlano(dir)) {
      const g = grupoDe(screens[current].id);
      irPlano(g.actual + dir, false, g);
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
    marcarNav(screens[current].id);

    // al pasar a móvil se muestran todas; al volver, sólo la activa
    deckOn.addEventListener('change', () => {
      screens.forEach((s, n) => s.classList.toggle('is-active', n === current));
      if (typeof layout === 'function') layout();
    });

    /* en móvil no hay pase de secciones: la que manda es la que se está
       mirando, así que se vigila cuál ocupa el centro de la pantalla */
    if ('IntersectionObserver' in window) {
      const vista = new IntersectionObserver(entradas => {
        if (deckOn.matches) return;
        let mejor = null;
        entradas.forEach(e => {
          if (!e.isIntersecting) return;
          if (!mejor || e.intersectionRatio > mejor.intersectionRatio) mejor = e;
        });
        if (mejor) marcarNav(mejor.target.id);
      }, { threshold: [0.25, 0.5, 0.75] });
      screens.forEach(s => vista.observe(s));
    }
  }

  /* ---------- 3. La escena de Servicios ----------
     Es la animación original, cargada tal cual en su propio marco. Desde
     aquí sólo se hacen tres cosas por fuera, sin tocar sus archivos:
       · se le quita el reproductor del editor y su fondo, porque el fondo
         lo pone la sección;
       · se reproduce entera al entrar en la sección (si la dejásemos
         correr sola, al llegar ya estaría gastada);
       · se reenvían los gestos para que el pase de secciones siga yendo. */

  const marco = document.getElementById('tendFrame');
  let cintaId = null, vigilanteId = null;

  function escenaDoc() {
    try {
      const doc = marco && marco.contentDocument;
      if (!doc || !doc.body) return null;
      if (doc.location && doc.location.href === 'about:blank') return null;
      return doc;
    } catch (e) { return null; }
  }

  function lienzoEscena() {
    const doc = escenaDoc();
    return doc ? doc.querySelector('[data-om-exportable-video-with-duration-secs]') : null;
  }

  // con una hoja desplegada aparecen sus pinzas: entonces la rueda no navega
  function escenaOcupada() {
    const doc = escenaDoc();
    return !!(doc && doc.querySelector('img[src*="pinza"]'));
  }

  /* ---- fuera el reproductor del editor y el fondo de la escena ---- */
  function vestirEscena() {
    const doc = escenaDoc();
    if (!doc || !doc.head || doc.getElementById('sin-chrome')) return false;

    const est = doc.createElement('style');
    est.id = 'sin-chrome';
    est.textContent =
      '[data-omelette-chrome]{display:none!important}' +
      'html,body{background:transparent!important;overflow:hidden!important}' +
      '[data-om-starter="animations-v3"]{background:transparent!important}' +
      '[data-om-starter="animations-v3"] svg{box-shadow:none!important}' +
      // los blancos de la escena se apartan: el fondo lo pone la sección
      'foreignObject > div{background:transparent!important}' +
      '[data-screen-label]{background:transparent!important}' +
      '[style*="aspect-ratio"]{background:transparent!important}' +
      // la cuerda está dibujada más allá del lienzo: se deja que llegue a los
      // bordes del navegador en vez de cortarse dentro de la escena
      'svg[data-om-exportable-video-with-duration-secs],' +
      'svg[data-om-exportable-video-with-duration-secs] > *,' +
      'svg[data-om-exportable-video-with-duration-secs] > * > div,' +
      '[data-screen-label],' +
      '[data-om-starter="animations-v3"] > div{overflow:visible!important}' +
      // las tres palabras que subrayamos en el texto de la izquierda
      '.ret-subraya{text-decoration:underline; text-decoration-color:rgba(29,109,240,.55);' +
      'text-decoration-thickness:2px; text-underline-offset:4px}';
    doc.head.appendChild(est);

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

    try { marco.contentWindow.dispatchEvent(new Event('resize')); } catch (e) {}
    return true;
  }

  // el decorado propio de la escena sobra: el fondo es el de la sección
  function quitarFondoEscena() {
    const doc = escenaDoc();
    if (!doc) return false;
    const img = doc.querySelector('img[src*="fondo"]');
    if (!img || !img.parentElement) return false;
    img.parentElement.style.setProperty('display', 'none', 'important');
    return true;
  }

  /* ---- la reproducción la lleva la web ---- */
  function irAlFotograma(t, enMarcha) {
    const el = lienzoEscena();
    if (!el) return false;
    el.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', {
      detail: { time: t, playing: !!enMarcha }
    }));
    return true;
  }

  function pararEscena() {
    if (cintaId) { clearInterval(cintaId); cintaId = null; }
    mostrarBotones(false);
    irAlFotograma(0, false);
  }

  function tocarEscena() {
    const el = lienzoEscena();
    if (!el) return;
    mostrarBotones(false);
    if (cintaId) { clearInterval(cintaId); cintaId = null; }
    const dur = Number(el.getAttribute('data-om-exportable-video-with-duration-secs')) || 5;
    if (reduceMotion) { irAlFotograma(dur, false); mostrarBotones(true); return; }
    const arranque = performance.now();
    irAlFotograma(0, true);
    cintaId = setInterval(() => {
      const t = (performance.now() - arranque) / 1000;
      if (t >= dur) { irAlFotograma(dur, false); clearInterval(cintaId); cintaId = null; mostrarBotones(true); return; }
      irAlFotograma(t, true);
    }, 16);
  }

  /* La escena tarda en montarse (carga su runtime y compila su propio
     código), y el marco puede haber terminado antes de que este guion se
     ejecute, así que no vale con esperar su evento de carga: se comprueba
     cada poco hasta que está lista.                                     */
  /* ---- subrayar tres palabras del texto de la izquierda ----
     El texto vive dentro de la escena, que no se toca: se busca el párrafo
     por su contenido y se le envuelven las palabras desde fuera. Se repite
     mientras la escena se refresca, por si alguna vez lo rehace.          */
  const PALABRAS_SUBRAYADAS = ['personas', 'equipos', 'instituciones'];

  function subrayarPalabras() {
    const doc = escenaDoc();
    if (!doc || !doc.body) return false;
    if (doc.querySelector('.ret-subraya')) return true;

    const parrafo = Array.from(doc.querySelectorAll('div')).find(d =>
      d.children.length === 0 &&
      d.textContent.indexOf('personas, equipos e instituciones') >= 0);
    if (!parrafo) return false;

    let html = parrafo.textContent;
    PALABRAS_SUBRAYADAS.forEach(p => {
      html = html.replace(p, '<span class="ret-subraya">' + p + '</span>');
    });
    parrafo.innerHTML = html;
    return true;
  }

  /* ---- separar los botones del texto en la tarjeta abierta ----
     En la hoja de Aprende la lista de áreas de formación es tan larga que
     parte en dos líneas, la banda gris crece y se come el hueco que había
     hasta los botones. Aquí se le devuelve: se aprieta un poco el relleno de
     la banda y se bajan los botones lo que haga falta, sin pasarse del borde
     del papel. Se mide con offsetTop, que va en las medidas del dibujo y no
     se ve afectado por la inclinación de la hoja.                          */
  const FLECHA = 'M4.5 12 H19';
  const SEPARACION = 24;   // el hueco que queremos entre la banda y los botones
  const AIRE_TITULO = 26;  // y el que queremos entre el icono y el título

  /* el redondel del icono queda casi encima del título (10 px, y el título
     llega justo por debajo): se sube hasta que respire */
  function separarIcono(hoja) {
    const titulo = Array.from(hoja.children).find(el =>
      el.children.length === 0 && /^[A-ZÁÉÍÓÚÑ]{4,}$/.test((el.textContent || '').trim()));
    const circulo = Array.from(hoja.children).find(el =>
      getComputedStyle(el).borderRadius === '50%' && el.offsetWidth > 50 && el.offsetWidth < 100);
    if (!titulo || !circulo || circulo.dataset.retSubido === '1') return;

    const aire = titulo.offsetTop - (circulo.offsetTop + circulo.offsetHeight);
    if (aire < AIRE_TITULO) {
      const nuevo = Math.max(6, circulo.offsetTop - (AIRE_TITULO - aire));
      circulo.style.top = nuevo + 'px';
    }
    circulo.dataset.retSubido = '1';
  }

  function separarBotones() {
    /* sólo hay algo que hacer mientras se está mirando Servicios */
    if (!screens[current] || screens[current].id !== 'servicios') return;
    const doc = escenaDoc();
    if (!doc) return;

    const flechas = Array.from(doc.querySelectorAll('svg path')).filter(p =>
      (p.getAttribute('d') || '').indexOf(FLECHA) === 0);
    if (!flechas.length) return;

    const filas = [];
    flechas.forEach(p => {
      /* del dibujo subimos al botón, y del botón a la fila que los agrupa */
      let fila = p.closest('div');
      while (fila && fila.parentElement && getComputedStyle(fila).position !== 'absolute') {
        fila = fila.parentElement;
      }
      if (fila && filas.indexOf(fila) < 0) filas.push(fila);
    });

    filas.forEach(fila => {
      const hoja = fila.offsetParent;
      if (!hoja || !hoja.offsetHeight) return;
      separarIcono(hoja);
      if (fila.dataset.retSeparado === '1') return;

      /* la banda gris de la hoja, por su color de fondo */
      const banda = Array.from(hoja.children).find(el =>
        getComputedStyle(el).backgroundColor.indexOf('203, 221, 246') >= 0);
      if (!banda) return;

      banda.style.paddingTop = '9px';
      banda.style.paddingBottom = '9px';

      const abajoBanda = banda.offsetTop + banda.offsetHeight;
      const hueco = fila.offsetTop - abajoBanda;
      const sitio = hoja.offsetHeight - (fila.offsetTop + fila.offsetHeight) - 14;
      const bajar = Math.min(Math.max(0, SEPARACION - hueco), Math.max(0, sitio));

      if (bajar > 0) fila.style.transform = 'translateY(' + bajar + 'px)';
      fila.dataset.retSeparado = '1';
    });
  }

  setInterval(separarBotones, 250);

  /* el párrafo lo pinta la escena cuando le toca, así que se insiste un rato */
  let subrayadoId = setInterval(() => {
    if (subrayarPalabras()) { clearInterval(subrayadoId); subrayadoId = null; }
  }, 300);
  setTimeout(() => { if (subrayadoId) { clearInterval(subrayadoId); subrayadoId = null; } }, 20000);

  function atenderEscena() {
    if (!escenaDoc()) return;
    vestirEscena();
    subrayarPalabras();
    const fondoFuera = quitarFondoEscena();
    apartarDelLogo();
    const listo = fondoFuera && !!lienzoEscena();
    if (!listo) return;
    clearInterval(vigilanteId);
    vigilanteId = null;
    seguirBotones();
    if (screens[current] && screens[current].id === 'servicios') tocarEscena();
    else pararEscena();
  }

  if (marco) {
    vigilanteId = setInterval(atenderEscena, 120);
    atenderEscena();
    marco.addEventListener('load', () => {
      clearInterval(vigilanteId);
      vigilanteId = setInterval(atenderEscena, 120);
    });
  }

  /* ---- la hoja entera es el botón ----
     Dentro del lienzo de la escena el navegador no siempre acierta con el
     punto pulsado, así que las zonas sensibles se ponen aquí, encima de
     cada hoja: se colocan sobre lo que se ve y al pulsarlas se le pasa el
     clic a la hoja de la escena, que es quien sabe qué hacer.        */

  const NOMBRES = { aprende: 'Aprende', destaca: 'Destaca', escala: 'Escala' };
  let capa = null, botones = [], refrescoId = null;

  function cajaEscena() {
    return document.querySelector('.escena-caja');
  }

  function crearCapa() {
    const caja = cajaEscena();
    if (!caja || capa) return;
    capa = document.createElement('div');
    capa.className = 'hojas-capa';
    caja.appendChild(capa);
  }

  function hojasEscena() {
    const doc = escenaDoc();
    return doc ? Array.from(doc.querySelectorAll('img[src*="hoja-"]')) : [];
  }

  /* La cuerda entra por arriba a la izquierda, justo por donde está el
     logotipo de la cabecera. Aquí se mide a qué altura pasa y se baja la
     escena lo justo para que quede por debajo, sin tocar la animación. */
  function apartarDelLogo() {
    const doc = escenaDoc();
    const logo = document.querySelector('.logo');
    if (!doc || !logo || !marco) return;

    const trazo = doc.querySelector('path[stroke="#D7CFC1"]');
    if (!trazo || !trazo.getTotalLength) return;

    marco.style.setProperty('--empuje', '0px');
    const rl = logo.getBoundingClientRect();
    const rm = marco.getBoundingClientRect();
    const m = trazo.getScreenCTM();
    if (!m) return;

    const largo = trazo.getTotalLength();
    let arriba = Infinity;
    for (let i = 0; i <= 400; i++) {
      const q = trazo.getPointAtLength(largo * i / 400);
      const x = rm.left + q.x * m.a + q.y * m.c + m.e;
      if (x < rl.left - 30 || x > rl.right + 30) continue;
      const y = rm.top + q.x * m.b + q.y * m.d + m.f;
      if (y < arriba) arriba = y;
    }
    if (arriba === Infinity) return;

    let falta = Math.round(rl.bottom + 10 - arriba);
    if (falta <= 0) { marco.style.setProperty('--empuje', '0px'); return; }
    // pero sin empujar tanto que las hojas se salgan por abajo
    let mas_bajo = 0;
    doc.querySelectorAll('img[src*="hoja-"]').forEach(img => {
      mas_bajo = Math.max(mas_bajo, rm.top + img.getBoundingClientRect().bottom);
    });
    const holgura = mas_bajo ? Math.max(0, window.innerHeight - mas_bajo - 8) : falta;
    marco.style.setProperty('--empuje', Math.min(falta, holgura) + 'px');
  }

  function colocarBotones() {
    const caja = cajaEscena();
    const hojas = hojasEscena();
    if (!caja || !capa || !hojas.length) return;

    const rc = caja.getBoundingClientRect();
    const rm = marco.getBoundingClientRect();
    const dx = rm.left - rc.left, dy = rm.top - rc.top;

    hojas.forEach((img, i) => {
      let b = botones[i];
      if (!b) {
        b = document.createElement('button');
        b.type = 'button';
        b.className = 'hoja-boton';
        const id = (img.getAttribute('src').match(/hoja-([a-z]+)/) || [])[1] || '';
        b.setAttribute('aria-label', (NOMBRES[id] || 'Este camino') + ': pulsa para desplegar la hoja');
        b.addEventListener('click', () => pulsarHoja(img));
        b.addEventListener('mouseenter', () => avisarHoja(img, 'mouseover'));
        b.addEventListener('mouseleave', () => avisarHoja(img, 'mouseout'));
        capa.appendChild(b);
        botones[i] = b;
      }
      const r = img.getBoundingClientRect();
      // un pelín más estrecho que el papel: la imagen lleva margen transparente
      const margen = r.width * 0.07;
      b.style.left = Math.round(r.left + dx + margen) + 'px';
      b.style.top = Math.round(r.top + dy) + 'px';
      b.style.width = Math.round(r.width - margen * 2) + 'px';
      b.style.height = Math.round(r.height * 0.94) + 'px';
    });
  }

  function pulsarHoja(img) {
    try {
      img.dispatchEvent(new MouseEvent('click', {
        bubbles: true, cancelable: true, view: marco.contentWindow
      }));
    } catch (e) {}
  }

  function avisarHoja(img, tipo) {
    try {
      img.dispatchEvent(new MouseEvent(tipo, {
        bubbles: true, cancelable: true, view: marco.contentWindow, relatedTarget: null
      }));
    } catch (e) {}
  }

  function mostrarBotones(si) {
    crearCapa();
    if (!capa) return;
    capa.classList.toggle('esta-lista', !!si);
    if (si) { apartarDelLogo(); colocarBotones(); }
  }

  function seguirBotones() {
    clearInterval(refrescoId);
    refrescoId = setInterval(() => {
      if (!marco || !escenaDoc()) return;
      if (escenaOcupada()) { mostrarBotones(false); return; }
      const enServicios = screens[current] && screens[current].id === 'servicios';
      if (!enServicios) { mostrarBotones(false); return; }
      mostrarBotones(true);
    }, 250);
  }

  window.addEventListener('resize', () => {
    if (!capa) return;
    apartarDelLogo();
    colocarBotones();
  });

  // al entrar en la sección, la escena se reproduce desde el principio
  function reiniciarTendedero() {
    tocarEscena();
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

  /* Hay secciones partidas en dos planos (Nosotros y Contacto). Cada una
     lleva su caja y su paginador; el gesto de rueda recorre los planos
     antes de saltar de sección.                                        */

  const grupos = Array.from(document.querySelectorAll('[data-planos]')).map(caja => {
    const sec = caja.closest('section');
    return {
      seccion: sec ? sec.id : '',
      caja,
      planos: Array.from(caja.children).filter(el => el.classList.contains('plano')),
      pager: Array.from(document.querySelectorAll('[data-pager="' + (sec ? sec.id : '') + '"] button')),
      actual: 0
    };
  }).filter(g => g.planos.length > 1);

  function grupoDe(id) {
    return grupos.find(g => g.seccion === id) || null;
  }

  function puedePlano(dir) {
    if (!deckOn.matches) return false;
    const g = grupoDe(screens[current] && screens[current].id);
    if (!g) return false;
    return dir > 0 ? g.actual < g.planos.length - 1 : g.actual > 0;
  }

  function irPlano(n, inmediato, grupo) {
    const g = grupo || grupoDe(screens[current] && screens[current].id);
    if (!g) return;
    n = Math.min(Math.max(n, 0), g.planos.length - 1);
    if (n === g.actual && !inmediato) return;
    g.caja.dataset.sentido = n > g.actual ? 'abajo' : 'arriba';
    g.planos.forEach((p, i) => p.classList.toggle('is-on', i === n));
    g.pager.forEach((b, i) => b.classList.toggle('is-on', i === n));
    g.actual = n;
  }

  grupos.forEach(g => {
    g.pager.forEach(b => b.addEventListener('click', () => irPlano(Number(b.dataset.plano), false, g)));
  });


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


  /* ---------- 9. Recursos: los filtros de los artículos ---------- */
  const chips = Array.from(document.querySelectorAll('.chip'));
  const recortes = Array.from(document.querySelectorAll('.rec'));

  const vacio = document.querySelector('.tendal__vacio');

  function filtroRecursos(clave) {
    let quedan = 0;
    recortes.forEach(r => {
      const suyo = clave === 'todos' || r.dataset.cat === clave;
      r.classList.toggle('esta-fuera', !suyo);
      if (suyo) quedan++;
    });
    if (vacio) vacio.hidden = quedan > 0;
  }

  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(o => o.classList.toggle('is-on', o === ch));
    filtroRecursos(ch.dataset.filtro);
  }));


  /* ---------- 10. El menú de móvil ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const menuMovil = document.getElementById('menuMovil');

  function cerrarMenu() {
    if (!menuBtn) return;
    menuBtn.classList.remove('esta-abierto');
    menuMovil.classList.remove('esta-abierto');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir el menú');
  }

  if (menuBtn && menuMovil) {
    menuBtn.addEventListener('click', () => {
      const abierto = menuBtn.classList.toggle('esta-abierto');
      menuMovil.classList.toggle('esta-abierto', abierto);
      menuBtn.setAttribute('aria-expanded', String(abierto));
      menuBtn.setAttribute('aria-label', abierto ? 'Cerrar el menú' : 'Abrir el menú');
    });
    menuMovil.querySelectorAll('a').forEach(a => a.addEventListener('click', cerrarMenu));
    document.addEventListener('click', e => {
      if (!menuMovil.classList.contains('esta-abierto')) return;
      if (menuBtn.contains(e.target) || menuMovil.contains(e.target)) return;
      cerrarMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarMenu(); });
  }

  /* ---------- 11. Las reseñas se levantan al pulsarlas ---------- */
  const voces = Array.from(document.querySelectorAll('.voz'));

  function cerrarVoces() {
    voces.forEach(v => v.classList.remove('esta-abierta'));
  }

  voces.forEach(voz => {
    voz.tabIndex = 0;

    function alternar() {
      const yaEstaba = voz.classList.contains('esta-abierta');
      cerrarVoces();
      if (!yaEstaba) voz.classList.add('esta-abierta');
    }

    voz.addEventListener('click', alternar);
    voz.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        alternar();
      }
    });
  });

  /* ---------- 12. Las hojas de Recursos, a la altura que quede ----------
     Las hojas de papel son altas y en pantallas bajas no cabrían enteras.
     En vez de adivinar el hueco con una fórmula, se mide: desde donde
     empieza la cuerda hasta donde empieza la línea de abajo. De ahí sale
     el ancho máximo de la fila, y las cinco hojas se ajustan solas.        */
  const secRecursos = document.getElementById('recursos');
  const tendalRopa = secRecursos && secRecursos.querySelector('.tendal__ropa');
  const piePagina = secRecursos && secRecursos.querySelector('.recursos__pie');

  function ajustarTendal() {
    if (!tendalRopa || !piePagina) return;

    /* si la sección ya se puede desplazar (pantalla estrecha o muy baja) no
       hay que apretar nada: las hojas se quedan a su tamaño natural */
    if (window.innerWidth <= 1180 || window.innerHeight <= 700) {
      tendalRopa.style.maxWidth = '';
      return;
    }

    const caja = secRecursos.getBoundingClientRect();
    const dondeEmpieza = tendalRopa.getBoundingClientRect().top - caja.top;
    const dSec = getComputedStyle(secRecursos);
    const dPie = getComputedStyle(piePagina);

    const libre = caja.height
                - parseFloat(dSec.paddingBottom || 0)
                - dondeEmpieza
                - parseFloat(dPie.marginTop || 0)
                - piePagina.getBoundingClientRect().height
                - 4;

    const hueco = parseFloat(getComputedStyle(tendalRopa).columnGap) || 0;
    /* 728/1179 es la proporción de la hoja más estrecha: si cabe ella,
       caben las cinco. Los 30 px son la comba con la que cuelgan. */
    const ancho = Math.max(120, (libre - 30) * 728 / 1179);
    tendalRopa.style.maxWidth = Math.round(ancho * 5 + hueco * 4) + 'px';

    /* y ahora unas pasadas de corrección: se mira lo que ha sobrado o faltado
       de verdad y se reparte, que sale más fino que cualquier fórmula.
       El contenido va centrado en la sección, así que cada píxel que crece
       la fila sólo baja medio el pie; por eso se corrige de más (1,5) y se
       repite, en vez de intentar clavarlo de una sola vez. */
    for (let vuelta = 0; vuelta < 5; vuelta++) {
      const abajoSeccion = secRecursos.getBoundingClientRect().bottom
                         - parseFloat(dSec.paddingBottom || 0);
      const sobra = abajoSeccion - piePagina.getBoundingClientRect().bottom - 2;
      if (Math.abs(sobra) < 3) break;
      const actual = parseFloat(tendalRopa.style.maxWidth) || 0;
      const nuevo = actual + sobra * 1.5 * (728 / 1179) * 5;
      tendalRopa.style.maxWidth = Math.round(Math.max(600, nuevo)) + 'px';
    }
  }

  if (tendalRopa) {
    ajustarTendal();
    window.addEventListener('resize', ajustarTendal);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarTendal);
  }

  if (voces.length) {
    /* al pulsar fuera, o al irse de la sección, se vuelven a posar */
    document.addEventListener('click', e => {
      if (!e.target.closest('.voz')) cerrarVoces();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarVoces(); });
  }

})();
