module.exports = {
  forbidden: [
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
    { name: 'no-unresolved', severity: 'error', from: {}, to: { couldNotResolve: true } },
    {
      name: 'shared-packages-do-not-depend-on-apps', severity: 'error',
      from: { path: '^packages/' }, to: { path: '^(games|prototypes|tests)/' },
    },
    {
      name: 'core-and-logger-are-independent', severity: 'error',
      from: { path: '^packages/(core|logger)/' },
      to: { path: '^packages/(game-logic|renderer|ui)/|node_modules/(vue|@vue|pixi.js|@pixi|bitecs)/' },
    },
    {
      name: 'game-logic-has-no-presentation', severity: 'error',
      from: { path: '^packages/game-logic/' },
      to: { path: '^packages/(ui|renderer)/|node_modules/(vue|@vue|pixi.js|@pixi)/' },
    },
    {
      name: 'apps-are-independent', severity: 'error',
      from: { path: '^games/' }, to: { path: '^prototypes/' },
    },
    {
      name: 'prototypes-do-not-depend-on-games', severity: 'error',
      from: { path: '^prototypes/' }, to: { path: '^games/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^(dist/|(packages|games|prototypes)/[^/]+/dist/)|\\.test\\.ts$' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'types', 'default'] },
  },
};
