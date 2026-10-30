import { describe, expect, it } from 'vitest';
import { createMatcher, type AliasEntry } from '../src/match.ts';
import { normalizeAlias } from '../src/normalize.ts';

const BRANDS: Record<string, string[]> = {
  mcdonalds: ['McDonalds', "McDonald's"],
  ifood: ['iFood', 'IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.'],
  uber: ['Uber', 'Uber do Brasil'],
  '99': ['99APP', '99 POP', '99 Tecnologia'],
  'drogaria-sao-paulo': ['Drogaria São Paulo'],
  drogasil: ['Drogasil'],
  'droga-raia': ['Droga Raia'],
  netflix: ['Netflix'],
  claro: ['Claro'],
  'mercado-livre': ['Mercado Livre'],
  spotify: ['Spotify'],
};

const slugs = Object.keys(BRANDS);
const entries: AliasEntry[] = slugs.flatMap((slug, brand) =>
  (BRANDS[slug] ?? []).map((alias) => ({ alias: normalizeAlias(alias), brand })),
);
const matcher = createMatcher(entries);
const resolveSlug = (descriptor: string, threshold?: number) => {
  const result = matcher(descriptor, threshold === undefined ? {} : { fuzzyThreshold: threshold });
  return result && { slug: slugs[result.brand], stage: result.stage, confidence: result.confidence };
};

describe('etapa exata', () => {
  it.each([
    ['PAG*MCDONALDS 4521 SAO PAULO', 'mcdonalds'],
    ['PIX UBER DO BRASIL', 'uber'],
    ['NETFLIX.COM', 'netflix'],
    ['99 TECNOLOGIA LTDA', '99'],
    ['DROGARIA SAO PAULO SP', 'drogaria-sao-paulo'],
    ['MERCADOLIVRE', 'mercado-livre'],
    ['MC DONALDS', 'mcdonalds'],
    ['99 POP 1234 SAO PAULO', '99'],
  ])('%s → %s', (descriptor, slug) => {
    expect(resolveSlug(descriptor)).toEqual({ slug, stage: 'exact', confidence: 1 });
  });
});

describe('etapa de tokens', () => {
  it.each([
    ['IFD*IFOOD.COM AGENCIA', 'ifood'],
    ['UBER *TRIP HELP.UBER.COM', 'uber'],
    ['99*POP CORRIDA 1234', '99'],
    ['DROGARIA SAO PAULO MOEMA', 'drogaria-sao-paulo'],
    ['POSTO CLARO VERDE', 'claro'],
  ])('%s → %s', (descriptor, slug) => {
    expect(resolveSlug(descriptor)).toEqual({ slug, stage: 'tokens', confidence: 0.9 });
  });

  it('não confunde marca com cidade removida do final', () => {
    expect(resolveSlug('DROGARIA DO ZE SAO PAULO')).toBeNull();
  });
});

describe('etapa de prefixo', () => {
  it.each([
    ['NETFLI', 'netflix'],
    ['SPOTIFYBR', 'spotify'],
    ['DROGAS', 'drogasil'],
  ])('%s → %s', (descriptor, slug) => {
    expect(resolveSlug(descriptor)).toEqual({ slug, stage: 'prefix', confidence: 0.8 });
  });

  it('aceita corte no meio da palavra em alias de várias palavras', () => {
    expect(resolveSlug('DROGARIA SAO PAU')).toEqual({ slug: 'drogaria-sao-paulo', stage: 'prefix', confidence: 0.8 });
    expect(resolveSlug('MERCADOLIVR')).toEqual({ slug: 'mercado-livre', stage: 'prefix', confidence: 0.8 });
  });

  it('devolve null quando o prefixo serve para duas marcas', () => {
    expect(resolveSlug('DROGA')).toBeNull();
  });

  it('não trata palavra genérica inteira como truncamento', () => {
    expect(resolveSlug('DROGARIA')).toBeNull();
    expect(resolveSlug('MERCADO')).toBeNull();
  });
});

describe('etapa fuzzy', () => {
  it('encontra erros de digitação', () => {
    const result = resolveSlug('MCDONLADS');
    expect(result?.slug).toBe('mcdonalds');
    expect(result?.stage).toBe('fuzzy');
    expect(result?.confidence).toBeGreaterThanOrEqual(0.5);
    expect(result?.confidence).toBeLessThanOrEqual(0.75);
  });

  it('respeita o limiar configurado', () => {
    expect(resolveSlug('SPOTFY')?.slug).toBe('spotify');
    expect(resolveSlug('SPOTFY', 0.99)).toBeNull();
  });

  it('não aplica fuzzy em strings curtas', () => {
    expect(resolveSlug('CLARA')).toBeNull();
  });
});

describe('nunca chuta', () => {
  it.each(['PIX ENVIADO JOAO DA SILVA', 'PADARIA PAO QUENTE SAO PAULO', 'TED 12345678', 'MP*', '', 'SAQUE 24H'])(
    '%s → null',
    (descriptor) => expect(resolveSlug(descriptor)).toBeNull(),
  );

  it('devolve null quando um alias aponta para duas marcas', () => {
    const ambiguous = createMatcher([
      { alias: 'ACME', brand: 0 },
      { alias: 'ACME', brand: 1 },
    ]);
    expect(ambiguous('ACME')).toBeNull();
  });

  it('devolve null quando duas marcas empatam na contenção', () => {
    const tie = createMatcher([
      { alias: 'ALFA', brand: 0 },
      { alias: 'BETA', brand: 1 },
    ]);
    expect(tie('ALFA BETA')).toBeNull();
  });
});
