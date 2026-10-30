import { createMatcher, type MatchOptions } from './match.js';

/** Marca como ela fica no índice gerado em build. */
export interface IndexedBrand {
  slug: string;
  name: string;
  category: string;
  color: string;
  hasLogo: boolean;
  hasDarkLogo: boolean;
}

export interface BrandIndex {
  /** Base das URLs das logos, ex: https://cdn.jsdelivr.net/gh/<owner>/<repo>@v1.0.0/brands/ */
  cdnBase: string;
  brands: readonly IndexedBrand[];
  /** Pares [alias normalizado, posição da marca em `brands`]. */
  aliases: ReadonlyArray<readonly [string, number]>;
}

export interface Match {
  slug: string;
  name: string;
  /** SVG no jsDelivr, ou null quando a marca ainda não tem logo no dataset. */
  logoUrl: string | null;
  logoDarkUrl?: string;
  /** Cor principal da marca em hex. */
  color: string;
  category: string;
  /** 1 = exato, 0.9 = tokens, 0.8 = prefixo, 0.5–0.75 = fuzzy. */
  confidence: number;
}

export type ResolveOptions = MatchOptions;

export function createResolver(index: BrandIndex) {
  const match = createMatcher(index.aliases.map(([alias, brand]) => ({ alias, brand })));

  function resolve(descriptor: string, options: ResolveOptions = {}): Match | null {
    if (typeof descriptor !== 'string') return null;
    const result = match(descriptor, options);
    const brand = result && index.brands[result.brand];
    if (!result || !brand) return null;

    const base = `${index.cdnBase}${brand.slug}/`;
    return {
      slug: brand.slug,
      name: brand.name,
      logoUrl: brand.hasLogo ? `${base}logo.svg` : null,
      ...(brand.hasDarkLogo ? { logoDarkUrl: `${base}logo-dark.svg` } : {}),
      color: brand.color,
      category: brand.category,
      confidence: result.confidence,
    };
  }

  function resolveMany(descriptors: readonly string[], options: ResolveOptions = {}): (Match | null)[] {
    // Extratos repetem muito o mesmo descritor; resolve cada um só uma vez.
    const cache = new Map<string, Match | null>();
    return descriptors.map((d) => {
      if (!cache.has(d)) cache.set(d, resolve(d, options));
      return cache.get(d) ?? null;
    });
  }

  return { resolve, resolveMany };
}
