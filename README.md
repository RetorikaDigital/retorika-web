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
- **Recursos** cuelga los artículos de una cuerda que cruza la sección de lado a
  lado: cada hoja se sitúa a la altura que le marca la comba y se balancea a su
  ritmo. Las hojas son las mismas de la escena de Servicios, con su pinza; se
  copiaron a `assets/recursos/papel-1..3.webp` y se les borró lo impreso
  rehaciendo el papel (el tono se interpola desde los bordes y el grano se copia
  de una banda limpia), de modo que `escena/` sigue intacta. Cada hoja conserva
  su proporción exacta para que el papel no se estire, y como son altas,
  `script.js` mide el hueco que queda entre los filtros y la línea de abajo para
  decidir su tamaño; si la ventana es muy baja la sección se deja desplazar en
  vez de recortarlas. Los filtros de categoría funcionan (y avisan cuando una
  todavía no tiene artículos). Los cinco artículos son de muestra: los titulares
  están escritos para el ejemplo y todos los enlaces llevan al blog real.
- **El pie** cierra la sección de Contacto: enlaces a las secciones, a los
  artículos y a las redes reales de Retorika (LinkedIn, Instagram, YouTube y
  WhatsApp), y los cuatro textos legales apuntan a las páginas de
  asesoriaretorika.com, no a copias.
- **Los logotipos de "Confían en Retorika"** se ven nada más abrir la web; el
  rótulo funciona como interruptor y los recoge si en algún momento estorban.
  Están recortados de una captura; si se consiguen los originales en SVG
  ganarían nitidez.
- La escena de fondo procede de `Fondo.png` y `Fondo_Sin_Persona.png`, que se
  conservan en el disco como material original pero ya no se publican (eran
  6,9 MB que nadie llegaba a descargar); la web usa las versiones optimizadas
  `assets/hero.jpg` y `assets/hero-clean.jpg`.

## Contacto de Retorika

- WhatsApp: +34 669 531 713
- Email: direccion@asesoriaretorika.com
- Instagram: [@retorika_academy](https://instagram.com/retorika_academy)
