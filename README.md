# Retorika — demo web

Prototipo de la web de Retorika: una sola página con cuatro pantallas que se
relevan con un fundido (Inicio · Servicios · Nosotros · Contacto) sobre la misma
escena,
de modo que al cambiar de sección el decorado no se mueve y solo desaparece la
figura que camina.

## Cómo verla

No necesita compilación ni dependencias: se abre `index.html` en el navegador.

## Qué hay dentro

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de las cuatro pantallas y de las ventanas emergentes |
| `styles.css` | Todo el diseño, incluidos los ajustes por altura de ventana |
| `script.js` | Pase de secciones, anclaje de los punteros al camino y ventanas |
|  | Fondos, logotipo, logos de clientes y las hojas del tendedero |

## Detalles a tener en cuenta

- **El formulario de contacto es una demo**: confirma el envío en pantalla pero
  no manda nada. Falta conectarlo a un correo o a un servicio de formularios.
- **Servicios** es un tendedero: la cuerda se tiende, caen tres hojas de papel
  y se quedan balanceándose. Al pulsar una, las demás se sueltan y caen y la
  elegida se despliega con todo el detalle del servicio; al cerrarla vuelven
  deslizándose por la cuerda. La escena está dibujada sobre un lienzo de
  1920 x 1080 que el guion escala para que quepa entera en la sección, así que
  no se descuadra a ningún tamaño. Las hojas están en `assets/tendedero/`
  (WebP, unos 60 KB cada una); los originales de la animación se quedan fuera
  del repositorio.
- **Nosotros** tiene dos planos dentro de la misma pantalla: el proceso de
  trabajo (la onda se traza sola y los cuatro pasos aparecen sobre ella, todo
  en SVG) y el equipo. Se pasa de uno a otro con la rueda, las flechas o la
  pastilla de abajo a la izquierda; al llegar desde arriba se entra por el
  proceso y al volver desde Contacto se entra por el equipo.
- **Las fotos del equipo aún no están**: cada ficha muestra las iniciales
  sobre un degradado y, en cuanto se dejen los archivos en `assets/equipo/`
  con los nombres indicados en su `LEEME.txt`, la web los coloca sola.
  El botón «+» de cada tarjeta abre la trayectoria completa; la de Carlos
  Salcedo y la de Amalia Espejo están pendientes de texto.
- **Los logotipos de "Confían en Retorika"** están recortados de una captura;
  si se consiguen los originales en SVG ganarían nitidez.
- La escena de fondo procede de `Fondo.png` y `Fondo_Sin_Persona.png`, que se
  conservan como material original; la web usa las versiones optimizadas
  `assets/hero.jpg` y `assets/hero-clean.jpg`.

## Contacto de Retorika

- WhatsApp: +34 669 531 713
- Email: direccion@asesoriaretorika.com
- Instagram: [@retorika_academia](https://instagram.com/retorika_academia)
