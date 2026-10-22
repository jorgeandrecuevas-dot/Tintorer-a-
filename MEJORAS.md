# Qué hace falta y por dónde seguir

Revisión del 22 de octubre. Compara los 23 apuntes de `APUNTES.md` contra lo
que la aplicación hace hoy.

## Los 23 puntos, uno por uno

De 23 apuntes hay **17 hechos, 5 a medias y 1 sin hacer.**

| # | Lo que dijo el negocio | Cómo está |
|---|---|---|
| 1 | Lavandería en kg, tintorería por pieza | Hecho |
| 2 | Etiquetar con el número de pedido | Hecho. Además se cuenta lo que regresa |
| 3 | Nota de la maquila con el total que va y que vuelve | Hecho |
| 4 | Se le paga antes de llevarse la ropa | Hecho, va en la nota de maquila |
| 5 | Pesa más la cantidad que el tipo de ropa | Hecho, la cantidad va primero |
| 6 | Una tablet por sucursal | **A medias.** Hay una sola, y «Sucursal 1» está escrito a mano |
| 7 | Registro para cliente, maquila y costos | Hecho, son cuatro documentos |
| 8 | Control financiero | Hecho, pantalla de Corte |
| 9 | Anticipo y pago total | Hecho. El monto se escribe |
| 10 | Estatus del pedido | Hecho, cinco etapas |
| 11 | Checklist de entregadas y pendientes | **A medias.** El tablero lo enseña, pero no hay lista para palomear |
| 12 | Martes, jueves y sábado | Hecho, la fecha de entrega sale sola |
| 13 | Cobertores tardan más | Hecho, saltan un ciclo |
| 14 | A veces van ellos, a veces vienen | **Sin hacer.** No cambia nada en pantalla |
| 15 | El lunes aparta lo que sale el martes | **A medias.** Maquila enseña lo que sale, pero no por fecha |
| 16 | Imprimir lo capturado y el documento para firmar con la maquila | Hecho |
| 17 | Tres PDF | **A medias.** Se imprimen desde el navegador. No se genera el archivo |
| 18 | El número de nota lo pone él | Hecho |
| 19 | El cliente firma de recibido | Hecho |
| 20 | Firmar de recibido y entregado, sin internet | Hecho. Probado con el servidor apagado |
| 21 | Foto de la ropa | Hecho, con la cámara |
| 22 | Observaciones de botón faltante o ropa rota | Hecho |
| 23 | Mínimo 50% de anticipo | Hecho, avisa si baja de ahí |

## Lo que hace falta, por riesgo

### 1. Las fotos llenan la tablet a la quinta nota

Está medido en Chrome, no es cálculo:

| | |
|---|---|
| Una foto achicada a 1000 px | 252 KB |
| Una nota con cuatro fotos y su firma | 1,032 KB |
| Notas que caben antes de tronar | **4** |

El almacén del navegador son 5 MB y no sube. Esto tumba la aplicación el
primer día de uso real. Las fotos van a IndexedDB, que sí crece con el disco.

### 2. No hay respaldo

Todo vive en una tablet. Se moja, se cae o alguien le borra los datos del
navegador y se va la libreta completa del negocio.

### 3. No se busca una nota

Son 90 notas al mes. Llega el cliente con su ticket y hay que recorrer cinco
columnas con el dedo. Falta escribir el número o el nombre y que salga.

### 4. El teléfono se captura y no sirve de nada

Se guarda y ahí se queda. Con la ropa embolsada el jueves a mediodía, un
mensaje al cliente vacía el mostrador más rápido.

### 5. El cliente se vuelve a teclear cada vez

No hay historial. La señora que viene cada semana se escribe de cero cada
semana, con su teléfono.

### 6. Dos sucursales no se hablan

El punto 6 pide una tablet por sucursal. Hoy el corte del punto 8 no va a
cuadrar cuando sean dos.

### 7. La merma del anticipo no se mide

El punto 23 la menciona como la razón del 50%. No hay dónde apuntar la ropa
que nadie recogió.

## Lo que mejoraría del código

- `script.js` son 1,554 líneas en un archivo. Todavía se lee, pero ya va
  para largo. Tocaría partirlo por pantalla.
- Cada guardada vuelve a escribir todas las notas completas. Con 500 notas
  y fotos adentro eso tarda en cada captura.
- «Sucursal 1» está en tres lugares distintos del código.
- Las pruebas viven fuera del repo. Deberían venir adentro.

## Tres caminos

### A. Aguantar en la tablet

Una semana. Fotos a IndexedDB, botón de respaldo a un archivo, buscador de
notas e historial de clientes. Sin servidor.

Arregla los puntos 1 al 5. Sigue sin resolver dos sucursales. Es lo que
evita que truene y es lo más barato.

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

## Qué haría yo

**A esta semana**, pase lo que pase. El punto 1 tumba la aplicación en frío y
no depende de ninguna decisión del dueño.

**B después**, cuando confirme cuántas sucursales son. Es la pregunta 4 de
`APUNTES.md` y cambia si B vale la pena o no.

**C solo si lo vas a vender a más de un negocio.**
