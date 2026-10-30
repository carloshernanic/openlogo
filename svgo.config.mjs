// Configuração única do svgo, usada pelo CLI e por scripts/validate-svgs.ts.
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // role="img" + <title> deixam a logo acessível para leitores de tela.
          removeUnknownsAndDefaults: { keepRoleAttr: true },
        },
      },
    },
  ],
};
