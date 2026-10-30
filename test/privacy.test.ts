import { describe, expect, it } from 'vitest';
import { looksLikeDocument, looksLikePersonName, privacyProblem } from '../scripts/lib/privacy.ts';

describe('looksLikeDocument', () => {
  it.each(['123.456.789-09', '12345678909', 'PIX 12345678909', '12.345.678/0001-90', '***.456.789-**'])(
    'rejeita %s',
    (value) => expect(looksLikeDocument(value)).toBe(true),
  );

  it.each(['IFOOD', 'PAG*MCDONALDS 4521', 'POSTO 24 HORAS', '99 POP'])('aceita %s', (value) => {
    expect(looksLikeDocument(value)).toBe(false);
  });
});

describe('looksLikePersonName', () => {
  it.each(['JOAO DA SILVA', 'Maria Oliveira', 'ANA PAULA SOUZA', 'josé dos santos'])('rejeita %s', (value) => {
    expect(looksLikePersonName(value)).toBe(true);
  });

  it.each(['MAGAZINE LUIZA', 'CASAS BAHIA', 'DROGARIA SAO PAULO', 'PAULO', 'RAIA', 'PAO DE ACUCAR'])(
    'aceita %s',
    (value) => expect(looksLikePersonName(value)).toBe(false),
  );
});

describe('privacyProblem', () => {
  it('explica o motivo da rejeição', () => {
    expect(privacyProblem('123.456.789-09')).toMatch(/CPF/);
    expect(privacyProblem('JOAO SILVA')).toMatch(/pessoa física/);
    expect(privacyProblem('IFOOD')).toBeNull();
  });
});
