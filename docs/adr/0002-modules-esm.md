# ADR 0002 — L'API est un paquet ESM, avec extensions `.js` dans les imports

- **Statut :** accepté
- **Date :** 2026-08-29
- **Portée :** `apps/api`
- **Complète :** [ADR 0001 — Fondations techniques](./0001-fondations.md), décision 3

---

## Contexte

JavaScript a deux systèmes de modules qui coexistent :

- **CommonJS (CJS)**, historique. Les imports relatifs s'écrivent sans extension : `import { HealthService } from './health.service'`. C'est ce qu'on voit dans la quasi-totalité de la documentation et des tutoriels NestJS.
- **ESM**, la norme officielle de JavaScript, vers laquelle l'écosystème Node converge. Elle exige une **extension explicite** dans les chemins relatifs.

Au moment de poser les fondations, **NestJS 12 — la version majeure courante — n'est distribué qu'en ESM** (`"type": "module"` dans son `package.json`). Il est donc impossible de l'utiliser depuis un projet CommonJS : la compilation échoue avec l'erreur `TS1479: the referenced file is an ECMAScript module and cannot be imported with 'require'`.

Deux options s'offraient donc :

- **A.** NestJS 12 + ESM, avec l'extension `.js` sur chaque import relatif.
- **B.** NestJS 11, dernière version CommonJS, encore maintenue.

---

## Décision

**Option A : NestJS 12 et ESM.**

`apps/api/package.json` déclare `"type": "module"`, et tout import relatif de l'API porte l'extension `.js` :

```ts
// apps/api/src/modules/health/health.controller.ts
import { HealthService } from './health.service.js';
```

Le fichier réel est `health.service.**ts**`. On écrit `.js` parce que l'extension désigne le fichier **compilé**, tel qu'il existera dans `dist/` à l'exécution. TypeScript comprend cette convention et va chercher le `.ts` correspondant pendant la compilation.

### Pourquoi ESM plutôt que NestJS 11

**Le projet est neuf, sans historique.** Le coût de la convention se paie aujourd'hui sur une vingtaine de fichiers. Dans deux ans, la même migration porterait sur plusieurs centaines de fichiers, dans un code métier chargé de règles de paie qu'on n'a pas envie de perturber.

**La migration serait inévitable.** Rester sur NestJS 11 ne supprime pas le problème, il le reporte : passer un jour à NestJS 12 ou 13 imposera de toute façon le passage à ESM.

**ESM est la norme.** C'est ce que produit l'écosystème pour les nouveaux paquets, et rester en CommonJS conduit progressivement à des dépendances inutilisables.

**Rester sur la version majeure courante** garantit l'accès aux correctifs de sécurité et à la documentation à jour — ce qui compte particulièrement pour un projet piloté par IA, dont la qualité d'assistance suit la version majoritairement documentée.

### Ce que le choix coûte

L'extension `.js` sur un fichier `.ts` est **déroutante à la lecture**. C'est le vrai inconvénient, et il ne disparaîtra pas. Il est compensé de trois façons :

1. La règle est écrite noir sur blanc dans [`CONVENTIONS.md`](../CONVENTIONS.md) §3, avec exemples corrects et incorrects.
2. L'oubli est détecté **immédiatement** : le code ne compile pas, avec un message qui indique le fichier fautif.
3. La règle est simple et sans exception à l'intérieur de l'API : _tout import relatif porte `.js`_.

---

## Périmètre : où la règle s'applique, et où elle ne s'applique pas

| Emplacement                  | Extension ?                       | Pourquoi                                                       |
| ---------------------------- | --------------------------------- | -------------------------------------------------------------- |
| `apps/api`, imports relatifs | **Oui** — `'./health.service.js'` | Paquet ESM exécuté directement par Node                        |
| `apps/api`, paquets npm      | Non — `'@nestjs/common'`          | Ce ne sont pas des chemins relatifs                            |
| `apps/back-office`           | **Non** — `'@/lib/utils'`         | Next.js utilise un bundler, qui résout les extensions lui-même |
| `packages/shared-types`      | **Oui** — `'./common.js'`         | Compilé pour Node, même contrainte que l'API                   |

---

## Conséquences techniques

**`__dirname` et `__filename` n'existent pas en ESM.** On utilise `import.meta.dirname` (disponible depuis Node 20.11, donc largement couvert par le Node 24 LTS du projet). C'est le cas dans `app.module.ts`, `prisma.config.ts` et `prisma/seed.ts`.

**Le client Prisma est généré en ESM** : `moduleFormat = "esm"` dans le bloc `generator` de `schema.prisma`.

**La configuration TypeScript utilise `module: "Node16"` et `moduleResolution: "Node16"`**, qui remplacent l'ancien couple `CommonJS`/`node10`, déprécié depuis TypeScript 6.

**Les outils suivent sans configuration particulière.** Vitest résout correctement un import `./health.service.js` vers le fichier `.ts`. `nest build` et `nest start --watch` fonctionnent normalement.

**Une règle ESLint a dû être désactivée sur `apps/api`** : `@typescript-eslint/consistent-type-imports`. Elle proposait de transformer `import { PrismaService }` en `import type { PrismaService }`, ce qui effacerait l'import à la compilation et **casserait l'injection de dépendances de NestJS**, qui lit les types des paramètres de constructeur à l'exécution. La règle reste active partout ailleurs.

---

## Réexamen

Cette décision sera réexaminée si NestJS revenait à une distribution double CJS/ESM, ou si Node autorisait un jour les imports relatifs sans extension en ESM. Aucune de ces deux évolutions n'est annoncée.
