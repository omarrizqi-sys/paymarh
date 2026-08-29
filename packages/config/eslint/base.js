// ---------------------------------------------------------------------------
// PaymaRH - Configuration ESLint partagee (format "flat config", ESLint 10).
//
// Cette configuration est la SEULE source de verite du lint pour tout le
// monorepo. Les applications l'importent depuis leur propre eslint.config.js
// et peuvent uniquement AJOUTER des regles specifiques a leur techno
// (ex. React pour le back-office), jamais desactiver le socle commun.
// ---------------------------------------------------------------------------
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Dossiers jamais analyses : code genere, dependances, artefacts de build.
 */
export const sharedIgnores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/generated/**',
  '**/*.d.ts',
];

/**
 * Socle commun applique a tout le TypeScript du depot.
 */
export const baseConfig = tseslint.config(
  { ignores: sharedIgnores },

  js.configs.recommended,

  // Regles TypeScript "strict" + "stylistic" en mode SANS analyse de types :
  // rapide, deterministe et suffisant au module 0. Le passage a un lint
  // type-aware fera l'objet d'une decision d'architecture dediee.
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,

  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Les imports de types doivent etre explicites : cela evite qu'un
      // import purement typographique survive a la compilation et cree une
      // fausse dependance circulaire detectee par madge.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Une variable inutilisee est une erreur, sauf si son nom commence par
      // un underscore (convention pour "volontairement ignore").
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // PRINCIPE FONDATEUR "calcul monetaire en decimal exact"
      // (voir docs/ARCHITECTURE.md et docs/CONVENTIONS.md).
      // La virgule flottante est bannie pour tout ce qui touche a un montant.
      // Ce garde-fou empeche l'usage accidentel des conversions flottantes.
      'no-restricted-globals': [
        'error',
        {
          name: 'parseFloat',
          message:
            'Interdit : aucun montant ne doit transiter par un flottant. Utilisez decimal.js (new Decimal(...)).',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Number',
          property: 'parseFloat',
          message:
            'Interdit : aucun montant ne doit transiter par un flottant. Utilisez decimal.js (new Decimal(...)).',
        },
        {
          object: 'Math',
          property: 'round',
          message:
            'Interdit sur les montants : utilisez les modes d arrondi de decimal.js, explicites et testables.',
        },
      ],

      // console.log oublie en production = bruit. warn/error restent permis.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  // Les fichiers de configuration et les scripts d outillage ont le droit
  // d ecrire sur la sortie standard et d utiliser require().
  {
    files: [
      '**/*.config.{js,mjs,cjs,ts,mts}',
      '**/prisma/**/*.ts',
      '**/scripts/**/*.ts',
      '**/*.setup.ts',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Fichiers de test : on tolere les assertions non nulles, indispensables
  // pour ecrire des tests lisibles.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },

  // TOUJOURS EN DERNIER : neutralise les regles de style qui entreraient en
  // conflit avec Prettier. Prettier est seul maitre du formatage.
  eslintConfigPrettier
);

export default baseConfig;
