module.exports = {
  forbidden: [
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
    { name: 'no-unresolved', severity: 'error', from: {}, to: { couldNotResolve: true } },
    {
      name: 'packages-do-not-depend-on-applications', severity: 'error',
      from: { path: '^packages/' }, to: { path: '^(games|tests)/' },
    },
    {
      name: 'common-is-independent', severity: 'error',
      from: { path: '^packages/common/' },
      to: { path: '^packages/(game-logic|renderer|ui)/|node_modules/(vue|@vue|pixi.js|@pixi|bitecs)/' },
    },
    {
      name: 'game-logic-has-no-presentation', severity: 'error',
      from: { path: '^packages/game-logic/' },
      to: { path: '^packages/(ui|renderer)/|node_modules/(vue|@vue|pixi.js|@pixi)/' },
    },
    {
      name: 'presentation-does-not-own-gameplay', severity: 'error',
      from: { path: '^packages/(ui|renderer)/' },
      to: { path: '^packages/game-logic/|node_modules/bitecs/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^(dist/|(packages|games)/[^/]+/dist/)|\\.test\\.ts$' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'types', 'default'] },
  },
};
