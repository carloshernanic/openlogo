import { describe, expect, it } from 'vitest';
import { jaro, jaroWinkler } from '../src/jaro-winkler.ts';

describe('jaro', () => {
  it('casos de referência', () => {
    expect(jaro('MARTHA', 'MARHTA')).toBeCloseTo(0.9444, 4);
    expect(jaro('DIXON', 'DICKSONX')).toBeCloseTo(0.7667, 4);
    expect(jaro('DWAYNE', 'DUANE')).toBeCloseTo(0.8222, 4);
  });

  it('extremos', () => {
    expect(jaro('IFOOD', 'IFOOD')).toBe(1);
    expect(jaro('', 'IFOOD')).toBe(0);
    expect(jaro('ABC', 'XYZ')).toBe(0);
  });
});

describe('jaroWinkler', () => {
  it('casos de referência', () => {
    expect(jaroWinkler('MARTHA', 'MARHTA')).toBeCloseTo(0.9611, 4);
    expect(jaroWinkler('DIXON', 'DICKSONX')).toBeCloseTo(0.8133, 4);
    expect(jaroWinkler('DWAYNE', 'DUANE')).toBeCloseTo(0.84, 4);
  });

  it('é simétrico', () => {
    expect(jaroWinkler('MCDONLADS', 'MCDONALDS')).toBeCloseTo(jaroWinkler('MCDONALDS', 'MCDONLADS'), 10);
  });

  it('dá nota alta a erros de digitação de marcas', () => {
    expect(jaroWinkler('MCDONLADS', 'MCDONALDS')).toBeGreaterThan(0.95);
    expect(jaroWinkler('SPOTFY', 'SPOTIFY')).toBeGreaterThan(0.9);
  });
});
