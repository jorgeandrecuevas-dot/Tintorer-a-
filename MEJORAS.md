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
| 14 | A veces van ellos, a veces vienen | **Sin hacer.** A veces la maquila lleva la ropa a casa del dueño. Falta saber si hay que registrar dónde llegó |
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

Esto se revisó de nuevo el 23 de octubre. Está al final, en «Revisión del 23
de octubre», con números medidos.

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


## Revisión del 23 de octubre

**Estado: los tres lotes están hechos.** El detalle va en «Qué quedó» más
abajo. Los números de esta revisión son de antes de los lotes.

Se revisó el código, se corrió la aplicación con casos raros y se midió. Todo
se probó en Chrome sin pantalla, con tamaños de iPad. **No se ha probado en
un iPad de verdad.** Eso es lo primero que falta.

Se midió esto:

| | |
|---|---|
| Líneas | 2,464 de script.js, 614 de index.html, 264 de CSS |
| Funciones | 77 |
| Escrituras de notas | 14 sitios, solo 2 revisan si se pudo guardar |
| Con 1,000 notas | guardar 9 ms, tablero 31 ms, corte 21 ms, una tecla en el buscador 1 ms |
| Lo que pesa una nota en la tablet | 330 a 410 bytes (las imágenes viven aparte) |

La app aguanta miles de notas sin problema. Lo que dije antes de que cada
guardada reescribe todo y tardaba **no es cierto** desde que las imágenes se
fueron a IndexedDB.

### Fallas encontradas

| # | Falla | Qué pasa |
|---|---|---|
| 1 | Lavandería con 0 kg | Guarda una nota de $0 con 1 pieza |
| 2 | Lavandería con -5 kg | Guarda una nota con total -$225 y el Corte baja |
| 3 | Mismo número de nota dos veces | Lo acepta sin avisar. Quedan dos notas 0100 |
| 4 | Fecha prometida y hora | Una nota levantada el martes a las 3 pm promete el jueves. El carro salió a las 7 am. Sale el jueves y regresa el sábado: un ciclo de error |
| 5 | «Por cobrar» en amarillo sobre blanco | Contraste 1.6 a 1. El mínimo es 4.5. Casi no se lee |
| 6 | Buscar por teléfono | No encuentra nada |
| 7 | Dos escrituras sin revisar | Si falla el almacén, la pantalla dice que se guardó |

La 4 necesita la hora de salida de cada día. Los apuntes dicen martes a las
7 am. Faltan jueves y sábado.

### Funcionamiento

**Corte.** Hoy suma todas las notas desde siempre. No hay por día, por semana
ni por mes. Es el punto 8 de los apuntes y se va a notar a las dos semanas.

- La utilidad es facturado menos maquila. Cuenta como ganancia lo que nadie ha
  pagado todavía. Hace falta también una utilidad con lo cobrado.
- Una nota guarda un solo número de «pagado». No guarda cuándo ni cuánto en
  cada pago. Sin eso no se puede sacar «cobrado hoy». Hace falta una lista de
  pagos con fecha, monto y si fue anticipo o liquidación.

**Borrar.** Una nota borrada desaparece sin rastro y el Corte cambia solo.
Mejor una etapa «Cancelada» con motivo, y una bitácora de quién cambió qué.

**Los precios están en el código.** Cambiar un precio o la fórmula de
lavandería es editar `script.js`. El dueño lo va a pedir. Hace falta una
pantalla de Ajustes con precios, costos de maquila, anticipo mínimo y los
días de «sin recoger».

**Una pantalla «Hoy».** El negocio vive por ciclo: lunes en la noche se aparta,
martes sale, jueves regresa, se embolsa y se avisa. Una pantalla de inicio
que diga qué toca hoy: «Mañana salen 4 notas», «Hay 6 embolsadas sin avisar».

**Avisar de una vez.** Hoy son 12 toques de «Avisarle» uno por uno. Una cola
que pase a la siguiente nota después de cada mensaje.

**El iPad.** Tres cosas que importan y no se han probado:

1. Una web app instalada en la pantalla de inicio y la misma página abierta en
   Safari **no comparten notas**. Cada una tiene su almacén. Hay que escoger
   una sola y decirle al personal.
2. Si la app no está instalada, Safari puede borrar los datos de un sitio que
   lleva 7 días sin abrirse. La app no pide almacenamiento persistente.
3. No hay `apple-touch-icon`. El icono es un SVG y iOS no lo usa. En la
   pantalla de inicio saldría una letra o una captura.

**Impresión.** El ticket mide 10 cm de ancho. Si la impresora es de tickets de
80 mm se corta. Hay que saber cuál es y probarla.

**Respaldo.** El archivo trae nombres, teléfonos y firmas sin cifrar. Y baja a
la propia tablet. Mejor mandarlo por la hoja de compartir del iPad (iCloud,
AirDrop, correo) en un toque.

### Diseño

1. **Barra fija abajo con total, saldo y «Guardar nota».** En iPad vertical
   la nota mide unos 1,750 px de alto, casi 1.5 pantallas, y crece con cada
   prenda. La firma queda abajo y el botón de guardar arriba. Se firma y hay
   que subir para guardar. En teléfono pasa más.
2. **Menú de pestañas abajo** en iPad vertical y teléfono, en vez de la
   hamburguesa. Son 4 destinos y se usan todo el día.
3. **Botones más grandes.** Los de las acciones del mostrador (Entregar,
   Avisarle, Ya está embolsada, el conteo de vuelta) miden 31 px. Apple pide
   44. Se arregla con una regla de CSS para pantallas táctiles.
4. **Cámara primero.** El campo para pegar la dirección de una imagen es el
   requisito de la Actividad 1, no algo que use el mostrador. Va debajo del
   botón de cámara y plegado, con los mismos identificadores.
5. **Menos texto.** Cada pantalla abre con un párrafo de 22 a 35 palabras que
   se lee una vez. Los textos de ayuda hablan como desarrollador: «Lo escribe
   él: el negocio ya trae su propia numeración». Mejor una línea o nada.
6. **Contraste.** El gris de apoyo da 4.41 y el azul de los botones 4.24. Un
   poco debajo del 4.5. Se corrige con dos variables.

### Código

1. **Partir `script.js` en módulos** por pantalla: almacén, notas, tablero,
   maquila, corte, documentos, respaldo. Sin herramientas nuevas: el navegador
   ya lee módulos. Hay que actualizar la lista del service worker.
2. **Un solo punto de escritura.** Un objeto `Notas` con `guardar`, `buscar` y
   `cambiarEtapa`. Hoy hay 14 sitios que escriben y 12 no revisan el resultado.
3. **Un ayudante para armar elementos.** Hay 104 `createElement` con el mismo
   molde. Una función de una línea lo recorta.
4. **Las pruebas dentro del repo.** Las 14 que se corrieron a mano viven fuera
   del proyecto. Quien lo reciba no las tiene. Se pasan a Playwright y corren
   solas en cada subida.
5. **Número de versión de los datos.** Ya hubo una migración (imágenes a
   IndexedDB) y se resolvió mirando si el texto empezaba con `data:`. La
   siguiente va a necesitar un número de esquema.
6. **Un archivo de configuración** para lo que hoy está regado: días de sin
   recoger (15), días de respaldo (7), anticipo, catálogo.
7. **Sacar los 3 `confirm()` del navegador** por un cuadro de la propia app.
   Se ven igual en todos los aparatos y se pueden probar.

### Qué quedó

| Propuesta | Estado |
|---|---|
| Fallas 1, 2, 3, 6 y 7 | Hecho |
| Falla 4 (hora de salida) | Hecho, con una suposición: jueves y sábado salen a las 7. Se cambia en Ajustes |
| Falla 5 y contraste | Hecho |
| Corte por periodo, utilidad en caja, lista de pagos | Hecho |
| Cancelar en lugar de borrar, historial | Hecho |
| Ajustes con precios, anticipo, días | Hecho |
| Pantalla Hoy, avisos en cola | Hecho |
| iPad: icono, almacenamiento persistente | Hecho |
| iPad: dos almacenes (app instalada y Safari) | Se avisa en pantalla y en el README. Falta decirle al personal |
| Impresión en 80 mm | Falta. Hay que saber qué impresora usan |
| Respaldo por la hoja de compartir | Falta |
| Diseño 1 a 4 y 6 | Hecho |
| Diseño 5, menos texto | Hecho en lo principal: ninguna pantalla abre con párrafo |
| Código 1 a 7 | Hecho. Hay 28 módulos en `js/`, más de 440 pruebas y CI |

Dos cosas de código que cambian cómo se lee el proyecto:

- La Actividad 1 (galería) pasó de `script.js` a `js/galeria.js`. El campo de
  la URL quedó plegado en `<details id="detallesUrl">`, con los mismos
  identificadores.
- Las notas llevan número de versión (`tintoreria.esquema`) y el respaldo es
  versión 3. Los respaldos viejos se siguen restaurando.

Lo que **no** se pudo probar: un iPad de verdad. Impresión, cámara,
almacenamiento de iOS y abrir WhatsApp desde la app instalada están sin
verificar.

### En qué orden

**Lote 1, arreglos de una tarde ✓.** Fallas 1, 2, 3, 6 y 7. Contraste. Botones
táctiles. Icono y etiquetas para iPad. Pedir almacenamiento persistente.

**Lote 2, lo que cambia el uso ✓.** Barra fija de guardar, pestañas abajo,
Corte por periodo con lista de pagos, cancelar en lugar de borrar, Ajustes con
precios, pantalla Hoy.

**Lote 3, el código ✓.** Módulos, un solo punto de escritura, pruebas en el repo.

Antes del lote 2 conviene probar en el iPad real y saber qué impresora usan.
