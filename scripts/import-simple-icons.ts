// Copia a logo de uma marca do pacote simple-icons para brands/<slug>/.
//
//   npm run import:icon -- <slug-da-marca> <slug-no-simple-icons>
//
// O brand.json precisa existir antes. Confira o título e a fonte impressos no final:
// o mesmo slug pode ser outra empresa (no simple-icons, "vivo" é a fabricante de celulares).
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BRANDS_DIR, ROOT, type BrandJson } from './lib/brands.ts';

interface SimpleIcon {
  title: string;
  slug?: string;
  hex: string;
  source: string;
}

const SI_DIR = join(ROOT, 'node_modules', 'simple-icons');

function titleToSlug(title: string): string {
  // Mesma regra do simple-icons, para ícones sem slug explícito.
  return title
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/^\./, 'dot-')
    .replace(/\.$/, '-dot')
    .replace(/\./g, '-dot-')
    .replace(/^&/, 'and-')
    .replace(/&$/, '-and')
    .replace(/&/g, '-and-')
    .normalize('NFD')
    .replace(/[^a-z0-9]/g, '');
}

/** Luminância relativa (WCAG) de uma cor hex sem #. */
function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const withFill = (svg: string, hex: string) => svg.replace('<svg ', `<svg fill="#${hex}" `);

const [brandSlug, iconSlug] = process.argv.slice(2);
if (!brandSlug || !iconSlug) {
  console.error('uso: npm run import:icon -- <slug-da-marca> <slug-no-simple-icons>');
  process.exit(1);
}

const brandDir = join(BRANDS_DIR, brandSlug);
const brandFile = join(brandDir, 'brand.json');
if (!existsSync(brandFile)) {
  console.error(`✖ ${brandFile} não existe. Crie o brand.json antes de importar a logo.`);
  process.exit(1);
}

const siPkg = JSON.parse(readFileSync(join(SI_DIR, 'package.json'), 'utf8')) as { version: string };
const siData = JSON.parse(readFileSync(join(SI_DIR, 'data', 'simple-icons.json'), 'utf8')) as
  | SimpleIcon[]
  | { icons: SimpleIcon[] };
const icons = Array.isArray(siData) ? siData : siData.icons;
const icon = icons.find((i) => (i.slug ?? titleToSlug(i.title)) === iconSlug);
if (!icon) {
  console.error(`✖ "${iconSlug}" não existe no simple-icons@${siPkg.version}`);
  process.exit(1);
}

const svg = readFileSync(join(SI_DIR, 'icons', `${iconSlug}.svg`), 'utf8').trim();
writeFileSync(join(brandDir, 'logo.svg'), `${withFill(svg, icon.hex)}\n`);

// Cor muito escura some em fundo escuro: gera uma versão branca do mesmo desenho.
const darkFile = join(brandDir, 'logo-dark.svg');
const needsDark = luminance(icon.hex) < 0.05;
if (needsDark) writeFileSync(darkFile, `${withFill(svg, 'FFFFFF')}\n`);
else rmSync(darkFile, { force: true });

const brand = JSON.parse(readFileSync(brandFile, 'utf8')) as BrandJson & { $schema?: string };
const { logoStatus: _removed, logoSource: _old, ...rest } = brand;
const updated = { ...rest, logoSource: `simple-icons@${siPkg.version} (${iconSlug}): ${icon.source}` };
writeFileSync(brandFile, `${JSON.stringify(updated, null, 2)}\n`);

console.log(`✔ ${brandSlug}: "${icon.title}" #${icon.hex}${needsDark ? ' + logo-dark.svg' : ''}`);
console.log(`  fonte: ${icon.source}`);
