// Listas usadas pela normalização. Todas em maiúsculas e sem acento.

/**
 * Prefixos de adquirentes, subadquirentes e carteiras que vêm antes de um `*`
 * no descritor, como em "PAG*MCDONALDS" ou "IFD*IFOOD". Só são removidos quando
 * seguidos de `*`: "PICPAY" sozinho continua sendo a marca PicPay.
 */
export const ACQUIRER_PREFIXES = [
  'ADYEN', 'ASA', 'CIELO', 'DL', 'DLOCAL', 'EBANX', 'EBN', 'EC', 'GETNET', 'HOTMART', 'HTM',
  'IFD', 'IZ', 'KIWIFY', 'MERCADOPAGO', 'MERCPAGO', 'MOIP', 'MP', 'NUPAY', 'PAG', 'PAGARME',
  'PAGSEGURO', 'PAYPAL', 'PAYU', 'PG', 'PGS', 'PICPAY', 'PP', 'SQ', 'STONE', 'SUMUP', 'WIRECARD',
  'ZP',
];

/** Palavras de meio de pagamento e operação bancária, removidas em qualquer posição. */
export const NOISE_TOKENS = new Set([
  'APROVADA', 'AUT', 'AUTOMATICO', 'BOLETO', 'CARTAO', 'COM', 'COMPRA', 'CRED', 'CREDITO', 'DEB',
  'DEBITO', 'DOC', 'ELECTRON', 'ELO', 'ENVIADA', 'ENVIADO', 'FILIAL', 'HTTP', 'HTTPS', 'LJ',
  'LOJA', 'MAESTRO', 'MASTER', 'MASTERCARD', 'PAGAMENTO', 'PAGTO', 'PARC', 'PARCELA', 'PGTO',
  'PIX', 'QR', 'QRCODE', 'RECEBIDO', 'TED', 'TRANSF', 'TRANSFERENCIA', 'VISA', 'WWW',
]);

/** Sufixos societários, removidos do final. Cada item é uma sequência de tokens. */
export const CORPORATE_SUFFIXES: readonly string[][] = [
  ['LTDA'], ['SA'], ['S', 'A'], ['ME'], ['EPP'], ['EIRELI'], ['MEI'], ['CIA'], ['E', 'CIA'],
  ['INC'], ['LLC'], ['LTD'],
];

/** Conectivos que sobram soltos no final depois de remover cidade ou país. */
export const TRAILING_CONNECTORS = new Set(['DE', 'DA', 'DO', 'DOS', 'DAS', 'E']);

export const COUNTRIES = ['BR', 'BRA', 'BRASIL', 'BRAZIL'];

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/** Capitais e cidades grandes que aparecem com frequência no fim dos descritores. */
export const CITIES = [
  'ALPHAVILLE', 'ARACAJU', 'BARUERI', 'BAURU', 'BELEM', 'BELO HORIZONTE', 'BH', 'BOA VISTA',
  'BRASILIA', 'CAMPINAS', 'CAMPO GRANDE', 'CARAPICUIBA', 'CONTAGEM', 'COTIA', 'CUIABA',
  'CURITIBA', 'DIADEMA', 'DUQUE DE CAXIAS', 'FLORIANOPOLIS', 'FORTALEZA', 'FOZ DO IGUACU',
  'GOIANIA', 'GUARULHOS', 'JOAO PESSOA', 'JOINVILLE', 'JUIZ DE FORA', 'JUNDIAI', 'LONDRINA',
  'MACAPA', 'MACEIO', 'MANAUS', 'MAUA', 'NATAL', 'NITEROI', 'NOVA IGUACU', 'OSASCO', 'PALMAS',
  'PIRACICABA', 'PORTO ALEGRE', 'PORTO VELHO', 'RECIFE', 'RIBEIRAO PRETO', 'RIO BRANCO',
  'RIO DE JANEIRO', 'S PAULO', 'SALVADOR', 'SANTO ANDRE', 'SANTOS', 'SAO BERNARDO DO CAMPO',
  'SAO CAETANO DO SUL', 'SAO GONCALO', 'SAO JOSE DOS CAMPOS', 'SAO LUIS', 'SAO PAULO',
  'SOROCABA', 'TABOAO DA SERRA', 'TERESINA', 'UBERLANDIA', 'VITORIA',
];

/** Cidades, UFs e países como sequências de tokens, prontos para casar com o fim da string. */
export const LOCATION_SUFFIXES: readonly string[][] = [...CITIES, ...UFS, ...COUNTRIES].map((s) =>
  s.split(' '),
);
