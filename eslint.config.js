// ---------------------------------------------------------------------------
// PaymaRH - Point d entree ESLint du monorepo.
//
// Une seule configuration lint tout le depot (`pnpm lint`). Le socle commun
// vit dans packages/config/eslint/base.js ; on n ajoute ici que ce qui est
// specifique a un emplacement (ex. les globales du navigateur pour le front).
// ---------------------------------------------------------------------------
import globals from 'globals';
import { baseConfig } from '@paymarh/config/eslint';

export default [
  ...baseConfig,

  {
    // Le back-office s execute (aussi) dans le navigateur : il a besoin des
    // globales DOM (window, document, fetch...) en plus de celles de Node.
    files: ['apps/back-office/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
  },

  {
    // --- Specificites NestJS -------------------------------------------
    files: ['apps/api/**/*.ts'],
    rules: {
      // ATTENTION, REGLE VOLONTAIREMENT DESACTIVEE ICI.
      //
      // NestJS injecte ses dependances en lisant, A L EXECUTION, le type des
      // parametres du constructeur (emitDecoratorMetadata). Transformer
      // `import { PrismaService }` en `import type { PrismaService }`
      // effacerait l import a la compilation : l injection echouerait au
      // demarrage, avec un message obscur.
      //
      // La regle reste active partout ailleurs (back-office, packages).
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  {
    // Un module NestJS est, par construction, une classe vide : toute son
    // information est portee par le decorateur @Module. C est l idiome du
    // framework, pas une maladresse.
    files: ['apps/api/**/*.module.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },

  {
    // Le point d entree de l API et le script de seed affichent volontairement
    // des messages de demarrage sur la sortie standard.
    files: ['apps/api/src/main.ts', 'apps/api/prisma/seed.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
