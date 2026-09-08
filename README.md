# Retorika — demo web

Prototipo de la web de Retorika: una sola página con tres pantallas que se
relevan con un fundido (Inicio · Servicios · Contacto) sobre la misma escena,
de modo que al cambiar de sección el decorado no se mueve y solo desaparece la
figura que camina.

## Cómo verla

No necesita compilación ni dependencias: se abre `index.html` en el navegador.

## Qué hay dentro

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de las tres pantallas y de las ventanas emergentes |
| `styles.css` | Todo el diseño, incluidos los ajustes por altura de ventana |
| `script.js` | Pase de secciones, anclaje de los punteros al camino y ventanas |
|  | Fondos, logotipo, logos de clientes y las etiquetas de Servicios |

## Detalles a tener en cuenta

- **El formulario de contacto es una demo**: confirma el envío en pantalla pero
  no manda nada. Falta conectarlo a un correo o a un servicio de formularios.
- **Servicios** son tres etiquetas colgantes que caen al entrar en la sección,
  se balancean, reciben un empujón al pasar el puntero y se dan la vuelta al
  pulsarlas. Los recursos están en `assets/etiquetas/`.
- **Los logotipos de "Confían en Retorika"** están recortados de una captura;
  si se consiguen los originales en SVG ganarían nitidez.
- La escena de fondo procede de `Fondo.png` y `Fondo_Sin_Persona.png`, que se
  conservan como material original; la web usa las versiones optimizadas
  `assets/hero.jpg` y `assets/hero-clean.jpg`.

## Contacto de Retorika

- WhatsApp: +34 669 531 713
- Email: direccion@asesoriaretorika.com
- Instagram: [@retorika_academia](https://instagram.com/retorika_academia)
