import { defineConfig } from 'vitest/config';

// ---------------------------------------------------------------------------
// PaymaRH - Un SEUL lanceur de tests pour tout le monorepo.
//
// `pnpm test` a la racine execute les tests de toutes les applications et de
// tous les packages. Chaque "project" ci-dessous correspond a un espace de
// travail : les tests restent ranges pres du code qu ils verifient.
//
// @paymarh/shared-types n a pas de projet de test : il ne contient QUE des
// types, effaces a la compilation, donc rien d executable a tester. Sa
// justesse est verifiee par `pnpm typecheck`.
// ---------------------------------------------------------------------------
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'api',
          root: './apps/api',
          environment: 'node',
          include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'back-office',
          root: './apps/back-office',
          environment: 'node',
          include: ['src/**/*.spec.{ts,tsx}'],
        },
      },
    ],
  },
});
