# Contribuindo com o OpenLogo

Obrigado por ajudar! A maior parte das contribuições é só dado: um `brand.json`, um alias ou um descritor de teste. Você não precisa mexer em TypeScript.

## Preparando o ambiente

```bash
git clone https://github.com/carloshernanic/openlogo.git
cd openlogo
npm install        # também instala o hook que valida mensagens de commit
npm test
```

Antes de abrir o PR, rode o mesmo que o CI:

```bash
npm run validate   # brand.json + SVGs
npm test
npm run accuracy
```

## Adicionar uma marca

1. Crie a pasta `brands/<slug>/`. O slug usa só letras minúsculas, números e hífen (`drogaria-sao-paulo`, `c6-bank`).
2. Crie o `brand.json`:

   ```json
   {
     "$schema": "../../schema/brand.schema.json",
     "name": "Drogaria São Paulo",
     "slug": "drogaria-sao-paulo",
     "website": "https://www.drogariasaopaulo.com.br",
     "category": "pharmacy",
     "colors": ["#E30613"],
     "aliases": ["DROGARIA SAO PAULO", "DROGARIASAOPAULO"],
     "logoStatus": "missing"
   }
   ```

   | Campo | Regra |
   | --- | --- |
   | `name` | Nome que o usuário reconhece. Também vira alias. |
   | `slug` | Igual ao nome da pasta. |
   | `website` | Site oficial, com `https://`. |
   | `category` | Um dos valores do [schema](schema/brand.schema.json): `bank`, `delivery`, `fintech`, `food`, `fuel`, `pharmacy`, `retail`, `streaming`, `supermarket`, `telecom`, `transport`, `travel`… |
   | `colors` | Hex em maiúsculas (`#EA1D2C`). A primeira é a cor principal. |
   | `aliases` | Como a marca aparece em extratos (veja abaixo). |
   | `strictAliases` | Opcional. Aliases que são palavras comuns e só podem casar com o descritor inteiro. |
   | `cnpjRoots` | Opcional. Os 8 primeiros dígitos do CNPJ da empresa. |
   | `logoStatus` | `"missing"` enquanto não houver `logo.svg`. |
   | `logoSource` | De onde veio o SVG. |

3. Adicione a logo (veja abaixo) ou deixe `"logoStatus": "missing"`.
4. Coloque pelo menos um descritor da marca em `fixtures/descriptors.json`.
5. Rode `npm run validate && npm test && npm run accuracy`.

## Logos

**Nunca desenhe, vetorize ou "aproxime" uma logo.** Use só fontes verificáveis e registre a origem em `logoSource`. Se não houver fonte, deixe `"logoStatus": "missing"`: devolver `logoUrl: null` é melhor que uma logo errada.

**Se a marca está no simple-icons:**

```bash
npm run import:icon -- <slug-da-marca> <slug-no-simple-icons>
```

O script copia o SVG, aplica a cor oficial e gera uma `logo-dark.svg` branca quando a cor é escura demais para fundo escuro. Ele também preenche `logoSource` e remove `logoStatus`.

> **Confira o título impresso.** O mesmo nome pode ser outra empresa: no simple-icons, `vivo` é a fabricante chinesa de celulares (não a operadora) e `max` é um software de música (não o streaming).

**Se o SVG vem de outra fonte**, como o kit de imprensa oficial ou o Wikimedia Commons com licença clara:

- Salve como `logo.svg` (e, opcionalmente, `logo-dark.svg`).
- Preencha `logoSource` com a URL.
- Rode `npm run validate:svgs -- --fix` para otimizar.

O CI rejeita SVGs com `<script>`, atributos de evento, `<image>` ou raster embutido, `data:` URIs, links externos, ou que não estejam otimizados pelo svgo. A pasta da marca só pode ter `brand.json`, `logo.svg` e `logo-dark.svg`.

## Adicionar um alias visto no extrato (sem vazar dados pessoais)

Viu uma transação que não foi reconhecida? Ótimo, é exatamente o que precisamos. Mas um extrato tem dados pessoais, então **copie só a parte que identifica a empresa**.

Por exemplo, num Pix:

```
PIX ENVIADO 30/10 123.456.789-09 JOAO DA SILVA     ← nunca cole isso
```

Num cartão:

```
PAG*PADARIAPAOQUENTE 4521 SAO PAULO BR             ← lojista pequeno: não é marca, não adicione
COMPRA CARTAO 1234 DROGASIL 1234 RIO DE JANEIRO    ← só "DROGASIL" importa
```

Regras:

- **Nunca** inclua CPF, CNPJ completo, nome de pessoa física, número de cartão, agência, conta, data ou valor.
- Pix e TED para pessoas físicas não são marca. Não adicione.
- Remova números de loja, terminal e autorização. A normalização já ignora números, então eles não ajudam.
- Prefixos de adquirente (`PAG*`, `MP*`, `IFD*`) e cidade/UF no final já são removidos automaticamente. Não precisa repeti-los no alias.
- Prefira a forma mais específica que aparece no extrato: `NU PAGAMENTOS` em vez de só `NU`.
- Palavras comuns (`TIM`, `OI`, `VIVO`, `RAIA`) vão em `strictAliases`, nunca em `aliases`. Senão `TIM HORTONS` viraria TIM.
- Um alias não pode pertencer a duas marcas. O CI compara os aliases depois de normalizados.

O CI recusa aliases que pareçam CPF, CNPJ, uma sequência longa de dígitos ou um nome de pessoa (prenome comum + sobrenomes). Essas heurísticas são uma rede de proteção, não substituem o seu cuidado.

Para conferir o que o matching vê:

```bash
npx tsx -e "import { normalize, resolve } from './src/index.ts'; const d = 'SEU DESCRITOR'; console.log(normalize(d), resolve(d))"
```

E adicione o caso em `fixtures/descriptors.json`, inclusive os que devem dar `null`:

```json
{ "descriptor": "DROGASIL 1234 RIO DE JANEIRO RJ", "expectedSlug": "drogasil" },
{ "descriptor": "DROGARIA DO ZE SAO PAULO", "expectedSlug": null }
```

## Mudanças no código

O código fica em `src/` e é pequeno de propósito:

| Arquivo | O que faz |
| --- | --- |
| `normalize.ts` | Limpa o descritor. As listas ficam em `data/noise.ts`. |
| `match.ts` | Etapas exato → tokens → prefixo → fuzzy. |
| `jaro-winkler.ts` | Similaridade usada no fuzzy. |
| `resolver.ts` | Monta o `Match` a partir do índice. |
| `index.ts` | API pública. |

O índice (`src/generated/`) é gerado por `scripts/build-index.ts`. Ele roda sozinho antes de `test`, `build`, `typecheck` e `accuracy` e não é commitado.

Regras:

- TypeScript estrito e zero dependências em runtime.
- Toda mudança de comportamento vem com teste.
- Se a mudança afeta o matching, rode `npm run accuracy`. O CI falha se precisão ou recall caírem abaixo do mínimo. Não abaixe o mínimo para fazer um PR passar.

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/), validados pelo commitlint no hook local e no CI. Mensagens em português, no imperativo, curtas:

```
<tipo>(<escopo opcional>): <descrição>
```

| Tipo | Quando |
| --- | --- |
| `feat` | Nova funcionalidade ou novas marcas |
| `fix` | Correção de bug ou de dado errado |
| `test` | Testes e fixtures |
| `docs` | Documentação |
| `refactor` | Mudança de código sem mudar comportamento |
| `build` | Build, dependências, geração do índice |
| `ci` | GitHub Actions |
| `chore` | Manutenção geral |
| `style` | Formatação, otimização de SVG |

Exemplos:

```
feat(brands): adiciona drogaria pacheco
fix(brands): corrige cor principal do nubank
feat(brands): adiciona alias NU PAGAMENTOS ao nubank
fix(matching): evita match de prefixo com palavra genérica
test(fixtures): adiciona descritores de postos
```

Faça commits pequenos, e que cada um passe nos testes. Revise o que está entrando (`git status`, `git diff --staged`) e não commite `node_modules`, `dist` ou `src/generated`.

## Remoção de marca

Se você representa uma marca e quer que ela seja removida, veja o [LOGOS.md](LOGOS.md).
