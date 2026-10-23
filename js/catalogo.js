/* Las 56 piezas con su precio y su costo de maquila, y la fórmula de la lavandería. */
/* -------------------------------------------------------------------------
   2. CATÁLOGO DE PRECIOS
   ------------------------------------------------------------------------- */

export const CATEGORIAS = [
  { id: 'ropa',       nombre: 'Ropa' },
  { id: 'blancos',    nombre: 'Blancos' },
  { id: 'vestidos',   nombre: 'Vestidos' },
  { id: 'peluches',   nombre: 'Peluches' },
  { id: 'edredones',  nombre: 'Edredones' },
  { id: 'cobertores', nombre: 'Cobertores' },
  { id: 'mochilas',   nombre: 'Mochilas' },
  { id: 'tenis',      nombre: 'Tenis' }
];

export const CATALOGO = [
  // --- Ropa ---
  { cat: 'ropa', nombre: 'Abrigo corto',          costo: 60,  precio: 110 },
  { cat: 'ropa', nombre: 'Abrigo largo',          costo: 60,  precio: 130 },
  { cat: 'ropa', nombre: 'Gabardina',             costo: 60,  precio: 110 },
  { cat: 'ropa', nombre: 'Chaleco corto',         costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Chaleco largo',         costo: 60,  precio: 85 },
  { cat: 'ropa', nombre: 'Bufanda',               costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Camisa',                costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Pantalón',              costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Saco',                  costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Bermuda / short',       costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Traje 2 piezas',        costo: 80,  precio: 170 },
  { cat: 'ropa', nombre: 'Pants 2 piezas',        costo: 80,  precio: 170 },
  { cat: 'ropa', nombre: 'Suéter',                costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Suéter piel/gamuza',    costo: 160, precio: 195 },
  { cat: 'ropa', nombre: 'Suéter aplicaciones',   costo: 80,  precio: 140 },
  { cat: 'ropa', nombre: 'Suéter angora aplic.',  costo: 80,  precio: 170 },
  { cat: 'ropa', nombre: 'Falda',                 costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Blusa',                 costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Playera',               costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Playera tipo polo',     costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Corbata',               costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Pañuelo',               costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Gorra',                 costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Chamarra sencilla',     costo: 60,  precio: 95 },
  { cat: 'ropa', nombre: 'Chamarra borrega',      costo: 80,  precio: 140 },
  { cat: 'ropa', nombre: 'Chamarra piel',         costo: 160, precio: 220 },
  { cat: 'ropa', nombre: 'Bata filipina corta',   costo: 40,  precio: 75 },
  { cat: 'ropa', nombre: 'Bata filipina larga',   costo: 60,  precio: 80 },

  // --- Blancos ---
  { cat: 'blancos', nombre: 'Funda almohada',         costo: 40,  precio: 70 },
  { cat: 'blancos', nombre: 'Funda almohada grande',  costo: 60,  precio: 80 },
  { cat: 'blancos', nombre: 'Sábana 1 pieza',         costo: 100, precio: 100 },
  { cat: 'blancos', nombre: 'Toalla manos',           costo: 40,  precio: 70 },
  { cat: 'blancos', nombre: 'Toalla grande baño',     costo: 60,  precio: 90 },
  { cat: 'blancos', nombre: 'Toalla extra larga',     costo: 80,  precio: 95 },

  // --- Vestidos ---
  { cat: 'vestidos', nombre: 'Vestido novia sencillo', costo: 500, precio: 850 },
  { cat: 'vestidos', nombre: 'Novia c/aplicaciones',   costo: 700, precio: 1200 },
  { cat: 'vestidos', nombre: 'Novia alto vacío',       costo: 800, precio: 1200 },
  { cat: 'vestidos', nombre: 'Vestido sencillo',       costo: 70,  precio: 90 },
  { cat: 'vestidos', nombre: 'Vestido fiesta/cóctel',  costo: 90,  precio: 180 },
  { cat: 'vestidos', nombre: 'Vestido largo fiesta',   costo: 120, precio: 190 },

  // --- Peluches ---
  { cat: 'peluches', nombre: 'Peluche chico',   costo: 80,  precio: 85 },
  { cat: 'peluches', nombre: 'Peluche mediano', costo: 80,  precio: 110 },
  { cat: 'peluches', nombre: 'Peluche grande',  costo: 120, precio: 180 },
  { cat: 'peluches', nombre: 'Peluche gigante', costo: 200, precio: 450 },

  // --- Edredones ---
  { cat: 'edredones', nombre: 'Edredón individual',  costo: 80,  precio: 180 },
  { cat: 'edredones', nombre: 'Edredón matrimonial', costo: 80,  precio: 195 },
  { cat: 'edredones', nombre: 'Edredón queen',       costo: 120, precio: 230 },
  { cat: 'edredones', nombre: 'Edredón king',        costo: 140, precio: 260 },

  // --- Cobertores ---
  { cat: 'cobertores', nombre: 'Cobertor individual',  costo: 80,  precio: 180 },
  { cat: 'cobertores', nombre: 'Cobertor matrimonial', costo: 80,  precio: 195 },
  { cat: 'cobertores', nombre: 'Cobertor queen',       costo: 100, precio: 230 },
  { cat: 'cobertores', nombre: 'Cobertor king',        costo: 140, precio: 260 },

  // --- Mochilas ---
  { cat: 'mochilas', nombre: 'Mochila chica',   costo: 50, precio: 70 },
  { cat: 'mochilas', nombre: 'Mochila mediana', costo: 60, precio: 85 },
  { cat: 'mochilas', nombre: 'Mochila grande',  costo: 70, precio: 95 },

  // --- Tenis ---
  { cat: 'tenis', nombre: 'Tenis (par)', costo: 70, precio: 130 }
];

/* La lavandería no se guarda como tabla: es una fórmula.
   La saqué de los 30 renglones de la hoja del dueño y no tiene excepciones. */
export function lavanderia(kg) {
  return {
    precio: 45 * kg,
    costo:  kg <= 1 ? 32 : 32 + 16 * kg
  };
}
