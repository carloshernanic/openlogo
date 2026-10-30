# Logos e marcas

## As logos não são nossas

Todas as logos, nomes e cores em `brands/` são marcas registradas ou de propriedade de seus respectivos donos. O OpenLogo não tem nenhuma relação com essas empresas, nem é endossado, patrocinado ou afiliado a elas.

A [licença MIT](LICENSE) deste repositório vale para o código, os scripts, o schema e os metadados. **Ela não vale para as logos.**

## Uso apenas para identificação

As logos estão aqui com um único propósito: **identificar visualmente a empresa** com quem uma transação foi feita, ao lado do descritor do extrato. É o mesmo uso que bancos e apps de finanças já fazem.

Se você usa o OpenLogo:

- Use as logos só para identificar a marca correspondente à transação.
- Não use as logos para sugerir parceria, patrocínio ou endosso.
- Não altere as logos além de redimensionar.
- Siga as diretrizes de marca de cada empresa quando elas existirem.
- Você é responsável por avaliar se o seu uso é adequado na sua jurisdição.

## De onde vêm as logos

Nenhuma logo deste repositório foi desenhada ou recriada por nós.

- **simple-icons:** a maioria vem do projeto [simple-icons](https://github.com/simple-icons/simple-icons), que distribui os SVGs sob [CC0 1.0](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md) e mantém a fonte de cada ícone. O SVG original é monocromático. Aplicamos a cor oficial que o próprio simple-icons informa e, quando essa cor é escura demais, geramos uma versão branca do mesmo desenho para fundo escuro. O CC0 cobre o arquivo, não a marca: as observações do simple-icons sobre [marcas registradas](https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md) continuam valendo.
- **Outras fontes:** marcas que não estão no simple-icons só ganham logo de fontes verificáveis, como kits de imprensa oficiais ou arquivos com licença clara.

A origem de cada logo fica registrada no campo `logoSource` do `brand.json` da marca. Marcas sem fonte confiável ficam com `"logoStatus": "missing"` e não têm logo.

## Pedido de remoção ou correção

Qualquer dono de marca, ou representante autorizado, pode pedir a **remoção** ou a **correção** (logo desatualizada, cor errada, nome errado) da sua marca.

1. Abra uma [issue](https://github.com/carloshernanic/openlogo/issues/new) com o título `Remoção: <nome da marca>` ou `Correção: <nome da marca>`.
2. Informe o slug ou o nome da marca e o que deve ser feito.
3. Se puder, indique um contato oficial ou outra forma de confirmar que você representa a marca.

Pedidos de remoção são atendidos sem questionamento. A marca sai de `brands/` no próximo release.

Releases antigos já publicados continuam acessíveis no npm e no jsDelivr pela tag da versão. Podemos pedir ao jsDelivr o expurgo do cache, mas não controlamos cópias que terceiros tenham feito.
