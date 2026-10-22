# Qué hace falta y por dónde seguir

Revisión del 22 de octubre. Compara los 23 apuntes de `APUNTES.md` contra lo
que la aplicación hace hoy.

**Ya se hizo el camino A.** Los puntos 1, 2, 3 y 5 de «Lo que hace falta»
quedaron resueltos. Lo que sigue abajo con un ✓ ya está.

## Los 23 puntos, uno por uno

De 23 apuntes hay **20 hechos, 2 a medias y 1 sin hacer.**

| # | Lo que dijo el negocio | Cómo está |
|---|---|---|
| 1 | Lavandería en kg, tintorería por pieza | Hecho |
| 2 | Etiquetar con el número de pedido | Hecho. Además se cuenta lo que regresa |
| 3 | Nota de la maquila con el total que va y que vuelve | Hecho |
| 4 | Se le paga antes de llevarse la ropa | Hecho, va en la nota de maquila |
| 5 | Pesa más la cantidad que el tipo de ropa | Hecho, la cantidad va primero |
| 6 | Una tablet por sucursal | **A medias.** Hay una sola. Cada tablet ya lleva su nombre, pero no se hablan |
| 7 | Registro para cliente, maquila y costos | Hecho, son cuatro documentos |
| 8 | Control financiero | Hecho, pantalla de Corte |
| 9 | Anticipo y pago total | Hecho. El monto se escribe |
| 10 | Estatus del pedido | Hecho, cinco etapas |
| 11 | Checklist de entregadas y pendientes | Hecho, lista de entregas en el tablero |
| 12 | Martes, jueves y sábado | Hecho, la fecha de entrega sale sola |
| 13 | Cobertores tardan más | Hecho, saltan un ciclo |
| 14 | A veces van ellos, a veces vienen | **Sin hacer.** Falta que el dueño confirme cómo es |
| 15 | El lunes aparta lo que sale el martes | Hecho, Maquila dice qué día sale y se palomea lo apartado |
| 16 | Imprimir lo capturado y el documento para firmar con la maquila | Hecho |
| 17 | Tres PDF | **A medias.** Se imprimen desde el navegador y ahí se guarda como PDF. No se genera el archivo directo |
| 18 | El número de nota lo pone él | Hecho |
| 19 | El cliente firma de recibido | Hecho |
| 20 | Firmar de recibido y entregado, sin internet | Hecho. Probado con el servidor apagado |
| 21 | Foto de la ropa | Hecho, con la cámara |
| 22 | Observaciones de botón faltante o ropa rota | Hecho |
| 23 | Mínimo 50% de anticipo | Hecho, avisa si baja de ahí |

## Lo que hace falta, por riesgo

### 1. Las fotos llenan la tablet a la quinta nota ✓

Las imágenes se fueron a IndexedDB. Una nota pasó de 1,032 KB a 331 bytes en
el almacén chico. Probadas 4,000 notas sin que truene, contra las 4 de antes.

### 2. No hay respaldo ✓

En Corte hay botón para bajar un archivo con todas las notas y sus imágenes,
y otro para restaurarlo.

### 3. No se busca una nota ✓

El tablero tiene buscador por número de nota o por cliente, sin pedir
acentos.

### 4. El teléfono se captura y no sirve de nada ✓

La ropa embolsada trae un botón que abre WhatsApp con el mensaje escrito.

### 5. El cliente se vuelve a teclear cada vez ✓

Al escribir dos letras del nombre salen los clientes que ya vinieron, con su
teléfono. Se toca uno y se llenan los dos campos.

### 6. Dos sucursales no se hablan

El punto 6 pide una tablet por sucursal. Hoy el corte del punto 8 no va a
cuadrar cuando sean dos.

### 7. La merma del anticipo ✓ se mide, falta evitarla

La merma es cuando dejan el anticipo y no regresan por la ropa. La maquila ya
se pagó y el negocio no gana nada. Corte ya cuenta la ropa que lleva 15 días
o más embolsada y dice cuánto anticipo se quedó contra cuánto se le pagó a la
maquila.

Evitarla es decisión del dueño. Hay un dato que ayuda: **el anticipo de 50%
no cubre lo que cobra la maquila en 45 de las 56 piezas.** Una camisa deja
$35 y cuesta $40. Un vestido de novia de $1,200 deja $600 y cuesta $800.
Cada prenda que no recogen es pérdida, aunque dejen anticipo.

Dos ideas para platicar con él:

1. **Anticipo mínimo igual al costo de la maquila**, no el 50% fijo. Es lo que
   ya sale de su bolsa antes de que la ropa se vaya.
2. **Cargo por almacenaje** que empiece unos días después de la fecha
   prometida. Tiene que ir impreso en el ticket y firmado por el cliente. Se
   llama cargo, no interés, y conviene que tenga tope y un plazo después del
   cual el negocio se queda con la prenda. Hay que revisar con alguien que
   sepa qué se puede cobrar así.

Las notas nuevas ya guardan la fecha prometida completa para poder contar
de ahí.

## Lo que mejoraría del código

- `script.js` son 1,554 líneas en un archivo. Todavía se lee, pero ya va
  para largo. Tocaría partirlo por pantalla.
- Cada guardada vuelve a escribir todas las notas completas. Con 500 notas
  y fotos adentro eso tarda en cada captura.
- «Sucursal 1» está en tres lugares distintos del código.
- Las pruebas viven fuera del repo. Deberían venir adentro.

## Tres caminos

### A. Aguantar en la tablet ✓ hecho

Fotos a IndexedDB, botón de respaldo a un archivo, buscador de notas e
historial de clientes. Sin servidor.

Arregló los puntos 1, 2, 3 y 5. Siguen pendientes el aviso al cliente, las
dos sucursales y la merma.

### B. Supabase atrás

Dos o tres semanas. La misma aplicación, pero las notas van a Supabase y las
fotos a su almacén. Mientras no haya señal se guarda en la tablet y se sube
cuando vuelve.

Arregla los siete puntos. Las dos sucursales ven lo mismo, el respaldo es
automático y el corte cuadra. El stack ya está en el proyecto.

### C. Pasarla a Next.js

Tres o cuatro semanas. Las pantallas se rehacen en Next con Tailwind, se sube
a Vercel y Supabase va atrás. Se instala como aplicación en la tablet.

Deja un producto que le puedes vender a más de una tintorería: PDF de verdad,
usuarios por sucursal, precios editables sin tocar código. Es el más caro.

## Qué sigue

**A ya está.** La aplicación aguanta trabajando en el mostrador.

**B, cuando el dueño confirme cuántas sucursales son.** Es la pregunta 4 de
`APUNTES.md` y decide si B vale la pena o no. Mientras usen una tablet, B no
compra nada que A no haya dado.

**C solo si lo vas a vender a más de un negocio.**
