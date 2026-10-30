import { describe, expect, it } from 'vitest';
import * as api from '../src/index.ts';

describe('API pública', () => {
  it('exporta resolve, resolveMany, normalize e VERSION', () => {
    expect(typeof api.resolve).toBe('function');
    expect(typeof api.resolveMany).toBe('function');
    expect(api.normalize('PAG*MCDONALDS 4521')).toBe('MCDONALDS');
    expect(api.VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
