/* Arma elementos sin escribir HTML a mano. El texto va con textContent, así
   que lo que escribe la gente nunca se interpreta como HTML.

     el('div', { class: 'card', texto: 'Hola' }, hijo1, hijo2)

   Atributos con nombre propio: class, texto, on (un objeto de eventos). Los
   demás se ponen tal cual con setAttribute. */
export function el(etiqueta, atributos, ...hijos) {
  const nodo = document.createElement(etiqueta);
  Object.entries(atributos || {}).forEach(function ([nombre, valor]) {
    if (valor === null || valor === undefined || valor === false) return;
    if (nombre === 'class') nodo.className = valor;
    else if (nombre === 'texto') nodo.textContent = valor;
    else if (nombre === 'on') Object.entries(valor).forEach(function ([evento, fn]) { nodo.addEventListener(evento, fn); });
    else nodo.setAttribute(nombre, valor === true ? '' : valor);
  });
  hijos.flat().forEach(function (h) {
    if (h === null || h === undefined || h === false) return;
    nodo.appendChild(typeof h === 'string' ? document.createTextNode(h) : h);
  });
  return nodo;
}
