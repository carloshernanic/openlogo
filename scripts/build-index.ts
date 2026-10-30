// Gera src/generated/index.ts a partir de brands/. Roda antes de build, testes e typecheck.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadAllBrands, type BrandEntry } from './lib/brands.ts';
import { normalizeAlias } from '../src/normalize.ts';
import type { IndexedBrand } from '../src/resolver.ts';

interface PackageJson {
  version: string;
  repository: { url: string };
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as PackageJson;

/** "git+https://github.com/dono/repo.git" → "dono/repo" */
function githubRepo(url: string): string {
  const found = /github\.com[/:]([^/]+\/[^/.]+)/.exec(url);
  if (!found?.[1]) throw new Error(`repository.url não aponta para o GitHub: ${url}`);
  return found[1];
}

function buildIndex(entries: BrandEntry[]) {
  const brands: IndexedBrand[] = entries.map(({ data, hasLogo, hasDarkLogo }) => ({
    slug: data.slug,
    name: data.name,
    category: data.category,
    color: data.colors[0] ?? '#000000',
    hasLogo: data.logoStatus !== 'missing' && hasLogo,
    hasDarkLogo: data.logoStatus !== 'missing' && hasDarkLogo,
  }));

  const aliases: Array<[string, number]> = [];
  entries.forEach(({ data }, brand) => {
    const keys = new Set([data.slug.replace(/-/g, ' '), data.name, ...data.aliases].map(normalizeAlias));
    for (const key of keys) if (key) aliases.push([key, brand]);
  });
  return { brands, aliases };
}

const { brands, aliases } = buildIndex(loadAllBrands());
const cdnBase = `https://cdn.jsdelivr.net/gh/${githubRepo(pkg.repository.url)}@v${pkg.version}/brands/`;

const source = `// Gerado por scripts/build-index.ts a partir de brands/. Não edite à mão.
import type { IndexedBrand } from '../resolver.js';

export const VERSION = ${JSON.stringify(pkg.version)};

export const CDN_BASE = ${JSON.stringify(cdnBase)};

export const BRANDS: readonly IndexedBrand[] = ${JSON.stringify(brands, null, 2)};

export const ALIASES: ReadonlyArray<readonly [string, number]> = ${JSON.stringify(aliases)};
`;

const outDir = join(ROOT, 'src', 'generated');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.ts'), source);
console.log(`✔ índice gerado: ${brands.length} marcas, ${aliases.length} aliases`);
