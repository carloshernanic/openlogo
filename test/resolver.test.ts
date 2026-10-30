import { describe, expect, it } from 'vitest';
import { createResolver, type BrandIndex } from '../src/resolver.ts';

const index: BrandIndex = {
  cdnBase: 'https://cdn.jsdelivr.net/gh/dono/openlogo@v1.2.3/brands/',
  brands: [
    { slug: 'ifood', name: 'iFood', category: 'delivery', color: '#EA1D2C', hasLogo: true, hasDarkLogo: false },
    { slug: 'uber', name: 'Uber', category: 'transport', color: '#000000', hasLogo: true, hasDarkLogo: true },
    { slug: 'rappi', name: 'Rappi', category: 'delivery', color: '#FF441F', hasLogo: false, hasDarkLogo: false },
  ],
  aliases: [
    ['IFOOD', 0],
    ['UBER', 1],
    ['RAPPI', 2],
  ],
};

const { resolve, resolveMany } = createResolver(index);

describe('resolve', () => {
  it('monta o Match com a URL versionada do jsDelivr', () => {
    expect(resolve('IFD*IFOOD.COM AGENCIA')).toEqual({
      slug: 'ifood',
      name: 'iFood',
      logoUrl: 'https://cdn.jsdelivr.net/gh/dono/openlogo@v1.2.3/brands/ifood/logo.svg',
      color: '#EA1D2C',
      category: 'delivery',
      confidence: 0.9,
    });
  });

  it('inclui logoDarkUrl só quando existe', () => {
    expect(resolve('UBER')?.logoDarkUrl).toBe('https://cdn.jsdelivr.net/gh/dono/openlogo@v1.2.3/brands/uber/logo-dark.svg');
    expect(resolve('IFOOD')).not.toHaveProperty('logoDarkUrl');
  });

  it('devolve logoUrl null quando a marca não tem logo', () => {
    expect(resolve('RAPPI')).toMatchObject({ slug: 'rappi', logoUrl: null });
  });

  it('devolve null para entradas inválidas', () => {
    expect(resolve('')).toBeNull();
    expect(resolve(undefined as unknown as string)).toBeNull();
  });
});

describe('resolveMany', () => {
  it('preserva a ordem e os nulls', () => {
    const results = resolveMany(['UBER', 'PADARIA DO BAIRRO', 'IFOOD', 'UBER']);
    expect(results.map((r) => r?.slug ?? null)).toEqual(['uber', null, 'ifood', 'uber']);
  });
});
