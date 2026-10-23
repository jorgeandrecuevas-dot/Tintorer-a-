// Lo que se midió en la revisión del 23 de octubre: el contraste del texto y
// el tamaño de lo que se toca con el dedo. Se vuelve a medir en cada subida.
import { test, expect, abrirLimpia, irA, cargarEjemplos } from './ayuda.js';

const MEDIR = () => {
  const visible = (e) => {
    const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
      && !e.closest('.d-none, .offcanvas:not(.show), .modal:not(.show), .toast:not(.show)');
  };
  const rgb = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const fondoDe = (e) => { for (let x = e; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c && c.a > 0.9) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const razon = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };

  const vista = document.querySelector('.vista:not(.d-none)');
  const contraste = [];
  vista.querySelectorAll('*').forEach((e) => {
    if (!visible(e)) return;
    if (!([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1))) return;
    if (e.closest('.btn:disabled, [disabled]')) return;
    const s = getComputedStyle(e), fg = rgb(s.color), bg = fondoDe(e);
    if (!fg) return;
    const mezcla = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
    const px = parseFloat(s.fontSize), grande = px >= 24 || (px >= 18.66 && parseInt(s.fontWeight) >= 700);
    const r = razon(mezcla, bg);
    if (r < (grande ? 3 : 4.5)) contraste.push(r.toFixed(2) + ' «' + e.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) + '»');
  });

  // lo que se toca. Las casillas de radio de Bootstrap se esconden y se toca su etiqueta
  const chicos = [...vista.querySelectorAll('button, a[href], input:not([type=hidden]):not([type=file]):not(.btn-check), select, textarea, [role=button]')]
    .filter(visible)
    .filter((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height) < 43.5)
    .filter((e) => !e.closest('.area-casilla'))
    .map((e) => (e.getAttribute('aria-label') || e.textContent || e.id || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 36) + ' (' + Math.round(e.getBoundingClientRect().height) + 'px)');
  return { contraste, chicos };
};

for (const vista of ['nota', 'tablero', 'maquila', 'corte']) {
  test(`${vista}: el texto se lee y lo que se toca mide 44 px o más`, async ({ page }) => {
    await abrirLimpia(page);
    await cargarEjemplos(page);
    await irA(page, vista);
    if (vista === 'tablero') await page.click('#modoLista');
    // sin animaciones ni el puntero encima de nada: si no, se mide a medio cambiar de color
    await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(150);
    const { contraste, chicos } = await page.evaluate(MEDIR);
    expect(contraste, 'texto con poco contraste').toEqual([]);
    const ancho = page.viewportSize().width;
    if (ancho < 1200) expect(chicos, 'botones menores de 44 px').toEqual([]);
  });
}
