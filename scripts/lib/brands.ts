import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..', '..');
export const BRANDS_DIR = join(ROOT, 'brands');

export interface BrandJson {
  name: string;
  slug: string;
  website: string;
  category: string;
  colors: string[];
  aliases: string[];
  strictAliases?: string[];
  cnpjRoots?: string[];
  logoStatus?: 'ok' | 'missing';
  logoSource?: string;
}

export interface BrandEntry {
  dir: string;
  folder: string;
  data: BrandJson;
  hasLogo: boolean;
  hasDarkLogo: boolean;
}

export function listBrandFolders(): string[] {
  if (!existsSync(BRANDS_DIR)) return [];
  return readdirSync(BRANDS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/** Lê brands/<pasta>/brand.json sem validar; a validação fica com o schema. */
export function loadBrand(folder: string): BrandEntry {
  const dir = join(BRANDS_DIR, folder);
  const data = JSON.parse(readFileSync(join(dir, 'brand.json'), 'utf8')) as BrandJson;
  return {
    dir,
    folder,
    data,
    hasLogo: existsSync(join(dir, 'logo.svg')),
    hasDarkLogo: existsSync(join(dir, 'logo-dark.svg')),
  };
}

export function loadAllBrands(): BrandEntry[] {
  return listBrandFolders().map(loadBrand);
}
