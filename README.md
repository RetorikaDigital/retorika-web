# Retorika — demo web

Prototipo de la web de Retorika: una sola página con cinco pantallas que se
relevan con un fundido (Inicio · Servicios · Nosotros · Recursos · Contacto) sobre
la misma escena,
de modo que al cambiar de sección el decorado no se mueve y solo desaparece la
figura que camina.

## Cómo verla

No necesita compilación ni dependencias: se abre `index.html` en el navegador.

## Qué hay dentro

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de las cinco pantallas y de las ventanas emergentes |
| `styles.css` | Todo el diseño, incluidos los ajustes por altura de ventana |
| `escena/` | La animación del tendedero, tal como vino de Claude Design |
| `script.js` | Pase de secciones, anclaje de los punteros al camino y ventanas |
|  | Fondos, logotipo, logos de clientes y las hojas del tendedero |

## Detalles a tener en cuenta

- **El formulario de contacto es una demo**: confirma el envío en pantalla pero
  no manda nada. Falta conectarlo a un correo o a un servicio de formularios.
- **Servicios es la animación original, sin tocar**: los archivos de la escena
  del tendedero están tal cual en `escena/` (su `.dc.html`, `support.js`, los
  dos `.jsx` y sus imágenes) y la sección los carga en un marco propio. Desde
  la web sólo se le quita por fuera el reproductor del editor —el propio
  runtime lo marca como `data-omelette-chrome`, "se ve sólo fuera de la app"—
  y se reenvían los gestos de rueda para que el pase de secciones siga yendo.
  Si hay que retocar la animación, se edita en su carpeta y ya está: la web no
  la reinterpreta.
- **La escena necesita internet**: su runtime carga React y Babel desde unpkg,
  y sus imágenes son los PNG originales (4,4 MB en total), así que la primera
  vez tarda un poco en aparecer.
- **En el móvil (hasta 860 px de ancho)** todo lo propio vive en el último
  bloque `@media (max-width:860px)` de `styles.css`, así que el ordenador no lo
  ve. Servicios cambia la escena por las tres hojas juntas colgadas de una
  cuerda (`assets/servicios/`, copias de las de la escena) y cada hoja abre su
  ficha; los testimonios se deslizan con el dedo, con puntitos que marcan
  por dónde vas. El equipo va en dos columnas, El camino lleva una línea que
  une los pasos, los filtros de Recursos caben en una fila deslizable y el pie
  va en dos columnas. El marco de la escena sigue cargándose aunque no se vea.
- **La portada del móvil** es la maqueta vertical: `assets/portada-movil.jpg`
  es esa imagen con los textos y la barra borrados (la figura, el camino y los
  tres puntos siguen pintados). Los textos, el botón, "Elige tu camino" y la
  barra de los tres caminos van encima en HTML, medidos en píxeles de la
  maqueta (850 x 1850), y sobre cada punto hay un botón invisible que abre su
  ficha. Al bajar, la escena se disuelve y queda el fondo sin persona, fijo
  detrás de toda la página, que se va desplazando hasta las gradas.
- **Nosotros** tiene dos planos dentro de la misma pantalla: el proceso de
  trabajo (la onda se traza sola y los cuatro pasos aparecen sobre ella, todo
  en SVG) y el equipo. Se pasa de uno a otro con la rueda, las flechas o la
  pastilla de abajo a la izquierda; al llegar desde arriba se entra por el
  proceso y al volver desde Contacto se entra por el equipo.
- **Las fotos del equipo**: ya están las de Belén Montes, Carlos García,
  Cristina Guerrero, Jorge Whyte y Oriana González. Faltan las de Rodrigo
  Herreros, Carlos Salcedo y Amalia Espejo, que mientras tanto muestran sus
  iniciales sobre un degradado; en cuanto se dejen los archivos en
  `assets/equipo/` con los nombres del `LEEME.txt`, la web los coloca sola.
  Los originales sin recortar se quedan en esa misma carpeta pero no se
  publican. El botón «+» de cada tarjeta abre la trayectoria completa; la de
  Carlos Salcedo y la de Amalia Espejo están pendientes de texto.
- **Recursos** es una parrilla: a la izquierda el titular, los filtros y el
  botón; en el centro el recurso destacado con su foto; a la derecha la
  columna de últimas novedades con su línea de tiempo; y debajo dos fichas y
  el proyecto. Ocupa exactamente el alto de la pantalla en escritorio y, por
  debajo de 1180 px, se deshace en columnas y la sección se deja desplazar.
  Los filtros funcionan sobre `data-cat`, donde cada ficha lleva sus etiquetas
  separadas por espacios (una por formato y otra por tema), así que un mismo
  recurso sale con varios filtros. **El contenido es de muestra**: los cuatro
  artículos son los de antes, y las novedades y el proyecto "Ciudades que
  dialogan" vienen de la maqueta. Todos los enlaces llevan al blog real.
  Las dos fotos (`assets/recursos/foto-*.jpg`) son recortes de la propia
  imagen del héroe.
- **El pie** cierra la sección de Contacto: enlaces a las secciones, a los
  artículos y a las redes reales de Retorika (LinkedIn, Instagram, YouTube y
  WhatsApp), y los cuatro textos legales apuntan a las páginas de
  asesoriaretorika.com, no a copias.
- **Los logotipos de "Confían en Retorika"** se ven nada más abrir la web; el
  rótulo funciona como interruptor y los recoge si en algún momento estorban.
  Son trece y van en gris, para que ninguna marca grite más que otra; al pasar
  el ratón cada una recupera su color. Once están recortados de una captura y
  ganarían nitidez con los originales en SVG. Los de Naijart y la Mancomunidad
  del Noroeste se han bajado de sus propias webs (naijart.com y
  mancomunidaddelnoroeste.org): son los buenos, pero la mayor resolución que
  publican es pequeña, así que en pantallas de mucha densidad se verán algo
  blandos hasta que los clientes envíen un archivo mejor.
- **El botón de la cabecera dice "Log in"** y abre la puerta del área privada.
  No hay área todavía ni cuentas que crear: el formulario valida el correo y
  la contraseña y responde como lo haría el de verdad, pero **no envía ni
  guarda nada**, y a propósito no ofrece darse de alta, sólo entrar. La
  ventana lo advierte por escrito, para que a nadie que pase por la web se le
  ocurra escribir una contraseña suya. Cuando se decida quién entra y qué ve,
  se cambia el bloque 14 de `script.js`.
- **"Diseña tu plan"**, en la portada, abre un cuestionario de cinco preguntas
  y al terminar deja el resumen escrito en el formulario de Contacto y lleva
  hasta allí. **Las preguntas son de muestra**: sirven para enseñar cómo
  funcionaría, y hay que cambiarlas por las del comentario del 25 de agosto.
  Están todas juntas en `script.js`, en la lista `PREGUNTAS`.
- **El logotipo** (`assets/retorika-logo.png`) va en el azul de la web
  (#1D6DF0) mientras se decide el logo nuevo; es el mismo dibujo que el azul
  oscuro de antes, recoloreado conservando su transparencia. Si se cambia el
  archivo, hay que subir el `?v=` de sus cuatro apariciones en `index.html`.
- La escena de fondo procede de `Fondo.png` y `Fondo_Sin_Persona.png`, que se
  conservan en el disco como material original pero ya no se publican (eran
  6,9 MB que nadie llegaba a descargar); la web usa las versiones optimizadas
  `assets/hero.jpg` y `assets/hero-clean.jpg`.

## Contacto de Retorika

- WhatsApp: +34 669 531 713
- Email: direccion@asesoriaretorika.com
- Instagram: [@retorika_academy](https://instagram.com/retorika_academy)
