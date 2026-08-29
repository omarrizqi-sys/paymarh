import type { NextConfig } from 'next';

/**
 * Configuration du back-office PaymaRH.
 *
 * Turbopack est le compilateur utilise en developpement ET pour le build
 * (voir les scripts `dev` et `build` de package.json). C est un choix fige
 * du module 0 : voir docs/adr/0001-fondations.md.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Next.js genere par defaut des fichiers AGENTS.md / CLAUDE.md de consignes
  // generiques pour les IA. On les desactive : la source de verite du projet
  // est docs/CONVENTIONS.md, et des consignes generiques pourraient la
  // contredire (regle des imports .js, filtrage multi-tenant obligatoire...).
  agentRules: false,

  // @paymarh/shared-types est publie en TypeScript source (il ne contient que
  // des types). On demande a Next de le transpiler comme le reste du projet.
  transpilePackages: ['@paymarh/shared-types'],

  typescript: {
    // Aucune tolerance : un build ne doit jamais masquer une erreur de type.
    ignoreBuildErrors: false,
  },

  // A noter : Next.js 16 ne pilote plus ESLint depuis ce fichier. Le lint est
  // lance separement sur tout le monorepo (`pnpm lint`), avec une
  // configuration unique. On evite ainsi deux sources de verite.
};

export default nextConfig;
