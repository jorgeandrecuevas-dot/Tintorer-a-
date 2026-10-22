# Sistema de notas — tintorería y lavandería

Aplicación para una tintorería que manda la ropa a una maquila y la devuelve
etiquetada por número de nota. Hoy el negocio trabaja con libreta de papel.

**Ver la aplicación funcionando:** https://jorgeandrecuevas-dot.github.io/Tintorer-a-/

Lo que hace sale de los apuntes que se levantaron con el negocio el 22 de
octubre. Están en [APUNTES.md](APUNTES.md) y mandan sobre el código.

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
- **Fotos** de la prenda, que es donde vive la galería de la Actividad 1.
- **Firma del cliente** en la pantalla. No usa red ni biblioteca, así que
  funciona sin internet, y aguanta que giren la tablet.
- **Cobro** con anticipo del 50% o pago total, y el saldo a la vista.
- La **fecha de entrega se calcula sola** con el ciclo de la maquila.

### 2. Tablero

![Tablero](capturas/tablero.png)

Cinco etapas: recibida, en maquila, de vuelta, embolsada y entregada. Las
notas con saldo traen su marca, y las observaciones se ven desde aquí.

### 3. Maquila

![Maquila](capturas/maquila.png)

Lo que sale, cuántas prendas son y cuánto se le paga en el momento. De un
lado lo que está listo para salir, del otro lo que ya está allá. El botón
imprime la nota que se firma de entrega y recibo.

### 4. Corte

![Corte](capturas/corte.png)

Facturado, cobrado, por cobrar, lo pagado a la maquila y la utilidad. Sale
de las notas capturadas, no de juntar tickets.

## El ciclo de la semana

La ropa sale los martes, jueves y sábados, y vuelve en la salida siguiente:

| Sale | Vuelve |
|---|---|
| martes | jueves |
| jueves | sábado |
| sábado | martes |

Los cobertores y edredones tardan más, así que saltan un ciclo. La fecha de
entrega de cada nota se calcula con esta regla.

## Los tres documentos

El mismo pedido contado de tres maneras, que es como lo pidió el negocio:

| Documento | Para quién | Qué lleva |
|---|---|---|
| Ticket | Cliente | Qué dejó, total, anticipo, saldo y su firma |
| Nota de maquila | Maquila | Cuántas prendas van, cuánto se le paga |
| Conteo | El dueño | Cobrado contra pagado, y lo que quedó |

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
| `index.html` | Las cuatro pantallas y el menú |
| `styles.css` | El menú lateral, las miniaturas, la firma y la hoja que se imprime |
| `script.js` | Navegación, ciclo de la maquila, catálogo, cobro, firma y los tres documentos |
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
| `document.createElement()` | `script.js` → crea la columna y la imagen |
| `appendChild()` | `script.js` → mete la imagen en la columna y la columna en la galería |

Los tres identificadores son únicos.

## Cómo probarlo

Entra a la liga de arriba, o abre `index.html` con doble clic. Hoy necesita
internet porque Bootstrap se carga de su CDN, y eso está por cambiar.

Las notas se guardan en el navegador, así que siguen ahí al recargar. Para
empezar de cero: herramientas de desarrollador, Application, Local Storage,
borrar `tintoreria.notas`.

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

1. **Traer Bootstrap dentro del proyecto.** El punto 20 de los apuntes pide
   firmar sin internet, y hoy la página no abre sin red.
2. **Sincronizar entre sucursales.** Cada tablet guarda lo suyo. El punto 6
   pide una tablet por sucursal.
3. **Firma de entregado.** Hoy solo se firma de recibido; faltan las dos
   firmas del punto 20.
4. **Cámara en lugar de dirección de imagen**
   (`<input type="file" accept="image/*" capture>`).
5. **Conteo de lo que regresa de la maquila** contra lo que se mandó.
6. **Etiquetas imprimibles** con el número de nota, para pegarlas a la ropa.
