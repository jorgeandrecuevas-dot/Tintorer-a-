/* Dos funciones chicas que usan varias pantallas. */
export function pesos(n) {
  return '$' + Math.round(n).toLocaleString('es-MX');
}

export function sinAcentos(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Una cantidad que puede ser negativa: la utilidad en caja de un día malo
export function pesosConSigno(n) {
  return (n < 0 ? '−' : '') + pesos(Math.abs(n));
}
