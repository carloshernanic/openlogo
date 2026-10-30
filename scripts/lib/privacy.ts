// Heurísticas para impedir que dados pessoais entrem como alias.
// Extratos de Pix e TED trazem CPF e nome de pessoa física: isso nunca é marca.

const FIRST_NAMES = new Set(
  `ADRIANA ADRIANO ALESSANDRA ALEX ALEXANDRE ALINE AMANDA ANA ANDERSON ANDRE ANDREA ANDREIA
  ANTONIA ANTONIO ARTHUR BEATRIZ BRUNA BRUNO CAIO CAMILA CARLA CARLOS CAROLINA CAUA CECILIA
  CLARA CLAUDIA CLAUDIO CRISTIANE CRISTIANO DANIEL DANIELA DANIELE DAVI DAVID DEBORA DENISE
  DIEGO DOUGLAS EDUARDA EDUARDO ELAINE ELIANA ELIANE EMANUEL EMILY ENZO ERICA ERIK FABIANA
  FABIO FABRICIO FELIPE FERNANDA FERNANDO FLAVIA FLAVIO FRANCISCA FRANCISCO GABRIEL GABRIELA
  GABRIELE GUILHERME GUSTAVO HEITOR HELENA HUGO IGOR ISABELA ISABELLA ISADORA IVAN JAQUELINE
  JESSICA JOANA JOAO JORGE JOSE JOSEFA JULIA JULIANA JULIANO JULIO KAREN KATIA LARA LARISSA
  LAURA LEANDRO LEONARDO LETICIA LIVIA LORENA LORENZO LUANA LUCAS LUCIA LUCIANA LUCIANO LUIS
  LUIZ LUIZA MANOEL MANUEL MARCELA MARCELO MARCIA MARCIO MARCOS MARIA MARIANA MARINA MARIO
  MATEUS MATHEUS MAURICIO MIGUEL MILENA MONICA MURILO NATALIA NICOLAS NICOLE OTAVIO PATRICIA
  PAULA PAULO PEDRO PRISCILA RAFAEL RAFAELA RAIMUNDO RAQUEL REGINA RENAN RENATA RENATO RICARDO
  RITA ROBERTO RODRIGO ROGERIO ROSA ROSANA SABRINA SAMUEL SANDRA SARA SERGIO SIMONE SOFIA
  SONIA SUELI TAIS TATIANA THIAGO TIAGO VALERIA VANESSA VERA VICTOR VINICIUS VITOR VITORIA
  VIVIANE WAGNER WESLEY WILLIAM YASMIN`.split(/\s+/),
);

const SURNAMES = new Set(
  `ALMEIDA ALVES ANDRADE ARAUJO BARBOSA BARROS BATISTA BEZERRA BORGES CAMPOS CARDOSO CARVALHO
  CASTRO COELHO CORREIA COSTA CRUZ CUNHA DIAS DUARTE FARIAS FERNANDES FERREIRA FIGUEIREDO
  FONSECA FREITAS GOMES GONCALVES GUIMARAES LIMA LOPES MACHADO MARQUES MARTINS MEDEIROS MELO
  MENDES MIRANDA MONTEIRO MORAES MOREIRA MOURA NASCIMENTO NOGUEIRA NUNES OLIVEIRA PEREIRA
  PINHEIRO PINTO RAMOS REIS RIBEIRO ROCHA RODRIGUES SALES SANTANA SANTOS SILVA SILVEIRA SOARES
  SOUSA SOUZA TEIXEIRA VIEIRA`.split(/\s+/),
);

const CONNECTORS = new Set(['DE', 'DA', 'DO', 'DOS', 'DAS', 'E']);

function tokens(value: string): string[] {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

/** CPF (com ou sem máscara, inclusive mascarado com *), CNPJ completo ou outro número longo. */
export function looksLikeDocument(alias: string): boolean {
  if (/\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}/.test(alias)) return true; // CPF
  if (/\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2}/.test(alias)) return true; // CNPJ
  if (/[*xX]{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?[*xX]{2}/.test(alias)) return true; // CPF mascarado do Pix
  // Sequência longa de dígitos (conta, telefone, documento) não identifica marca.
  return /\d{9,}/.test(alias.replace(/[.\-/\s]/g, ''));
}

/** Prenome comum seguido só de sobrenomes/prenomes, ex: "JOAO DA SILVA". */
export function looksLikePersonName(alias: string): boolean {
  const parts = tokens(alias);
  if (parts.length < 2 || parts.length > 6) return false;
  const [first, ...rest] = parts;
  if (!first || !FIRST_NAMES.has(first)) return false;
  return rest.every((t) => SURNAMES.has(t) || FIRST_NAMES.has(t) || CONNECTORS.has(t));
}

export function privacyProblem(alias: string): string | null {
  if (looksLikeDocument(alias)) return 'parece CPF, CNPJ ou outro número pessoal';
  if (looksLikePersonName(alias)) return 'parece nome de pessoa física';
  return null;
}
