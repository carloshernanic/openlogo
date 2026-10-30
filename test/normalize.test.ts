import { describe, expect, it } from 'vitest';
import { normalize, normalizeAlias, tokenize } from '../src/normalize.ts';

describe('tokenize', () => {
  it('converte para maiúsculas e remove acentos', () => {
    expect(tokenize('Pão de Açúcar')).toEqual(['PAO', 'DE', 'ACUCAR']);
  });

  it('junta palavras separadas por apóstrofo', () => {
    expect(tokenize("McDonald's")).toEqual(['MCDONALDS']);
  });

  it('remove prefixos de adquirentes seguidos de *', () => {
    expect(tokenize('PAG*MCDONALDS')).toEqual(['MCDONALDS']);
    expect(tokenize('IFD*IFOOD.COM')).toEqual(['IFOOD']);
    expect(tokenize('MP *SUBWAY')).toEqual(['SUBWAY']);
    expect(tokenize('PAYPAL *NETFLIX')).toEqual(['NETFLIX']);
  });

  it('mantém prefixo de adquirente quando não há *', () => {
    expect(tokenize('PICPAY')).toEqual(['PICPAY']);
    expect(tokenize('PAYPAL')).toEqual(['PAYPAL']);
  });

  it('não remove marcas que usam * no próprio descritor', () => {
    expect(tokenize('UBER *TRIP')).toEqual(['UBER', 'TRIP']);
  });

  it('remove palavras de meio de pagamento', () => {
    expect(tokenize('PIX UBER DO BRASIL')).toEqual(['UBER', 'DO', 'BRASIL']);
    expect(tokenize('COMPRA CARTAO DEBITO SHELL')).toEqual(['SHELL']);
  });

  it('remove números, exceto os preservados', () => {
    expect(tokenize('MCDONALDS 4521')).toEqual(['MCDONALDS']);
    expect(tokenize('99 POP 1234', new Set(['99']))).toEqual(['99', 'POP']);
    expect(tokenize('99 POP 1234', 'all')).toEqual(['99', 'POP', '1234']);
  });

  it('mantém tokens que misturam letras e números', () => {
    expect(tokenize('C6 BANK')).toEqual(['C6', 'BANK']);
  });
});

describe('normalize', () => {
  it.each([
    ['PAG*MCDONALDS 4521 SAO PAULO', 'MCDONALDS'],
    ['PIX UBER DO BRASIL', 'UBER'],
    ['IFD*IFOOD.COM AGENCIA', 'IFOOD AGENCIA'],
    ['NETFLIX.COM', 'NETFLIX'],
    ['DROGASIL 1234 RIO DE JANEIRO RJ BR', 'DROGASIL'],
    ['POSTO SHELL LTDA', 'POSTO SHELL'],
    ['MAGAZINE LUIZA S/A', 'MAGAZINE LUIZA'],
    ['AMAZON SERVICOS DE VAREJO DO BRASIL LTDA', 'AMAZON SERVICOS DE VAREJO'],
    ['Padaria Pão Quente São Paulo SP', 'PADARIA PAO QUENTE'],
  ])('%s → %s', (input, expected) => {
    expect(normalize(input)).toBe(expected);
  });

  it('nunca remove o único token restante', () => {
    expect(normalize('SAO PAULO')).toBe('SAO PAULO');
    expect(normalize('SP')).toBe('SP');
  });

  it('devolve string vazia quando só há ruído', () => {
    expect(normalize('PIX 12345')).toBe('');
    expect(normalize('MP*')).toBe('');
    expect(normalize('')).toBe('');
  });

  it('para de remover cidade quando a string já é um alias conhecido', () => {
    const known = new Set(['DROGARIA SAO PAULO']);
    const isKnown = (s: string) => known.has(s);
    expect(normalize('DROGARIA SAO PAULO SP', { isKnown })).toBe('DROGARIA SAO PAULO');
    expect(normalize('DROGARIA SAO PAULO SP')).toBe('DROGARIA');
  });
});

describe('normalizeAlias', () => {
  it('mantém números e cidades, remove sufixo societário', () => {
    expect(normalizeAlias('99 Tecnologia Ltda')).toBe('99 TECNOLOGIA');
    expect(normalizeAlias('Drogaria São Paulo')).toBe('DROGARIA SAO PAULO');
    expect(normalizeAlias('IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.')).toBe(
      'IFOOD AGENCIA DE RESTAURANTES ONLINE',
    );
  });
});
