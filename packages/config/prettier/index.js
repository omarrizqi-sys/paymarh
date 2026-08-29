// ---------------------------------------------------------------------------
// PaymaRH - Configuration Prettier partagee.
// Prettier est le SEUL responsable du formatage du code : aucune regle de
// style ne doit etre dupliquee dans ESLint (voir eslint/base.js).
// ---------------------------------------------------------------------------

/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  overrides: [
    {
      // Les articles de la base de connaissance et la documentation sont
      // rediges a la main : on preserve les retours a la ligne de l auteur.
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'preserve',
      },
    },
  ],
};

export default config;
