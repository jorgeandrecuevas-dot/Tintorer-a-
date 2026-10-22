# Cómo funciona la tintorería

Apuntes levantados con el negocio el 22 de octubre de 2026. Están tal cual se
tomaron. Son la fuente de verdad del proyecto: si algo en el código contradice
esta lista, manda la lista.

## Lo que dijo el negocio

1. Lavandería en kg o tintorería en seco y por pieza.
2. Rastrean la ropa etiquetada con el número del pedido para que no se pierda la ropa en la maquila.
3. En el proceso de enviárselo a la maquila ellos hacen una nota para el total de prendas enviadas y a recibir.
4. Al momento se hacen las cuentas de cuánto se llevan y cuánto se debe de pagar. Antes de llevarse la ropa ya se va pagada la maquila.
5. Es más importante la cantidad que qué tipo de ropa fue.
6. Una tablet por sucursal.
7. Registro para el cliente, para la maquila y para costos. Manejan los tres lenguajes.
8. Control financiero del negocio.
9. Si manejan anticipo, manejan también pago total.
10. Manejan estatus del pedido, en base a la maquila y al cliente.
11. Checklist de notas de tintorería entregadas o pendientes de entregar.
12. Los martes se entrega a la maquila y el jueves en la mañana recibe la ropa. El jueves en la tarde entrega, para tener tiempo de embolsar. El jueves también recogen y se la dan el sábado. Si entregan ropa el sábado, se la regresan el martes en la mañana.
13. Los tiempos de entrega de cobertores son mayores porque tardan más.
14. A veces vienen ellos a recoger la ropa, pero casi siempre van ellos. El martes a las 7 am. A veces van a la casa del señor a entregarle la ropa, dependiendo de cómo se organicen o cuánta ropa haya.
15. El lunes en la noche él checa qué ropa tiene que llevar el martes y la deja lista.
16. Quieren imprimir lo que capturen, y documentos para firmar de entrega y recibo a la maquila junto con lo que le pagan en el momento.
17. Tres PDF: el de la maquila, el ticket del cliente y el conteo final financiero.
18. El número de nota debe de ponerlo él, ya que ya llevan un rato con su registro.
19. Le da a firmar la nota al cliente para firmar de recibido.
20. Crear un ticket digital que tenga un sistema para firmar una sola vez, de recibido y de entregado, sin internet.
21. Agregar foto de la ropa al ticket en digital.
22. Debe de haber un apartado donde ponga observaciones de que le falta un botón o viene rota la ropa.
23. Se requiere mínimo el 50% de anticipo, ya que a veces hay merma del anticipo.

## Lo que cambia en la aplicación

Esta parte es lectura de los apuntes, no es lo que dijo el negocio.

### Lo que estaba mal

| Lo que se había construido | Lo que dicen los apuntes |
|---|---|
| Folio automático, `0482` fijo | El número de nota lo escribe él (18) |
| Captura centrada en escoger prenda del catálogo | La cantidad importa más que el tipo (5) |
| Pantalla "Ruta del día" con recolecciones a domicilio del cliente | No hay entrega a domicilio. Confirmado con el negocio el 22 de octubre. El viaje del martes es a la maquila (12, 14) |
| Nota sin cobro | Mínimo 50% de anticipo, o pago total (9, 23) |
| Nota sin observaciones | Hace falta apartado para botón faltante o ropa rota (22) |
| Nada de firmas | Firma de recibido y de entregado, sin internet (19, 20) |
| Bootstrap desde el CDN | "Sin internet" (20) obliga a traer Bootstrap dentro del proyecto |

### La idea más importante

El punto 7 es el que reordena todo: **un pedido, tres documentos.**

| Documento | Para quién | Qué le importa |
|---|---|---|
| Ticket | Cliente | Qué dejó, cuánto debe, cuánto dio de anticipo, su firma |
| Nota de maquila | Maquila | Cuántas prendas van, cuántas regresan, cuánto se le paga |
| Conteo | El dueño | Cobrado contra pagado a maquila, qué quedó |

El punto 17 lo confirma: tres PDF. Son el mismo pedido contado de tres maneras.

### El ciclo de la semana

Del punto 12, 13 y 15:

```
lunes noche   él aparta la ropa que sale mañana
martes 7 am   sale a la maquila, se paga en el momento
jueves am     regresa la ropa
jueves pm     se embolsa y se entrega
jueves        sale otra tanda, regresa el sábado
sábado        sale otra tanda, regresa el martes
```

Los cobertores tardan más, así que su fecha de entrega salta un ciclo.

## Lo ya confirmado

**No hay entrega a domicilio al cliente.** El cliente deja y recoge su ropa en
el mostrador. Lo único que sale del local es el viaje a la maquila. Por eso la
aplicación no tiene pantalla de ruta.

## Lo que se confirmó el 22 de octubre

- **Merma del anticipo (23).** Es cuando dejan el anticipo y no regresan por
  la ropa. Al negocio le costó mandarla a la maquila y solo recibió el
  anticipo, así que no tiene ganancia.
- **La sábana de una pieza.** Debe cobrarse en $100, no en $70. Se corrigió en la
  aplicación. La maquila cobra $100 por lavarla, así que en esa pieza no hay
  ganancia.
- **Sucursales.** Hoy es una. Quieren abrir otra y se avisará cuando abran.
- **Punto 14.** Casi siempre el negocio lleva la ropa a la maquila el martes a
  las 7 am. A veces la maquila pasa por ella. A veces los de la maquila llevan
  la ropa ya lavada a casa del dueño de la tintorería, según cómo se organicen y cuánta ropa
  haya. Esa ropa no llega al local.

## Lo que falta preguntar

1. ¿Quién paga la prenda que la maquila pierde o maltrata? Se va a preguntar.
2. Punto 14. Cuando la maquila deja la ropa en casa del dueño, ¿ahí se
   cuenta y se embolsa, y de ahí pasa al local? Si importa saber dónde está
   la ropa, hay que agregar ese dato a la nota.
3. ¿Cuántos días de embolsada se dan antes de darla por no recogida? La
   aplicación usa 15.
4. ¿Les parece cobrar un anticipo que cubra la maquila, o un cargo por
   almacenaje? Detalle en `MEJORAS.md`.
