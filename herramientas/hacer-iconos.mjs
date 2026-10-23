// Saca los iconos PNG a partir de icono-cuadrado.svg.
// El iPad no usa iconos SVG ni esquinas transparentes, así que hacen falta PNG
// cuadrados. Se corre con: node herramientas/hacer-iconos.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('icono-cuadrado.svg', 'utf8');
const tamanos = { 'icono-180.png': 180, 'icono-192.png': 192, 'icono-512.png': 512 };

const navegador = await chromium.launch();
for (const [archivo, lado] of Object.entries(tamanos)) {
  const pagina = await navegador.newPage({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 });
  await pagina.setContent(`<style>html,body{margin:0;background:#212529}svg{display:block;width:${lado}px;height:${lado}px}</style>${svg}`);
  writeFileSync(archivo, await pagina.screenshot({ type: 'png', clip: { x: 0, y: 0, width: lado, height: lado } }));
  await pagina.close();
  console.log('->', archivo);
}
await navegador.close();
