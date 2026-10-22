# Sistema de notas — tintorería y lavandería

Aplicación para una tintorería que manda la ropa a una maquila y la devuelve
etiquetada por número de nota. Hoy el negocio trabaja con libreta de papel.

**Ver la aplicación funcionando:** https://jorgeandrecuevas-dot.github.io/Tintorer-a-/

Lo que hace sale de los apuntes que se levantaron con el negocio el 22 de
octubre. Están en [APUNTES.md](APUNTES.md) y mandan sobre el código.

## Funciona sin internet

Es lo que pide el punto 20 de los apuntes. Bootstrap vive dentro del
proyecto y un service worker guarda la aplicación en la tablet, así que
abre en frío aunque no haya señal desde que se prende. Las notas se guardan
en el aparato.

Para comprobarlo: abre la página una vez, apaga el wifi y vuelve a entrar.
El menú lateral avisa cuándo está guardada y cuándo estás sin señal.

## Las cuatro pantallas

Se navega con el menú. En computadora es una barra lateral fija; abajo de
992 píxeles se vuelve un cajón que abre el botón de hamburguesa.

### 1. Nota nueva

![Nota nueva](capturas/nota.png)

- **El número de nota se escribe a mano.** El negocio ya trae su numeración.
- La cantidad va primero y en grande, con botones de más y menos para
  capturar de pie. Para la maquila pesa más cuántas prendas van que de qué
  tipo son.
- **Observaciones** de cómo llegó la prenda: botón que falta, rotura. Es lo
  que se reclama después.
- **Foto con la cámara**, que es como se toma en el mostrador. La foto se
  achica a 1000 píxeles antes de guardarla, porque una foto de tablet pesa
  varios megas y el almacén del navegador no aguanta ni tres notas así. El
  campo para pegar una dirección sigue ahí: es el requisito de la Actividad 1.
- **Firma del cliente** en la pantalla. No usa red ni biblioteca, y aguanta
  que giren la tablet.
- **Cobro** con anticipo del 50% o pago total, y el saldo a la vista.
- La **fecha de entrega se calcula sola** con el ciclo de la maquila.

### 2. Tablero

![Tablero](capturas/tablero.png)

Cinco etapas: recibida, en maquila, de vuelta, embolsada y entregada. Las
notas con saldo traen su marca, las observaciones se ven desde aquí, y lo
que no regresó completo de la maquila sale marcado en rojo.

### 3. Maquila

![Maquila](capturas/maquila.png)

Lo que sale, cuántas prendas son y cuánto se le paga en el momento.

Al recibir de vuelta, cada nota trae una casilla con lo que salió para
contar lo que regresó. Si no cuadra, la nota queda marcada. Eso es el
control del punto 2: que no se pierda ropa en la maquila.

### 4. Corte

![Corte](capturas/corte.png)

Facturado, cobrado, por cobrar, lo pagado a la maquila y la utilidad. Sale
de las notas capturadas, no de juntar tickets.

## Las dos firmas

![Entregar la ropa](capturas/entrega.png)

El punto 20 pide firmar de recibido y de entregado. La primera se levanta al
capturar la nota. La segunda, cuando el cliente viene por su ropa: desde el
tablero se cobra el saldo y firma. Sin firma no deja entregar.

## El ciclo de la semana

La ropa sale los martes, jueves y sábados, y vuelve en la salida siguiente:

| Sale | Vuelve |
|---|---|
| martes | jueves |
| jueves | sábado |
| sábado | martes |

Los cobertores y edredones tardan más, así que saltan un ciclo. La fecha de
entrega de cada nota se calcula con esta regla.

## Los cuatro documentos

El mismo pedido contado de varias maneras, que es como lo pidió el negocio:

| Documento | Para quién | Qué lleva |
|---|---|---|
| Ticket | Cliente | Qué dejó, total, anticipo, saldo y su firma |
| Nota de maquila | Maquila | Cuántas prendas van, cuánto se le paga |
| Etiquetas | La ropa | Una por prenda, con el número de nota |
| Conteo | El dueño | Cobrado contra pagado, y lo que quedó |

![Etiquetas](capturas/etiquetas.png)

## Cómo se adapta a cada dispositivo

| Nota nueva en teléfono | Maquila en teléfono |
|---|---|
| <img src="capturas/nota-telefono.png" width="260"> | <img src="capturas/maquila-telefono.png" width="260"> |

La galería de fotos pasa de 2 columnas en teléfono a 3 en tableta y 4 en
computadora. Lo hacen tres clases de Bootstrap,
`row-cols-2 row-cols-md-3 row-cols-lg-4`, sin una sola regla de CSS propia.

## Archivos

| Archivo | Qué tiene |
|---|---|
| `index.html` | Las cuatro pantallas, el cuadro de entrega y el menú |
| `styles.css` | El menú lateral, las miniaturas, las firmas y las hojas que se imprimen |
| `script.js` | Navegación, ciclo de la maquila, catálogo, cobro, firmas, conteo y documentos |
| `sw.js` | Guarda la aplicación en la tablet para que abra sin señal |
| `manifest.webmanifest` | Para instalarla como aplicación en la tablet |
| `vendor/` | Bootstrap, dentro del proyecto y no desde internet |
| `APUNTES.md` | Cómo funciona el negocio, en sus palabras |

## Dónde está cada requisito de la Actividad 1

Todo en la sección «1. GALERÍA DE FOTOGRAFÍAS» de `script.js`.

| Requisito | Dónde |
|---|---|
| Campo de texto para la URL | `index.html` → `id="urlFoto"`, clase `form-control` |
| Botón para agregar | `index.html` → `id="btnAgregar"`, clases `btn btn-primary` |
| Contenedor de la galería | `index.html` → `id="galeria"` |
| Rejilla responsiva | `row-cols-2 row-cols-md-3 row-cols-lg-4` |
| `addEventListener` | `script.js` → en el clic de `btnAgregar` |
| `document.createElement()` | `script.js` → en `agregarFoto`, crea la columna y la imagen |
| `appendChild()` | `script.js` → mete la imagen en la columna y la columna en la galería |

Los tres identificadores son únicos.

## Cómo probarlo

Entra a la liga de arriba. También abre con doble clic en `index.html`, pero
así no queda guardada en el aparato: el service worker necesita que la página
venga de un servidor.

Las notas se guardan en el navegador y siguen ahí al recargar. Para empezar
de cero: herramientas de desarrollador, Application, Local Storage, borrar
`tintoreria.notas`.

## Sobre los precios

El catálogo son las 56 piezas de la lista que entregó el dueño. El costo de
cada pieza es lo que la maquila cobra por lavarla.

La lavandería no está como tabla sino como fórmula: los 30 renglones de la
hoja responden a `precio = 45 × kilos` sin excepción. El costo sí tiene una:
un kilo cuesta $32 en lugar de $48.

El botón **Ver margen** arranca oculto porque el cliente está viendo la
pantalla cuando se levanta la nota.

La sábana de una pieza se cobra en $70 y la maquila cobra $100 por lavarla.
Es la única de las 56 que se vende por debajo de lo que cuesta, y está
pendiente de confirmar con el dueño.

## Pendientes

### 1. Las fotos llenan la tablet a la quinta nota

Esto hay que arreglarlo antes de ponerla a trabajar. Está medido en Chrome:

| | |
|---|---|
| Una foto, ya achicada a 1000 px y en JPEG al 0.7 | 252 KB |
| Una firma | 23 KB |
| Una nota con cuatro fotos y su firma | 1,032 KB |
| Notas que caben antes de tronar | **4** |
| Notas que caben si no se guardaran fotos | 19,201 |

El almacén del navegador son unos 5 MB y no se puede subir. La salida es
guardar las fotos en IndexedDB, que sí crece con el disco, y dejar en el
almacén chico nada más los datos de la nota.

### 2. Respaldo

Todo vive en una sola tablet. Si se pierde, se moja o alguien le borra los
datos del navegador, se va la libreta completa del negocio. Hace falta por lo
menos poder descargar todo a un archivo, y de ahí para arriba un servidor.

### 3. Buscar y corregir notas

El tablero sirve para ver el día. Con 90 notas al mes ya no, y hoy no hay
forma de buscar por número ni por cliente, ni de corregir una nota mal
capturada: solo se avanza de etapa.

### 4. Sincronizar entre sucursales

El punto 6 pide una tablet por sucursal y hoy no se hablan. No urge mientras
usen una sola, pero el corte del punto 8 no va a cuadrar cuando sean dos.

### 5. Confirmar con el dueño

Las cuatro preguntas del final de `APUNTES.md`.
