/* Dos funciones chicas que usan varias pantallas. */
export function pesos(n) {
  return '$' + Math.round(n).toLocaleString('es-MX');
}

export function sinAcentos(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
