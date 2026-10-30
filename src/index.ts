import { createResolver } from './resolver.js';
import { ALIASES, BRANDS, CDN_BASE, VERSION } from './generated/index.js';

const resolver = createResolver({ cdnBase: CDN_BASE, brands: BRANDS, aliases: ALIASES });

/**
 * Identifica a marca de um descritor de extrato.
 * Devolve null quando nenhuma etapa tem segurança suficiente: nunca chuta.
 *
 * @example
 * resolve('PAG*MCDONALDS 4521 SAO PAULO')
 * // { slug: 'mcdonalds', name: "McDonald's", logoUrl: 'https://cdn.jsdelivr.net/...', confidence: 1, ... }
 */
export const resolve = resolver.resolve;

/** `resolve` para uma lista; descritores repetidos são resolvidos uma vez só. */
export const resolveMany = resolver.resolveMany;

export { normalize } from './normalize.js';
export { DEFAULT_FUZZY_THRESHOLD } from './match.js';
export type { Match, ResolveOptions } from './resolver.js';
export { VERSION };
