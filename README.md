# OpenLogo

Base aberta de marcas brasileiras + biblioteca que transforma o descritor poluído de um extrato bancário na marca certa, com logo em SVG.

```
"PAG*MCDONALDS 4521 SAO PAULO"  →  McDonald's  🟡
"PIX UBER DO BRASIL"            →  Uber        ⚫
"IFD*IFOOD.COM AGENCIA"         →  iFood       🔴
"PIX ENVIADO JOAO DA SILVA"     →  null
```

- **Sem servidor e sem custo de infraestrutura.** Os dados ficam neste repositório, os SVGs são servidos pelo [jsDelivr](https://www.jsdelivr.com) e o matching roda localmente.
- **Zero dependências em runtime.** O índice de aliases é gerado em build e embutido no pacote.
- **Determinístico.** Sem LLM e sem rede: a mesma entrada sempre dá a mesma saída.
- **Nunca chuta.** Na dúvida, devolve `null`.

## Instalação

```bash
npm install openlogo
```

Funciona em Node 18+, navegadores e edge runtimes. Publica ESM e CommonJS.

## Uso

```ts
import { resolve, resolveMany } from 'openlogo';

resolve('PAG*MCDONALDS 4521 SAO PAULO');
// {
//   slug: 'mcdonalds',
//   name: "McDonald's",
//   logoUrl: 'https://cdn.jsdelivr.net/gh/carloshernanic/openlogo@v0.1.0/brands/mcdonalds/logo.svg',
//   color: '#FBC817',
//   category: 'food',
//   confidence: 1
// }

resolveMany(['PIX UBER DO BRASIL', 'IFD*IFOOD.COM AGENCIA', 'PIX ENVIADO JOAO DA SILVA']);
// [{ slug: 'uber', confidence: 1, ... }, { slug: 'ifood', confidence: 0.9, ... }, null]
```

```tsx
const match = resolve(transaction.description);

<img src={match?.logoUrl ?? genericIcon} alt={match?.name ?? ''} />
```

### API

| Função | Retorno |
| --- | --- |
| `resolve(descriptor, options?)` | `Match \| null` |
| `resolveMany(descriptors, options?)` | `(Match \| null)[]`, na mesma ordem; descritores repetidos são resolvidos uma vez só |
| `normalize(descriptor)` | a string normalizada, útil para depurar |

```ts
interface Match {
  slug: string;
  name: string;
  logoUrl: string | null; // null se a marca ainda não tem logo no dataset
  logoDarkUrl?: string;   // versão para fundo escuro, quando existe
  color: string;          // cor principal, hex
  category: string;       // bank, delivery, fintech, food, fuel, pharmacy, retail, streaming, ...
  confidence: number;     // veja abaixo
}

interface ResolveOptions {
  fuzzyThreshold?: number; // Jaro-Winkler mínimo no fuzzy match. Padrão: 0.9
}
```

`logoUrl` aponta para a tag do release (`@v0.1.0`), então a logo que você vê não muda sem você atualizar o pacote.

## Como funciona o matching

**1. Normalização**

O descritor passa por estas etapas, em ordem:

- Converte para maiúsculas e remove acentos.
- Remove prefixos de adquirentes e carteiras antes de `*`, como `PAG*`, `IFD*`, `MP*`, `PAYPAL *` e `EBN*`.
- Remove palavras de meio de pagamento (`PIX`, `COMPRA`, `DEBITO`, `CARTAO`…), pontuação e números.
- Remove do final, repetidamente, cidade, UF, país e sufixos societários (`LTDA`, `S/A`, `ME`, `EIRELI`).

```
"PAG*MCDONALDS 4521 SAO PAULO"  →  "MCDONALDS"
"PIX UBER DO BRASIL"            →  "UBER"
```

Números que fazem parte de uma marca (o `99` de `99 POP`) são preservados. A remoção de cidade para quando a string já é um alias conhecido, para que `DROGARIA SAO PAULO` não vire `DROGARIA`.

**2. Etapas de busca**

A primeira etapa que encontra uma única marca vence:

| Etapa | Exemplo | `confidence` |
| --- | --- | --- |
| Exato (com ou sem espaços) | `MERCADOLIVRE` = `MERCADO LIVRE` | `1` |
| Tokens do alias contidos no descritor | `IFOOD AGENCIA` contém `IFOOD` | `0.9` |
| Prefixo: nome truncado ou colado a ruído | `NETFLI`, `SPOTIFYBR` | `0.8` |
| Fuzzy (Jaro-Winkler ≥ limiar) | `MCDONLADS` | `0.5` a `0.75` |

Se duas marcas empatam em qualquer etapa, o resultado é `null`. Algumas proteções evitam falsos positivos:

- Palavras comuns como `TIM`, `OI` e `RAIA` são `strictAliases`: só casam quando são o descritor inteiro, então `TIM HORTONS` não vira TIM.
- O prefixo só conta quando o corte cai no meio de uma palavra: `DROGARIA` sozinho não é Drogaria São Paulo.
- Um alias colado a outro texto só casa se o que sobra for ruído conhecido: `APPLEBEES` não é Apple.
- O fuzzy exige strings com pelo menos 6 letras e de tamanho parecido.

Para aceitar só matches fortes, filtre por `confidence`. Por exemplo, `confidence >= 0.8` descarta o fuzzy.

## Dataset

Cada marca é uma pasta em [`brands/`](brands/):

```
brands/ifood/
├── brand.json      metadados e aliases (validado por schema/brand.schema.json)
├── logo.svg        logo principal
└── logo-dark.svg   opcional, para fundo escuro
```

```json
{
  "name": "iFood",
  "slug": "ifood",
  "website": "https://www.ifood.com.br",
  "category": "delivery",
  "colors": ["#EA1D2C"],
  "aliases": ["IFOOD", "IFOOD.COM", "IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.", "IFOOD CLUB"],
  "logoSource": "simple-icons@16.36.0 (ifood): https://ifood.com.br"
}
```

O seed tem 70 marcas: delivery, transporte, streaming, varejo, supermercados, farmácias, postos, telecom, bancos e fintechs. As logos vêm do [simple-icons](https://simpleicons.org) quando a marca existe lá. As demais estão marcadas com `"logoStatus": "missing"` e devolvem `logoUrl: null` até alguém contribuir um SVG de fonte confiável. Nenhuma logo é desenhada ou inventada.

## Qualidade

```bash
npm run accuracy
```

```
casos: 202 (153 com marca, 49 sem marca)
precisão: 99.4%  (mínimo 98.0%)
recall:   100.0%  (mínimo 85.0%)
```

Os casos ficam em [`fixtures/descriptors.json`](fixtures/descriptors.json) e incluem armadilhas que devem dar `null`: Pix para pessoa física, comércio local, homônimos como `TIM HORTONS` e `APPLEBEES`. O CI falha se precisão ou recall ficarem abaixo dos mínimos em [`fixtures/accuracy-thresholds.json`](fixtures/accuracy-thresholds.json).

> Estes números medem os fixtures, não o mundo real. Os descritores foram escritos à mão, seguindo padrões conhecidos de extratos, ao mesmo tempo que os aliases. Espere números menores em produção. A melhor contribuição é adicionar descritores reais (anonimizados) que hoje falham.

## Limitações

- **Cobertura:** 70 marcas nacionais. Comércio local, que é a maior parte das transações de cartão, sempre dá `null`, e isso é intencional.
- **Logos faltando:** várias marcas grandes (Itaú, Bradesco, Amazon, Mercado Livre…) ainda não têm SVG de fonte aberta. Elas devolvem nome, cor e categoria com `logoUrl: null`.
- **Adquirente não é marca:** um `MP*` sozinho, ou uma subadquirente que esconde o lojista, vira `null`, não Mercado Pago. Só reconhecemos a marca quando ela aparece no descritor.
- **CNPJ:** `cnpjRoots` existe no schema, mas o matching ainda não usa.
- **Fuzzy ainda erra:** `VIVO BAR` vira Vivo com `confidence: 0.57`. O caso está nos fixtures como erro conhecido. Use `confidence` para filtrar.
- **Sem contexto:** não usamos valor, MCC ou data da transação, só o texto.

## Contribuindo

Adicionar uma marca ou um alias leva poucos minutos e não exige saber TypeScript. Veja o [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

O código está sob a [licença MIT](LICENSE). As logos pertencem aos donos das marcas e são usadas apenas para identificação; veja o [LOGOS.md](LOGOS.md), que também explica como pedir remoção.
