import {
  ACQUIRER_PREFIXES,
  CORPORATE_SUFFIXES,
  LOCATION_SUFFIXES,
  NOISE_TOKENS,
  TRAILING_CONNECTORS,
} from './data/noise.js';

export interface NormalizeOptions {
  /**
   * Números que fazem parte de nomes de marca (ex: "99") e não devem ser removidos.
   * O índice gerado em build calcula isso a partir dos aliases.
   */
  keepNumbers?: ReadonlySet<string> | 'all';
  /**
   * Interrompe a remoção de cidades/UFs quando a string atual já é um alias conhecido,
   * para que "DROGARIA SAO PAULO" não vire "DROGARIA".
   */
  isKnown?: (normalized: string) => boolean;
}

const ACQUIRER_RE = new RegExp(`(^|[^A-Z0-9])(?:${ACQUIRER_PREFIXES.join('|')})\\s*\\*`, 'g');

/** Maiúsculas, sem acentos, sem prefixos de adquirente, pontuação, ruído e números. */
export function tokenize(input: string, keepNumbers: NormalizeOptions['keepNumbers'] = undefined): string[] {
  const upper = input
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // acentos viram marcas separadas depois do NFD
    .toUpperCase()
    .replace(/['’`]/g, '') // MCDONALD'S → MCDONALDS
    .replace(ACQUIRER_RE, '$1 ');

  return upper
    .split(/[^A-Z0-9]+/)
    .filter((t) => t.length > 0 && !NOISE_TOKENS.has(t))
    .filter((t) => !/^\d+$/.test(t) || keepNumbers === 'all' || keepNumbers?.has(t) === true);
}

function endsWith(tokens: readonly string[], suffix: readonly string[]): boolean {
  if (suffix.length >= tokens.length) return false; // sempre sobra ao menos um token
  const offset = tokens.length - suffix.length;
  return suffix.every((t, i) => tokens[offset + i] === t);
}

function stripOne(tokens: string[], suffixes: readonly string[][]): string[] | null {
  for (const suffix of suffixes) {
    if (endsWith(tokens, suffix)) return tokens.slice(0, tokens.length - suffix.length);
  }
  const last = tokens[tokens.length - 1];
  if (tokens.length > 1 && last !== undefined && TRAILING_CONNECTORS.has(last)) return tokens.slice(0, -1);
  return null;
}

/** Remove do final, repetidamente, sufixos societários e (se pedido) cidade, UF e país. */
export function stripTails(
  tokens: string[],
  { locations = true, isKnown }: { locations?: boolean; isKnown?: NormalizeOptions['isKnown'] } = {},
): string[] {
  const suffixes = locations ? [...CORPORATE_SUFFIXES, ...LOCATION_SUFFIXES] : CORPORATE_SUFFIXES;
  let current = tokens;
  while (!isKnown?.(current.join(' '))) {
    const next = stripOne(current, suffixes);
    if (!next) break;
    current = next;
  }
  return current;
}

/**
 * Normaliza um descritor de extrato.
 *
 * @example normalize('PAG*MCDONALDS 4521 SAO PAULO') // 'MCDONALDS'
 */
export function normalize(input: string, options: NormalizeOptions = {}): string {
  const tokens = tokenize(input, options.keepNumbers);
  const stripOptions = options.isKnown ? { isKnown: options.isKnown } : {};
  return stripTails(tokens, stripOptions).join(' ');
}

/**
 * Normaliza um alias de brand.json. Mantém números e cidades, porque o alias foi
 * escrito de propósito; remove só sufixos societários.
 */
export function normalizeAlias(alias: string): string {
  return stripTails(tokenize(alias, 'all'), { locations: false }).join(' ');
}
