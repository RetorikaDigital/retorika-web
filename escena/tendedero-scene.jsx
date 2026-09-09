const { useComposition, CompositionStage, Easing, interpolate, animate, clamp } = window;

const W = 1920, H = 1080;
const NAVY = '#16233D';
const MUTED = '#6E819F';
const EYEBROW = '#8FA2BE';
const BLUE = '#1B6CF2';
const BODY = '#55668A';

/* three motion helpers — nothing eases outside these */
const MOTION = {
  enter: (from, to, start, end) => animate({ from, to, start, end, ease: Easing.easeOutCubic }),
  draw: (start, end) => animate({ from: 0, to: 1, start, end, ease: Easing.easeInOutQuart }),
  pop: (start, end) => animate({ from: 0, to: 1, start, end, ease: Easing.easeOutBack }),
};
const settle = (T, t0, amp, k) => (T <= t0 ? 0 : amp * Math.exp(-k * (T - t0)) * Math.sin((T - t0) * 2 * Math.PI * 1.05));
const breath = (T, ph) => 0.13 * Math.sin(T * 0.55 + ph);

const EASE_UI = 'cubic-bezier(.22,.9,.24,1)';

const ICONS = {
  book: [
    'M6.2 5.9 L12 2.7 L17.8 5.9 L12 9.1 Z',
    'M17.8 6.4 L17.8 9.7',
    'M12 15.4 C9.2 13.4 5.8 12.8 2.6 13 L2.6 20.5 C5.8 20.3 9.2 20.9 12 22.3',
    'M12 15.4 C14.8 13.4 18.2 12.8 21.4 13 L21.4 20.5 C18.2 20.3 14.8 20.9 12 22.3',
    'M12 15.4 L12 22.3',
  ],
  podium: [
    'M12 2.5 L13.25 5.95 L16.9 6.15 L14.05 8.5 L14.9 12.1 L12 10.1 L9.1 12.1 L9.95 8.5 L7.1 6.15 L10.75 5.95 Z',
    'M5.4 4.4 L3.6 2.9',
    'M18.6 4.4 L20.4 2.9',
    'M6.4 14.4 L17.6 14.4 L16.1 17.8 L7.9 17.8 Z',
    'M12 17.8 L12 21',
    'M8.4 21 L15.6 21',
  ],
  code: [
    'M3.4 5.6 L20.6 5.6 L20.6 16.4 L3.4 16.4 Z',
    'M1.6 19.4 L22.4 19.4',
    'M9.9 8.8 L7.1 11 L9.9 13.2',
    'M14.1 8.8 L16.9 11 L14.1 13.2',
    'M13 8.1 L11 13.9',
  ],
  capLaptop: [
    'M3.4 5.8 L20.6 5.8 L20.6 16.2 L3.4 16.2 Z',
    'M1.6 19.2 L22.4 19.2',
    'M8.2 11.4 L12 9.4 L15.8 11.4 L12 13.4 Z',
    'M15.8 11.7 L15.8 14',
  ],
  megaphone: [
    'M3.6 10 L14.4 5.8 L14.4 18.2 L3.6 14 Z',
    'M7.2 13.3 L8.3 20 L11 20 L10.2 14.2',
    'M17.4 9.2 C19.2 10.6 19.2 13.4 17.4 14.8',
  ],
  people: [
    'M9.4 6.8 a2.6 2.6 0 1 1 -0.01 0',
    'M16.6 7.8 a2.1 2.1 0 1 1 -0.01 0',
    'M3.4 18.8 C3.4 15.1 6 13.2 9.4 13.2 C12.8 13.2 15.4 15.1 15.4 18.8',
    'M16 13.6 C19 13.6 20.9 15.4 20.9 18.8',
  ],
  person: [
    'M12 7.4 a3.1 3.1 0 1 1 -0.01 0',
    'M5.4 19.8 C5.4 15.7 8.4 13.4 12 13.4 C15.6 13.4 18.6 15.7 18.6 19.8',
  ],
  doc: [
    'M6 3.4 L14.4 3.4 L18 7 L18 20.6 L6 20.6 Z',
    'M14.4 3.4 L14.4 7 L18 7',
    'M9 11.6 L15 11.6',
    'M9 15.2 L15 15.2',
  ],
  browser: [
    'M3.4 5.6 L20.6 5.6 L20.6 18.4 L3.4 18.4 Z',
    'M3.4 9.5 L20.6 9.5',
    'M6.1 7.5 L6.7 7.5',
    'M8.2 7.5 L8.8 7.5',
    'M10.3 7.5 L10.9 7.5',
  ],
  phone: [
    'M8.7 3.3 L15.3 3.3 A1.5 1.5 0 0 1 16.8 4.8 L16.8 19.2 A1.5 1.5 0 0 1 15.3 20.7 L8.7 20.7 A1.5 1.5 0 0 1 7.2 19.2 L7.2 4.8 A1.5 1.5 0 0 1 8.7 3.3 Z',
    'M10.7 18.3 L13.3 18.3',
  ],
  gear: [
    'M12 4.6 a7.4 7.4 0 1 1 -0.01 0',
    'M12 9.3 a2.7 2.7 0 1 1 -0.01 0',
    'M19.4 12 L21.5 12',
    'M2.5 12 L4.6 12',
    'M15.7 18.4 L16.8 20.2',
    'M7.2 3.8 L8.3 5.6',
    'M8.3 18.4 L7.2 20.2',
    'M16.8 3.8 L15.7 5.6',
  ],
  target: [
    'M12 3.4 a8.6 8.6 0 1 1 -0.01 0',
    'M12 8.1 a3.9 3.9 0 1 1 -0.01 0',
    'M12 11.4 a0.6 0.6 0 1 1 -0.01 0',
  ],
  gem: [
    'M12 4.2 L18.8 9.2 L12 19.9 L5.2 9.2 Z',
    'M5.2 9.2 L18.8 9.2',
    'M12 4.2 L12 19.9',
  ],
  cycle: [
    'M5.2 10.4 A7.2 7.2 0 0 1 17.4 7.4',
    'M15.1 4.8 L17.9 7.5 L15.1 10.1',
    'M18.8 13.6 A7.2 7.2 0 0 1 6.6 16.6',
    'M8.9 19.2 L6.1 16.5 L8.9 13.9',
  ],
  chart: [
    'M5.4 19.6 L5.4 13.2',
    'M10.4 19.6 L10.4 9.2',
    'M15.4 19.6 L15.4 15.2',
    'M20.4 19.6 L20.4 6.4',
  ],
};

const BACKS = {};

BACKS.APRENDE = {
  layout: 'grid', h: 664, icon: 'book',
  title: 'APRENDE',
  subtitle: 'Dos formas de crecer. Un mismo objetivo: tu equipo.',
  rows: [
    [
      {
        icon: 'book', num: '01.', title: 'Formación a medida',
        lead: 'Cursos y talleres diseñados para tu equipo.',
        body: 'No trabajamos con formaciones cerradas. Nos cuenta qué necesitas, a quién va dirigida la formación, cuánto tiempo tenéis y cuál es vuestro presupuesto. A partir de ahí diseñamos una propuesta específica.',
      },
      {
        icon: 'capLaptop', num: '02.', title: 'Academia online',
        lead: 'Aprende a tu ritmo. Desde donde quieras.',
        body: 'Nuestra plataforma formativa online cursos prácticos para mejorar tus habilidades de comunicación y liderazgo, con acceso online y contenidos diseñados por profesionales.',
        note: 'Actualmente: Curso de Oratoria · Liderazgo Educativo',
      },
    ],
    [
      { icon: 'person', title: 'Nos cuentas qué necesitas' },
      { icon: 'doc', title: 'Diseñamos la formación' },
      { icon: 'people', title: 'Entrenamos en directo' },
      { icon: 'chart', title: 'Evaluamos resultados' },
    ],
  ],
  rowTops: [198, 404], cardWs: [411, 196], compactRow: 1,
  bands: [
    { label: 'Formamos a:', list: 'Empresas • Equipos políticos • Centros educativos • Instituciones públicas' },
    { label: 'Áreas de formación:', list: 'Oratoria • Comunicación eficaz • Liderazgo • Media training • Soft skills • Telegenia • Debate • Comunicación política' },
  ],
  bandTop: 486,
  ctaTop: 592,
  ctas: [
    { label: 'Diseña tu formación', kind: 'solid' },
    { label: 'Accede a la Academia', kind: 'outline' },
  ],
  ctaColor: '#E8005F',
  closing: {
    place: 'right',
    heading: '¿No sabes qué formación necesitas?',
    body: 'Cuéntanos vuestro objetivo y diseñamos una propuesta a medida.',
    cta: 'Diseña tu plan',
  },
};

BACKS.DESTACA = {
  layout: 'grid', h: 568, icon: 'megaphone',
  title: 'DESTACA',
  subtitle: 'Campañas publicitarias y políticas, branding, rebranding y posicionamiento.',
  rows: [
    [
      { icon: 'target', title: 'Campañas publicitarias', body: 'Diseñamos campañas que hacen visible tu mensaje y generan impacto.' },
      { icon: 'people', title: 'Campañas políticas', body: 'Estrategia, narrativa y comunicación para conectar con el electorado.' },
      { icon: 'gem', title: 'Branding', body: 'Construimos identidades claras, coherentes y memorables.' },
    ],
    [
      { icon: 'cycle', title: 'Rebranding', body: 'Redefinimos tu marca para adaptarla a nuevos retos y oportunidades.' },
      { icon: 'chart', title: 'Posicionamiento', body: 'Te ayudamos a ocupar un lugar diferencial en la mente de tu audiencia.' },
    ],
  ],
  rowTops: [198, 314], cardWs: [268, 340], bandTop: 434, ctaTop: 506, ctaColor: '#E8005F',
  band: { label: 'Trabajamos con:', list: 'Empresas · Equipos políticos · Instituciones públicas' },
  cta: 'Cuéntanos tu proyecto',
  closing: {
    place: 'below',
    heading: '¿No sabes cómo destacar?',
    body: 'Cuéntanos vuestro objetivo y diseñamos una propuesta a medida.',
    cta: 'Diseña tu plan',
  },
};

BACKS.ESCALA = {
  layout: 'grid', h: 540, icon: 'code',
  title: 'ESCALA',
  subtitle: 'Unimos comunicación y tecnología para crear soluciones que no solo funcionan: ',
  subtitleAccent: 'comunican.',
  rows: [[
    { icon: 'browser', title: 'Páginas web', body: 'Diseñamos y desarrollamos webs donde estrategia, mensaje, diseño y tecnología trabajan juntos para posicionar tu marca y convertir.' },
    { icon: 'phone', title: 'Aplicaciones', body: 'Creamos aplicaciones a medida pensando en la experiencia del usuario y en los objetivos de comunicación de tu organización.' },
    { icon: 'gear', title: 'Herramientas digitales', body: 'Desarrollamos soluciones personalizadas e IA a medida para comunicar mejor, automatizar procesos y transformar ideas en productos digitales.' },
  ]],
  rowTops: [198], cardWs: [268], bandTop: 386, ctaTop: 458, ctaColor: '#1B6CF2',
  band: { label: 'Trabajamos con:', list: 'Empresas · Equipos políticos · Instituciones públicas' },
  cta: 'Cuéntanos tu proyecto',
  closing: {
    place: 'below',
    heading: '¿No sabes qué solución digital necesitas?',
    body: 'Cuéntanos tu objetivo y diseñamos una propuesta a medida.',
    cta: 'Diseña tu plan',
  },
};

/* rendered sheets (paper + binder clip, rope removed) — one image each */
const SHEET_W = 390;

const CARDS = [
  {
    word: 'APRENDE', icon: 'book', ph: 0,
    color: '#E8005F', deep: '#D50057', tint: 'rgba(232,0,95,0.085)', soft: 'rgba(232,0,95,0.13)',
    img: 'assets/hoja-aprende.png', iw: 738, ih: 1160, ix: 366, iy: 77, fallDir: -1, phase: 0,
    clip: { x: 755, y: 211 }, rot: 3.2, off: 0,
  },
  {
    word: 'DESTACA', icon: 'podium', ph: 2.1,
    color: '#00B453', deep: '#00964A', tint: 'rgba(0,180,83,0.085)', soft: 'rgba(0,180,83,0.13)',
    img: 'assets/hoja-destaca.png', iw: 761, ih: 1179, ix: 380, iy: 87, fallDir: -1, phase: -2.4,
    clip: { x: 1200, y: 261 }, rot: 2.6, off: 0.3,
  },
  {
    word: 'ESCALA', icon: 'code', ph: 4.3,
    color: '#1B6CF2', deep: '#1558CC', tint: 'rgba(27,108,242,0.085)', soft: 'rgba(27,108,242,0.13)',
    img: 'assets/hoja-escala.png', iw: 728, ih: 1179, ix: 365, iy: 53, fallDir: 1, phase: -4.8,
    clip: { x: 1645, y: 306 }, rot: 2.0, off: 0.6,
  },
];

const PINZA = { src: 'assets/pinza.png', w: 144, h: 190, cx: 72, cy: 73 };
/* the unfolded sheet hangs from two clips on the same rope */
const SHEET = { w: 900, h: 765, clipL: { x: 800, y: 216.5 }, clipR: { x: 1500, y: 292 }, tilt: 6.16, inset: 110 };

const PAPER_BG = 'linear-gradient(170deg,#FFFFFF 0%,#FDFDFE 46%,#F4F6FA 100%)';
const PAPER_TEX = 'repeating-linear-gradient(122deg, rgba(120,140,170,0.05) 0 1px, rgba(255,255,255,0) 1px 3px), repeating-linear-gradient(28deg, rgba(120,140,170,0.04) 0 1px, rgba(255,255,255,0) 1px 4px)';

function Icon({ kind, color, p = 1, size, sw = 1.5 }) {
  const paths = ICONS[kind] || [];
  const n = paths.length;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', overflow: 'visible' }}>
      {paths.map((d, i) => {
        const a = (i / n) * 0.55;
        const q = clamp((p - a) / 0.45, 0, 1);
        return (
          <path key={i} d={d} fill="none" stroke={color} strokeWidth={sw}
            strokeLinecap="round" strokeLinejoin="round"
            pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - q} />
        );
      })}
    </svg>
  );
}

function Arrow({ color, size = 28, sw = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path d="M4.5 12 H19" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <path d="M13.8 6.9 L19 12 L13.8 17.1" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Clip({ x, y, s, width = 62, stub = 0, delay = 0 }) {
  const k = width / PINZA.w;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: 0, height: 0,
      transform: `scale(${s})`, transformOrigin: '50% 0',
      opacity: clamp(s * 2.4, 0, 1), zIndex: 12, pointerEvents: 'none',
      animation: s ? `plof-pinza 320ms cubic-bezier(.3,1,.5,1) ${delay}ms both` : undefined,
      transition: s ? undefined : `transform 200ms ease ${delay}ms, opacity 140ms ease ${delay}ms`,
    }}>
      {stub ? (
        <svg width="220" height="40" viewBox="0 0 220 40" style={{ position: 'absolute', left: -110, top: -20, transform: `rotate(${stub}deg)`, overflow: 'visible' }}>
          <path d="M 0 23 L 220 23" fill="none" stroke="#A79B88" strokeWidth="19" opacity="0.3" />
          <path d="M 0 20 L 220 20" fill="none" stroke="#D7CFC1" strokeWidth="17.5" />
          <path d="M 0 18.6 L 220 18.6" fill="none" stroke="#EFEAE0" strokeWidth="11.5" />
          <path d="M 0 16.4 L 220 16.4" fill="none" stroke="#FCFAF6" strokeWidth="4.5" />
          <path d="M 0 20 L 220 20" fill="none" stroke="url(#rope-twist)" strokeWidth="17.5" opacity="0.6" />
        </svg>
      ) : null}
      <img src={PINZA.src} alt="" style={{
        position: 'absolute', left: -PINZA.cx * k, top: -PINZA.cy * k,
        width: PINZA.w * k, height: PINZA.h * k,
      }} />
    </div>
  );
}

function Pill({ label, c, big }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 12, height: big ? 52 : 46,
      padding: big ? '0 30px' : '0 26px', borderRadius: 999, background: c.soft,
      fontSize: big ? 20 : 18, fontWeight: 600, color: c.deep, cursor: 'pointer', whiteSpace: 'nowrap',
    }}>
      <span>{label}</span>
      <Arrow color={c.deep} size={22} sw={2} />
    </div>
  );
}

const HANG = [
  ['hoja-pendulo', 7.0, 0],
  ['hoja-inclina', 9.1, -1.7],
  ['hoja-giro', 5.3, -3.1],
  ['hoja-flex', 6.1, -0.9],
];

/* one wrapper per sine layer, innermost first */
function Hang({ origin, on, phase, children }) {
  return HANG.reduce((acc, [name, dur, off]) => (
    <div style={{
      position: 'absolute', left: 0, top: 0, width: 0, height: 0,
      transformOrigin: origin, transformStyle: 'preserve-3d',
      animation: on ? `${name} ${dur}s linear ${phase + off}s infinite` : undefined,
    }}>{acc}</div>
  ), children);
}

function Card({ c, T, cue, sway, state, onOpen, idx, returning }) {
  const k = SHEET_W / c.iw;
  const [hover, setHover] = React.useState(false);
  /* paper fall: air resistance on the descent, plus flutter that decays to nothing on landing */
  const land = cue + 0.82;
  const fall = MOTION.enter(1, 0, cue + 0.04, land)(T);
  const ph = (T - cue) * 6.1 + c.ph;
  const dropY = -980 * fall;
  const driftX = 54 * fall * Math.sin(ph * 0.82 + 0.4);
  const wobZ = -12 * fall * Math.sin(ph + 0.9);
  const flutterY = 27 * fall * Math.sin(ph * 0.7 + 1.2);
  const flutterX = 10 * fall * Math.sin(ph * 1.13);
  const rot = c.rot + wobZ + settle(T, land, 2.6, 2.3) * sway + breath(T, c.ph) * sway;
  const arrP = clamp(MOTION.pop(cue + 0.94, cue + 1.24)(T), 0, 1.02);

  const flipping = state === 'flipping', away = state === 'away';
  const settled = T > cue + 1.7;
  const hv = settled && hover && state === 'idle';
  /* every open/close move is keyframed, so the inline transform below is the ONLY
     source of truth for the resting state and can never get stuck mid-gesture */
  const anim = (away || flipping) ? `hoja-cae 1150ms linear ${idx * 55}ms forwards`
    /* "both", not "forwards": during the stagger delay the sheet must already
       hold the 0% frame (off-screen left, invisible) or it flashes at rest first */
    : returning ? `hoja-vuelve 1150ms cubic-bezier(.22,.58,.14,1) ${idx * 110}ms both` : undefined;
  const tr = (settled && !anim) ? `transform 420ms ${EASE_UI}` : undefined;
  const inner = `rotateY(${flutterY}deg) rotateX(${flutterX}deg) translateY(${hv ? -11 : 0}px) scale(${1 + 0.05 * fall + (hv ? 0.018 : 0)})`;

  return (
    <div style={{
      position: 'absolute', left: c.clip.x, top: c.clip.y, width: 0, height: 0,
      transform: `translate(${driftX}px, ${dropY}px) rotate(${rot}deg)`, transformOrigin: '0 0', perspective: 2600,
      opacity: clamp((T - cue) / 0.07, 0, 1), zIndex: hv ? 7 : 5,
      pointerEvents: state === 'idle' ? 'auto' : 'none',
    }}>
      <Hang origin={`${c.ix * k}px ${c.iy * k}px`} on={settled && state === 'idle'} phase={c.phase}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 0, height: 0,
        transformOrigin: `${c.ix * k}px ${c.iy * k}px`,
        transform: inner, opacity: state === 'idle' ? 1 : 0, transition: tr, animation: anim,
      }}>
        <img src={c.img} alt={c.word}
          onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          onClick={onOpen}
          style={{
            position: 'absolute', left: -c.ix * k, top: -c.iy * k,
            width: c.iw * k, height: c.ih * k, cursor: 'pointer',
            filter: hv ? 'drop-shadow(0 46px 66px rgba(24,54,104,0.26))' : 'drop-shadow(0 36px 56px rgba(24,54,104,0.22))',
            transition: settled ? 'filter 420ms ease' : undefined,
          }} />
        <div onClick={onOpen} title="Saber más"
          onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          style={{
            position: 'absolute',
            left: -c.ix * k + (c.iw / 2) * k - 32, top: -c.iy * k + c.ih * k * 0.868 - 32,
            width: 64, height: 64, borderRadius: '50%', background: hv ? c.soft : c.tint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${arrP * (hv ? 1.08 : 1)})`, cursor: 'pointer',
            transition: settled ? 'background 300ms ease, transform 300ms ease' : undefined,
          }}>
          <Arrow color={c.color} size={27} />
        </div>
      </div>
      </Hang>
    </div>
  );
}

function Placeholder({ label, h }) {
  return (
    <div style={{
      boxSizing: 'border-box', border: '1px dashed #B9C6D8', borderRadius: 4, padding: '20px 18px', minHeight: h,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 15, lineHeight: 1.55, color: '#78899F',
      background: 'repeating-linear-gradient(45deg, rgba(196,210,228,0.16) 0 6px, rgba(255,255,255,0) 6px 12px)',
    }}>{label}</div>
  );
}

/* the big sheet grows out of the chosen sheet's own footprint: the clip starts
   as that little rectangle and stretches to full size, so the paper reads as
   one sheet unfolding rather than a new panel wiping in */
/* ¡plof! the sheet pops into being like a bubble, from its own centre */
function unfoldStyle(shown) {
  return {
    transformOrigin: '50% 46%',
    transform: shown ? 'scale(1)' : 'scale(0.34)',
    opacity: shown ? 1 : 0,
    animation: shown ? 'plof-hoja 470ms cubic-bezier(.3,1,.5,1) 300ms both' : undefined,
    transition: shown ? undefined : 'transform 220ms cubic-bezier(.5,0,.85,.3), opacity 170ms ease 60ms',
  };
}

function ColHead({ col, c }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
      <div style={{
        width: 72, height: 72, minWidth: 72, borderRadius: '50%', background: c.tint,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon kind={col.icon} color={c.color} size={42} sw={1.4} />
      </div>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontSize: 27, fontWeight: 700, color: c.color, lineHeight: 1.05 }}>{col.num}</div>
        <div style={{ marginTop: 5, fontSize: 24.5, fontWeight: 600, color: NAVY, lineHeight: 1.1 }}>{col.heading}</div>
      </div>
    </div>
  );
}

function BackSheet({ c, back, shown, onClose }) {
  const off = SHEET.inset;
  return (
    <div style={{
      position: 'absolute', left: SHEET.clipL.x, top: SHEET.clipL.y, width: 0, height: 0,
      transform: `rotate(${SHEET.tilt}deg)`, transformOrigin: '50% 0', perspective: 3000, zIndex: 9,
    }}>
      <div style={{
        position: 'absolute', left: -off, top: 14, width: SHEET.w, height: SHEET.h,
        transformOrigin: `${(off / SHEET.w) * 100}% 4%`,
        ...unfoldStyle(shown),
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 2, background: PAPER_BG,
          boxShadow: '0 60px 120px rgba(24,54,104,0.2), 0 16px 34px rgba(24,54,104,0.12)', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.45, background: PAPER_TEX }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 44, background: 'linear-gradient(90deg,rgba(180,196,218,0.16),rgba(255,255,255,0))' }} />
        </div>

        <div onClick={onClose} title="Cerrar" style={{
          position: 'absolute', right: 16, top: 14, width: 66, height: 66, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: '#5E7391', background: 'rgba(22,35,61,0.055)', zIndex: 20,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24"><path d="M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" /></svg>
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', fontSize: 60, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.02em', color: NAVY }}>{back.title}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 118, textAlign: 'center', fontSize: 21, fontWeight: 400, color: '#52658A' }}>{back.subtitle}</div>

        <div style={{ position: 'absolute', left: 420, top: 178, bottom: 34, width: 1, background: 'rgba(120,145,180,0.22)' }} />

        <div style={{ position: 'absolute', left: 42, top: 178, width: 356 }}>
          <ColHead col={back.colA} c={c} />
          <div style={{ marginTop: 16, fontSize: 18, fontWeight: 600, color: NAVY }}>{back.colA.lead}</div>
          <div style={{ marginTop: 9, fontSize: 14.5, lineHeight: 1.48, color: BODY }}>{back.colA.body}</div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {back.colA.tags.map((t) => (
              <div key={t.label}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: c.color }}>{t.label}</div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.42, color: BODY }}>{t.items}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pill label={back.colA.cta} c={c} />
          </div>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-start', gap: 0, marginLeft: -6 }}>
            {back.colA.steps.map((s, i) => (
              <React.Fragment key={s.l1}>
                <div style={{ width: 78, textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, margin: '0 auto', borderRadius: '50%', background: c.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon kind={s.icon} color={c.color} size={24} sw={1.5} />
                  </div>
                  <div style={{ marginTop: 9, fontSize: 12, lineHeight: 1.3, color: BODY, whiteSpace: 'nowrap' }}>
                    <div>{s.l1}</div>
                    <div>{s.l2}</div>
                  </div>
                </div>
                {i < back.colA.steps.length - 1 ? (
                  <div style={{ paddingTop: 13 }}><Arrow color={c.color} size={14} sw={1.9} /></div>
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', left: 446, top: 178, width: 412 }}>
          <ColHead col={back.colB} c={c} />
          <div style={{ marginTop: 16, fontSize: 18, fontWeight: 600, color: NAVY }}>{back.colB.lead}</div>
          <div style={{ marginTop: 9, fontSize: 14.5, lineHeight: 1.48, color: BODY }}>{back.colB.body}</div>
          <div style={{ marginTop: 20, fontSize: 13.5, fontWeight: 700, color: c.color }}>{back.colB.listTitle}</div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            {back.colB.mini.map((m) => (
              <div key={m.label} style={{ border: '1px solid rgba(120,145,180,0.26)', borderRadius: 8, padding: '16px 14px' }}>
                <Icon kind={m.icon} color={c.color} size={24} sw={1.5} />
                <div style={{ marginTop: 13, fontSize: 15, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap' }}>{m.label}</div>
                <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: c.deep, cursor: 'pointer' }}>
                  <span>{m.link}</span><Arrow color={c.deep} size={14} sw={2} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center' }}>
            <Pill label={back.colB.cta} c={c} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ACTION = '#E8005F', ACTION_DEEP = '#D50057';

function FeatureCard({ it, c, w, compact }) {
  const d = compact ? 40 : 46;
  return (
    <div style={{
      boxSizing: 'border-box', width: w, border: '1px solid rgba(120,145,180,0.24)', borderRadius: 9,
      padding: compact ? '13px 13px' : '15px 16px', display: 'flex', alignItems: compact ? 'center' : 'flex-start',
      gap: compact ? 11 : 14, background: 'rgba(255,255,255,0.55)',
    }}>
      <div style={{
        width: d, height: d, minWidth: d, borderRadius: '50%', background: c.tint,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon kind={it.icon} color={c.color} size={compact ? 22 : 25} sw={1.6} />
      </div>
      <div>
        {it.num ? <div style={{ fontSize: 17, fontWeight: 700, color: c.color, lineHeight: 1.1 }}>{it.num}</div> : null}
        <div style={{ marginTop: it.num ? 2 : 0, fontSize: compact ? 13 : 15, fontWeight: 700, color: NAVY, lineHeight: 1.25 }}>{it.title}</div>
        {it.lead ? <div style={{ marginTop: 7, fontSize: 13.5, fontWeight: 600, color: NAVY, lineHeight: 1.35 }}>{it.lead}</div> : null}
        {it.body ? <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.45, color: BODY }}>{it.body}</div> : null}
        {it.note ? <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: c.deep, lineHeight: 1.4 }}>{it.note}</div> : null}
      </div>
    </div>
  );
}

/* second sheet layout: centred header, feature grid, band, one solid CTA */
function GridSheet({ c, back, shown, onClose }) {
  const off = SHEET.inset, H = back.h || SHEET.h;
  return (
    <div style={{
      position: 'absolute', left: SHEET.clipL.x, top: SHEET.clipL.y, width: 0, height: 0,
      transform: `rotate(${SHEET.tilt}deg)`, transformOrigin: '50% 0', perspective: 3000, zIndex: 9,
    }}>
      <div style={{
        position: 'absolute', left: -off, top: 14, width: SHEET.w, height: H,
        transformOrigin: `${(off / SHEET.w) * 100}% 4%`,
        ...unfoldStyle(shown),
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 2, background: PAPER_BG,
          boxShadow: '0 60px 120px rgba(24,54,104,0.2), 0 16px 34px rgba(24,54,104,0.12)', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.45, background: PAPER_TEX }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 44, background: 'linear-gradient(90deg,rgba(180,196,218,0.16),rgba(255,255,255,0))' }} />
        </div>

        <div onClick={onClose} title="Cerrar" style={{
          position: 'absolute', right: 16, top: 14, width: 66, height: 66, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: '#5E7391', background: 'rgba(22,35,61,0.055)', zIndex: 20,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24"><path d="M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" /></svg>
        </div>

        <div style={{
          position: 'absolute', left: 413, top: 24, width: 74, height: 74, borderRadius: '50%',
          background: c.tint, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon kind={back.icon} color={c.color} size={40} sw={1.5} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 108, textAlign: 'center', fontSize: 40, lineHeight: 1, fontWeight: 700, letterSpacing: '0.01em', color: c.color }}>{back.title}</div>
        <div style={{ position: 'absolute', left: 60, right: 60, top: 158, textAlign: 'center', fontSize: 18, lineHeight: 1.35, color: '#52658A' }}>
          {back.subtitle}
          {back.subtitleAccent ? <span style={{ fontWeight: 700, color: c.color }}>{back.subtitleAccent}</span> : null}
        </div>

        {back.rows.map((row, i) => (
          <div key={i} style={{ position: 'absolute', left: 30, right: 30, top: back.rowTops[i], display: 'flex', justifyContent: 'center', gap: 18 }}>
            {row.map((it) => <FeatureCard key={it.title} it={it} c={c} w={back.cardWs[i]} compact={back.compactRow === i} />)}
          </div>
        ))}

        <div style={{
          position: 'absolute', left: 40, right: 40, top: back.bandTop, borderRadius: 8,
          background: 'rgba(203,221,246,0.42)', padding: '13px 20px', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {(back.bands || [back.band]).map((b) => (
            <div key={b.label} style={{ textAlign: 'center', fontSize: 13.5, lineHeight: 1.4, color: '#33445F' }}>
              <span style={{ fontWeight: 700, color: BLUE }}>{b.label}</span>{' '}
              <span>{b.list}</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, top: back.ctaTop, display: 'flex', justifyContent: 'center', gap: 16 }}>
          {(back.ctas || [{ label: back.cta, kind: 'solid' }]).map((b) => (
            <div key={b.label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 12, height: 50, padding: '0 28px',
              borderRadius: 999, fontSize: 17, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              background: b.kind === 'solid' ? (back.ctaColor || ACTION) : 'rgba(255,255,255,0.7)',
              color: b.kind === 'solid' ? '#fff' : (back.ctaColor || ACTION),
              border: b.kind === 'solid' ? '1px solid transparent' : `1px solid ${back.ctaColor || ACTION}55`,
              boxShadow: b.kind === 'solid' ? '0 10px 22px rgba(24,54,104,0.22)' : 'none',
            }}>
              <span>{b.label}</span><Arrow color={b.kind === 'solid' ? '#fff' : (back.ctaColor || ACTION)} size={19} sw={2.1} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderSheet({ c, shown, onClose }) {
  const off = SHEET.inset;
  return (
    <div style={{
      position: 'absolute', left: SHEET.clipL.x, top: SHEET.clipL.y, width: 0, height: 0,
      transform: `rotate(${SHEET.tilt}deg)`, transformOrigin: '50% 0', perspective: 3000, zIndex: 9,
    }}>
      <div style={{
        position: 'absolute', left: -off, top: 14, width: SHEET.w, height: SHEET.h,
        transformOrigin: `${(off / SHEET.w) * 100}% 4%`,
        ...unfoldStyle(shown),
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 2, background: PAPER_BG,
          boxShadow: '0 60px 120px rgba(24,54,104,0.2), 0 16px 34px rgba(24,54,104,0.12)', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.45, background: PAPER_TEX }} />
        </div>
        <div onClick={onClose} title="Cerrar" style={{
          position: 'absolute', right: 16, top: 14, width: 66, height: 66, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: '#5E7391', background: 'rgba(22,35,61,0.055)', zIndex: 20,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24"><path d="M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" /></svg>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', fontSize: 60, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.02em', color: NAVY, textTransform: 'capitalize' }}>{c.word.toLowerCase()}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 124, textAlign: 'center', fontSize: 18, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#78899F' }}>pendiente: subtítulo de {c.word}</div>
        <div style={{ position: 'absolute', left: 420, top: 190, bottom: 34, width: 1, background: 'rgba(120,145,180,0.22)' }} />
        <div style={{ position: 'absolute', left: 42, top: 190, width: 356, display: 'grid', gap: 16 }}>
          <Placeholder label={`bloque 01 de ${c.word}: icono + número + titular + entradilla + párrafo`} h={210} />
          <Placeholder label="listados (a quién va dirigido / áreas) + CTA" h={160} />
          <Placeholder label="proceso en 4 pasos" h={125} />
        </div>
        <div style={{ position: 'absolute', left: 446, top: 190, width: 412, display: 'grid', gap: 16 }}>
          <Placeholder label={`bloque 02 de ${c.word}: icono + número + titular + entradilla + párrafo`} h={210} />
          <Placeholder label="tarjetas de detalle + CTA" h={325} />
        </div>
      </div>
    </div>
  );
}

function Piece({ swayIntensity = 1 }) {
  const { T, CUES, authoredTotal } = useComposition();
  const TI = CUES.Titular, P = CUES.Papeles, R = CUES.Reposo;

  const [open, setOpen] = React.useState(null);
  const [shown, setShown] = React.useState(false);
  const closeTimer = React.useRef(null);

  const doOpen = (i) => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setOpen(i);
  };
  const [returning, setReturning] = React.useState(0);
  const backTimer = React.useRef(null);
  const doClose = () => {
    setShown(false);
    closeTimer.current = setTimeout(() => {
      setOpen(null); closeTimer.current = null;
      setReturning((n) => n + 1);
      if (backTimer.current) clearTimeout(backTimer.current);
      backTimer.current = setTimeout(() => { setReturning(0); backTimer.current = null; }, 1700);
    }, 360);
  };
  React.useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (backTimer.current) clearTimeout(backTimer.current);
  }, []);

  const cx = 960, cy = 540;
  const cs = interpolate([0, R + 0.9], [1.014, 1.0], Easing.easeOutCubic)(T);

  const fade = interpolate([0, 0.22], [0, 1], Easing.easeInOutSine)(T);
  const cable = MOTION.draw(0.1, 0.62)(T);
  const bgP = MOTION.enter(0, 1, 0, 0.7)(T);
  const prog = T / Math.max(authoredTotal, 1);

  const rise = (s, e, d) => {
    const p = MOTION.enter(0, 1, s, e)(T);
    return { opacity: p, transform: `translateY(${(1 - p) * d}px)` };
  };
  const dash = (s) => ({ transform: `scaleX(${MOTION.enter(0, 1, s, s + 0.4)(T)})`, transformOrigin: '0% 50%' });

  const oc = open != null ? CARDS[open] : null;
  const back = oc ? BACKS[oc.word] : null;
  const clipS = shown ? 1 : 0;
  React.useEffect(() => {
    if (open == null) return;
    const t = setTimeout(() => setShown(true), 16);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div data-screen-label={`t=${T.toFixed(0)}s`} style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden', opacity: fade }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${960 - cx * cs}px, ${540 - cy * cs}px) scale(${cs})`, willChange: 'transform' }}>

        <div style={{ position: 'absolute', left: -600, top: -400, width: 3120, height: 1880, overflow: 'hidden' }}>
          <img src="assets/fondo.png" alt="" style={{
            position: 'absolute', left: '-3%', top: '-3%', width: '106%', height: '106%',
            objectFit: 'cover', opacity: 0.62 * bgP,
            transform: `scale(${1 + 0.04 * prog}) translateX(${-14 * prog}px)`,
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(2200px 1500px at 700px 880px, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.9) 26%, rgba(255,255,255,0.5) 54%, rgba(255,255,255,0.1) 86%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 30%, rgba(238,244,252,0.4) 100%)' }} />
          {/* bruma azul: separa el blanco del papel del blanco del fondo */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1700px 1150px at 62% 74%, rgba(178,203,238,0.5) 0%, rgba(199,218,244,0.3) 42%, rgba(219,232,249,0.12) 68%, rgba(255,255,255,0) 88%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(184deg, rgba(255,255,255,0) 26%, rgba(197,216,243,0.2) 62%, rgba(180,203,238,0.42) 100%)' }} />
        </div>

        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: 4, pointerEvents: 'none' }}>
          <defs>
            <pattern id="rope-twist" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">
              <line x1="0.6" y1="-2" x2="0.6" y2="13" stroke="#B5A995" strokeWidth="2.1" opacity="0.5" />
              <line x1="4.4" y1="-2" x2="4.4" y2="13" stroke="#FFFDF8" strokeWidth="1.5" opacity="0.65" />
            </pattern>
          </defs>
          <path d="M -140 101 Q 1200 283 2400 375" fill="none" stroke="#A79B88" strokeWidth="19" strokeLinecap="round" opacity="0.3"
            pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - cable} />
          <path d="M -140 98 Q 1200 280 2400 372" fill="none" stroke="#D7CFC1" strokeWidth="17.5" strokeLinecap="round"
            pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - cable} />
          <path d="M -140 96.6 Q 1200 278.6 2400 370.6" fill="none" stroke="#EFEAE0" strokeWidth="11.5" strokeLinecap="round"
            pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - cable} />
          <path d="M -140 94.4 Q 1200 276.4 2400 368.4" fill="none" stroke="#FCFAF6" strokeWidth="4.5" strokeLinecap="round"
            pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - cable} />
          <path d="M -140 98 Q 1200 280 2400 372" fill="none" stroke="url(#rope-twist)" strokeWidth="17.5" strokeLinecap="round" opacity="0.6"
            pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - cable} />
        </svg>

        <div style={{ position: 'absolute', left: 86, top: 182, width: 470, zIndex: 3 }}>
          <div style={{ width: 40, height: 3, background: BLUE, ...dash(0.34) }} />
          <div style={{ marginTop: 26, fontSize: 24, fontWeight: 500, letterSpacing: '0.36em', color: EYEBROW, ...rise(0.42, 0.72, 12) }}>SERVICIOS</div>
          <div style={{ marginTop: 30, fontSize: 44, lineHeight: 1.14, fontWeight: 700, letterSpacing: '-0.02em', color: NAVY, width: 448, textWrap: 'pretty' }}>
            <div style={rise(TI + 0.02, TI + 0.4, 32)}>Tres caminos, un mismo objetivo:</div>
            <div style={{ marginTop: 12, color: BLUE, ...rise(TI + 0.13, TI + 0.51, 32) }}>Comunicación que transforma.</div>
          </div>
          <div style={{ marginTop: 28, fontSize: 21.5, lineHeight: 1.6, fontWeight: 400, color: MUTED, width: 448, textWrap: 'pretty', ...rise(TI + 0.34, TI + 0.68, 20) }}>
            Combinamos formación, estrategia y soluciones digitales para que personas, equipos e instituciones comuniquen mejor, lleguen más lejos y generen un impacto real.
          </div>
          <div style={{ marginTop: 36, width: 40, height: 3, background: BLUE, ...dash(TI + 0.56) }} />
          <div style={{ marginTop: 24, fontSize: 17, fontWeight: 500, letterSpacing: '0.18em', color: BLUE, ...rise(TI + 0.62, TI + 0.96, 14) }}>
            Pulsa una etiqueta para darle la vuelta
          </div>
        </div>

        {CARDS.map((c, i) => (
          <Card key={c.word} c={c} T={T} cue={P + c.off} sway={swayIntensity} idx={i} returning={returning}
            state={open == null ? 'idle' : (open === i ? 'flipping' : 'away')}
            onOpen={() => doOpen(i)} />
        ))}

        {oc ? (
          <React.Fragment>
            <div onClick={doClose} title="Cerrar" style={{ position: 'absolute', left: -600, top: -400, width: 3120, height: 1880, zIndex: 8, cursor: 'default' }} />
            <Clip x={SHEET.clipL.x} y={SHEET.clipL.y} s={clipS} width={64} stub={6.63} delay={shown ? 620 : 0} />
            <Clip x={SHEET.clipR.x} y={SHEET.clipR.y} s={clipS} width={64} stub={5.71} delay={shown ? 780 : 0} />
            {back
              ? <GridSheet key={oc.word} c={oc} back={back} shown={shown} onClose={doClose} />
              : <PlaceholderSheet c={oc} shown={shown} onClose={doClose} />}
            {back && back.closing ? (
              back.closing.place === 'below' ? (
                <div style={{
                  position: 'absolute', left: 660, top: 906, width: 600, textAlign: 'center', zIndex: 10,
                  opacity: shown ? 1 : 0, transform: `translateY(${shown ? 0 : 18}px)`,
                  transition: `opacity 340ms ease 860ms, transform 420ms ${EASE_UI} 860ms`,
                }}>
                  <div style={{ width: 40, height: 3, background: BLUE, margin: '0 auto' }} />
                  <div style={{ marginTop: 20, fontSize: 27, lineHeight: 1.16, fontWeight: 700, letterSpacing: '-0.015em', color: NAVY }}>{back.closing.heading}</div>
                  <div style={{ marginTop: 12, fontSize: 17, lineHeight: 1.5, color: MUTED }}>{back.closing.body}</div>
                  <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 11, height: 46, padding: '0 26px',
                      borderRadius: 999, border: '1px solid rgba(27,108,242,0.35)', background: 'rgba(255,255,255,0.7)',
                      color: '#14539E', fontSize: 17, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                      <span>{back.closing.cta}</span><Arrow color="#14539E" size={17} sw={2.1} />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'absolute', left: 1572, top: 470, width: 292, zIndex: 10,
                  opacity: shown ? 1 : 0, transform: `translateY(${shown ? 0 : 18}px)`,
                  transition: `opacity 340ms ease 860ms, transform 420ms ${EASE_UI} 860ms`,
                }}>
                  <div style={{ width: 40, height: 3, background: oc.color }} />
                  <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1.16, fontWeight: 700, letterSpacing: '-0.015em', color: NAVY }}>{back.closing.heading}</div>
                  <div style={{ marginTop: 16, fontSize: 18, lineHeight: 1.55, color: MUTED }}>{back.closing.body}</div>
                  <div style={{ marginTop: 26 }}><Pill label={back.closing.cta} c={oc} /></div>
                </div>
              )
            ) : null}
          </React.Fragment>
        ) : null}

        <div style={{ position: 'absolute', left: 86, bottom: 66, zIndex: 3, ...rise(R + 0.05, R + 0.45, 22) }}>
          <div style={{ fontSize: 46, fontWeight: 600, letterSpacing: '0.2em', color: NAVY }}>RETORIKA</div>
        </div>
        <div style={{
          position: 'absolute', right: 108, bottom: 74, zIndex: 3, display: 'flex', alignItems: 'center', gap: 24,
          ...rise(R + 0.16, R + 0.56, 16),
          opacity: open != null ? 0 : rise(R + 0.16, R + 0.56, 16).opacity,
          transition: 'opacity 300ms ease',
        }}>
          <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: '0.3em', color: '#7C90AE' }}>COMUNICACIÓN QUE TRANSFORMA</div>
          <div style={{ width: 46, height: 3, background: BLUE }} />
        </div>
      </div>
    </div>
  );
}

function TendederoStage(props) {
  return (
    <CompositionStage width={W} height={H} bg="#ffffff" scenes={window.OM_SCENES} playback={window.OM_PLAYBACK}>
      <Piece swayIntensity={props.swayIntensity} />
    </CompositionStage>
  );
}

window.TendederoStage = TendederoStage;
window.TendederoPiece = Piece;
