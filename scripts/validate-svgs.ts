// Valida os SVGs de brands/: só arquivos esperados, sem conteúdo ativo ou externo,
// e já otimizados pelo svgo.
//
//   npm run validate:svgs          confere
//   npm run validate:svgs -- --fix otimiza os arquivos no lugar
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { optimize, type Config } from 'svgo';
import svgoConfig from '../svgo.config.mjs';
import { BRANDS_DIR, listBrandFolders } from './lib/brands.ts';

const ALLOWED_FILES = new Set(['brand.json', 'logo.svg', 'logo-dark.svg']);
const MAX_BYTES = 32 * 1024;

// Cada regra é um motivo de rejeição. SVG é XML executável: script, handlers,
// referências externas e raster embutido não têm lugar numa logo.
const FORBIDDEN: Array<[RegExp, string]> = [
  [/<script\b/i, 'contém <script>'],
  [/\son[a-z]+\s*=/i, 'contém atributo de evento (onload, onclick…)'],
  [/<foreignObject\b/i, 'contém <foreignObject>'],
  [/<image\b/i, 'contém <image> (raster embutido ou externo)'],
  [/data:/i, 'contém data: URI'],
  [/\bhref\s*=\s*["'](?!#)/i, 'contém link externo (href que não começa com #)'],
  [/url\(\s*["']?(?!#)/i, 'contém url() externa'],
  [/@import/i, 'contém @import'],
  [/<!(DOCTYPE|ENTITY)/i, 'contém DOCTYPE/ENTITY'],
];

const fix = process.argv.includes('--fix');
const errors: string[] = [];
let checked = 0;

for (const folder of listBrandFolders()) {
  const dir = join(BRANDS_DIR, folder);
  for (const file of readdirSync(dir)) {
    const where = `brands/${folder}/${file}`;
    if (!ALLOWED_FILES.has(file)) {
      errors.push(`${where}: arquivo não permitido (use só brand.json, logo.svg e logo-dark.svg)`);
      continue;
    }
    if (!file.endsWith('.svg')) continue;
    checked++;

    const path = join(dir, file);
    if (statSync(path).size > MAX_BYTES) errors.push(`${where}: maior que ${MAX_BYTES / 1024} KB`);

    const svg = readFileSync(path, 'utf8');
    if (!/^<svg\b/.test(svg.trim())) errors.push(`${where}: não começa com <svg`);
    if (!/\bviewBox=/.test(svg)) errors.push(`${where}: falta viewBox`);
    for (const [pattern, reason] of FORBIDDEN) if (pattern.test(svg)) errors.push(`${where}: ${reason}`);

    let optimized: string;
    try {
      optimized = `${optimize(svg, { ...(svgoConfig as Config), path }).data}\n`;
    } catch (e) {
      errors.push(`${where}: SVG inválido (${(e as Error).message.split('\n')[0]})`);
      continue;
    }
    if (optimized !== svg) {
      if (fix) writeFileSync(path, optimized);
      else errors.push(`${where}: não está otimizado (rode npm run validate:svgs -- --fix)`);
    }
  }
}

if (errors.length > 0) {
  console.error(`✖ ${errors.length} problema(s) nos SVGs:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✔ ${checked} SVG(s) válidos${fix ? ' (otimizados)' : ''}`);
