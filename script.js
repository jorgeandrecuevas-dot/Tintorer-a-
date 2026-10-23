/* =========================================================================
   Tintorería · Sistema de notas

   Lo que hace la aplicación sale de los apuntes que se levantaron con el
   negocio el 22 de octubre. Están en APUNTES.md, y mandan: si algo de aquí
   los contradice, lo que está mal es esto.

   Los precios son los de la lista que entregó el dueño. El "costo" es lo
   que la maquila cobra por lavar esa pieza.
   ========================================================================= */

/* Esta es la entrada. Cada módulo de js/ se ocupa de una pantalla o de una
   pieza, y arma sus propios botones al cargarse. Aquí solo se juntan.

   La galería de la Actividad 1 está en js/galeria.js. */

import './js/config.js';
import './js/navegacion.js';
import './js/ajustes.js';
import './js/notas.js';
import './js/confirmar.js';
import './js/galeria.js';
import './js/firmas.js';
import './js/captura.js';
import './js/tablero.js';
import './js/modalNota.js';
import './js/entrega.js';
import './js/maquila.js';
import './js/corte.js';
import './js/documentos.js';
import './js/respaldo.js';
import './js/sinred.js';
import './js/cola.js';
import './js/hoy.js';

// Arranca en Hoy, con lo que toca
import { irA } from './js/navegacion.js';
irA('hoy');
