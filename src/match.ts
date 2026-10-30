import { jaroWinkler } from './jaro-winkler.js';
import { stripTails, tokenize } from './normalize.js';

export type MatchStage = 'exact' | 'tokens' | 'prefix' | 'fuzzy';

/** Um alias já normalizado (ver `normalizeAlias`) e o índice da marca dona dele. */
export interface AliasEntry {
  alias: string;
  brand: number;
  /** Só casa quando é o descritor inteiro (palavras comuns como "TIM" ou "OI"). */
  strict?: boolean;
}

export interface MatchResult {
  brand: number;
  stage: MatchStage;
  confidence: number;
}

export interface MatchOptions {
  /** Similaridade Jaro-Winkler mínima para o fuzzy match, entre 0 e 1. Padrão: 0.9. */
  fuzzyThreshold?: number;
}

export const DEFAULT_FUZZY_THRESHOLD = 0.9;

/** Confiança fixa por etapa. O fuzzy vai de 0.5 a 0.75 conforme a similaridade. */
export const STAGE_CONFIDENCE = { exact: 1, tokens: 0.9, prefix: 0.8, fuzzyMin: 0.5, fuzzyMax: 0.75 };

// Strings curtas demais geram falsos positivos ("CLARA" ~ "CLARO").
const MIN_PREFIX_LENGTH = 5;
const MIN_FUZZY_LENGTH = 6;
// O bônus de prefixo do Jaro-Winkler aproxima "DROGARIA" de "DROGARIASAOPAULO";
// exigir tamanhos parecidos deixa o fuzzy só para erros de digitação.
const MIN_FUZZY_LENGTH_RATIO = 0.75;
// Diferença mínima entre a melhor marca e a segunda no fuzzy; abaixo disso é empate.
const FUZZY_TIE_MARGIN = 0.02;

// O que pode vir grudado depois de um alias: dígitos, país, ".COM", ".COM.BR", sufixo societário.
const GLUED_NOISE = /^(\d+|BR|BRA|BRASIL|COM|COMBR|SA|LTDA)\d*$/;

const lengthRatio =(a: string, b: string) => Math.min(a.length, b.length) / Math.max(a.length, b.length);

interface PreparedAlias {
  key: string;
  tokens: string[];
  compact: string;
  brand: number;
  strict: boolean;
}

interface Scored {
  brand: number;
  score: number;
}

const compact = (s: string) => s.replace(/ /g, '');

/** Marca com a maior pontuação, ou null se outra marca empatar com ela. */
function pickUnique(candidates: Scored[], margin = 0): number | null {
  let best: Scored | undefined;
  for (const c of candidates) if (!best || c.score > best.score) best = c;
  if (!best) return null;
  const winner = best;
  const tied = candidates.some((c) => c.brand !== winner.brand && winner.score - c.score <= margin);
  return tied ? null : winner.brand;
}

function containsSequence(haystack: readonly string[], needle: readonly string[]): boolean {
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((t, k) => haystack[i + k] === t)) return true;
  }
  return false;
}

/** Monta uma chave → marca; chaves que apontam para duas marcas viram -1 (ambíguas). */
function buildLookup(pairs: Array<[string, number]>): Map<string, number> {
  const map = new Map<string, number>();
  for (const [key, brand] of pairs) {
    const current = map.get(key);
    map.set(key, current === undefined || current === brand ? brand : -1);
  }
  return map;
}

/**
 * Cria a função de matching a partir dos aliases normalizados.
 * As etapas rodam em ordem e a primeira que encontra uma marca única vence.
 */
export function createMatcher(entries: readonly AliasEntry[]) {
  const all: PreparedAlias[] = entries
    .filter((e) => e.alias.length > 0)
    .map((e) => ({
      key: e.alias,
      tokens: e.alias.split(' '),
      compact: compact(e.alias),
      brand: e.brand,
      strict: e.strict === true,
    }));
  // Aliases estritos só participam do match exato.
  const aliases = all.filter((a) => !a.strict);

  const exact = buildLookup(all.map((a) => [a.key, a.brand]));
  const exactCompact = buildLookup(all.map((a) => [a.compact, a.brand]));
  const keepNumbers = new Set(all.flatMap((a) => a.tokens.filter((t) => /^\d+$/.test(t))));
  const isKnown = (s: string) => exact.has(s);

  return function match(descriptor: string, options: MatchOptions = {}): MatchResult | null {
    const tokens = stripTails(tokenize(descriptor, keepNumbers), { isKnown });
    if (tokens.length === 0) return null;
    const query = tokens.join(' ');
    const queryCompact = compact(query);

    // 1. Exato, com e sem espaços ("MERCADOLIVRE" = "MERCADO LIVRE").
    const exactBrand = exact.get(query) ?? exactCompact.get(queryCompact);
    if (exactBrand !== undefined) {
      return exactBrand === -1 ? null : { brand: exactBrand, stage: 'exact', confidence: STAGE_CONFIDENCE.exact };
    }

    // 2. Todos os tokens do alias aparecem em sequência no descritor. O alias mais longo vence.
    const contained = aliases
      .filter((a) => a.tokens.length < tokens.length && containsSequence(tokens, a.tokens))
      .map((a) => ({ brand: a.brand, score: a.key.length }));
    if (contained.length > 0) {
      const brand = pickUnique(contained);
      return brand === null ? null : { brand, stage: 'tokens', confidence: STAGE_CONFIDENCE.tokens };
    }

    // 3a. Prefixo truncado: o extrato cortou o nome ("NETFLI", "DROGARIA SAO PAU").
    // Só vale se o corte cai no meio de uma palavra e aponta para uma única marca;
    // "DROGARIA" ou "MERCADO" sozinhos são palavras genéricas, não truncamento.
    if (queryCompact.length >= MIN_PREFIX_LENGTH) {
      const truncated = aliases.filter(
        (a) => a.compact.startsWith(queryCompact) && a.compact.length > queryCompact.length && queryCompact.length * 2 >= a.compact.length,
      );
      if (truncated.length > 0) {
        const brands = new Set(truncated.map((a) => a.brand));
        const cutMidWord = truncated.every((a) => !a.key.startsWith(query) || a.key[query.length] !== ' ');
        const [brand] = brands;
        if (brands.size > 1 || !cutMidWord || brand === undefined) return null;
        return { brand, stage: 'prefix', confidence: STAGE_CONFIDENCE.prefix };
      }
    }

    // 3b. Alias colado a ruído ("SPOTIFYBR", "MCDONALDS4521"). O que sobra precisa ser
    // ruído conhecido; senão "APPLEBEES" viraria Apple e "SHELLY" viraria Shell.
    const glued = aliases
      .filter(
        (a) =>
          a.compact.length >= MIN_PREFIX_LENGTH &&
          queryCompact.startsWith(a.compact) &&
          GLUED_NOISE.test(queryCompact.slice(a.compact.length)),
      )
      .map((a) => ({ brand: a.brand, score: a.compact.length }));
    if (glued.length > 0) {
      const brand = pickUnique(glued);
      return brand === null ? null : { brand, stage: 'prefix', confidence: STAGE_CONFIDENCE.prefix };
    }

    // 4. Fuzzy (Jaro-Winkler) para erros de digitação e abreviações.
    const threshold = options.fuzzyThreshold ?? DEFAULT_FUZZY_THRESHOLD;
    if (queryCompact.length < MIN_FUZZY_LENGTH) return null;
    const scored = aliases
      .filter((a) => a.compact.length >= MIN_FUZZY_LENGTH && lengthRatio(a.compact, queryCompact) >= MIN_FUZZY_LENGTH_RATIO)
      .map((a) => ({ brand: a.brand, score: jaroWinkler(queryCompact, a.compact) }))
      .filter((s) => s.score >= threshold);
    const brand = pickUnique(scored, FUZZY_TIE_MARGIN);
    if (brand === null) return null;

    const best = Math.max(...scored.filter((s) => s.brand === brand).map((s) => s.score));
    const ratio = threshold >= 1 ? 1 : (best - threshold) / (1 - threshold);
    const { fuzzyMin, fuzzyMax } = STAGE_CONFIDENCE;
    const confidence = Math.round((fuzzyMin + ratio * (fuzzyMax - fuzzyMin)) * 100) / 100;
    return { brand, stage: 'fuzzy', confidence };
  };
}
