# Conventions de code

Ces conventions ne sont pas des préférences esthétiques : chacune existe pour éviter un problème concret. Elles s'appliquent à tout le dépôt.

---

## 1. Nommage mixte : anglais technique, français réglementaire

C'est la règle la plus importante à comprendre, et la plus facile à enfreindre par réflexe.

**Les identifiants techniques sont en anglais.** Tout ce qui relève de l'informatique : `id`, `createdAt`, `findAll`, `TenantContext`, `accountId`, `HealthResponse`.

**Les termes métier réglementaires marocains restent en français, jamais traduits :**

| À écrire                | À ne jamais écrire   |
| ----------------------- | -------------------- |
| `salarie`               | `employee`           |
| `bulletin`              | `payslip`            |
| `cotisationCNSS`        | `socialContribution` |
| `cotisationAMO`         | `healthInsurance`    |
| `IR`                    | `incomeTax`          |
| `declaration`           | `filing`             |
| `anciennete`            | `seniority`          |
| `indemniteLicenciement` | `severancePay`       |

Pourquoi : `cotisationCNSS` désigne une réalité réglementaire marocaine précise, avec ses taux, ses plafonds et ses exonérations. « socialContribution » ne désigne rien. Traduire un terme réglementaire, c'est perdre le lien avec le texte de loi qui le définit, et rendre impossible toute relecture par un expert-comptable.

**Les commentaires sont en français**, y compris dans le code technique. Le porteur du projet doit pouvoir relire et comprendre.

> Note : les identifiants sont écrits **sans accent** (`salarie`, pas `salarié`) pour éviter tout problème d'encodage entre systèmes. Le **contenu rédactionnel** (commentaires, documentation, articles) utilise le français accentué normal.

---

## 2. Calcul monétaire : décimal exact, jamais de flottant

**Aucun montant ne transite jamais par un `number`.**

```ts
// INTERDIT — la virgule flottante est imprécise
const brut = 12000.5;
const cotisation = brut * 0.0448;

// CORRECT — decimal.js
import Decimal from 'decimal.js';

const brut = new Decimal('12000.50');
const cotisationCNSS = brut.times('0.0448');
```

- **En base :** type `Decimal` de Prisma, qui produit un `NUMERIC` PostgreSQL.
- **En code :** `decimal.js`.
- **Aux frontières** (JSON, saisie utilisateur) : les montants circulent en **chaîne de caractères**, jamais en nombre, pour qu'aucune conversion flottante ne s'insère silencieusement.
- **Les arrondis sont explicites** : on utilise les modes d'arrondi de `decimal.js`, jamais `Math.round`.

Pourquoi : `0.1 + 0.2 === 0.30000000000000004`. Sur une paie, cet écart se cumule et finit en litige avec la CNSS ou la DGI.

**Ce n'est pas qu'une consigne** : ESLint refuse `parseFloat`, `Number.parseFloat` et `Math.round` avec un message explicite (voir `packages/config/eslint/base.js`).

---

## 3. Filtrage par tenant sur chaque requête

Toute lecture ou écriture de données part d'une fonction de `apps/api/src/common/tenancy/tenant-scope.ts`.

```ts
// INTERDIT — le `where` est écrit à la main, rien ne garantit l'isolation
const societes = await this.prisma.company.findMany({
  where: { name: { contains: recherche } },
});

// CORRECT — le filtre par compte fait partie de la requête
const societes = await this.prisma.company.findMany({
  where: { ...accountScope(context), name: { contains: recherche } },
});
```

Trois règles qui en découlent :

1. **Toujours `findFirst` plutôt que `findUnique` lorsqu'on cherche par identifiant.** `findUnique({ id })` ne peut pas accueillir le filtre par compte : on retrouverait la ressource d'autrui avant de pouvoir la refuser.
2. **Répondre 404, pas 403**, pour une ressource appartenant à un autre compte. « Interdit » révélerait son existence.
3. **Tout nouveau contrôleur qui touche à des données** doit porter `@UseGuards(TenantGuard)` et être déclaré dans le middleware de `app.module.ts`.

---

## 4. Imports ESM : l'extension `.js` dans l'API

**Cette règle ne concerne que `apps/api`.**

NestJS 12 est distribué uniquement en ESM, donc l'API est un paquet ESM (`"type": "module"`). En ESM, Node exige que **tout import relatif porte une extension de fichier**. Et cette extension est celle du fichier **compilé** (`.js`), pas celle du fichier source (`.ts`).

```ts
// apps/api — CORRECT
import { HealthService } from './health.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

// apps/api — INCORRECT : Node refusera de démarrer
import { HealthService } from './health.service';
```

**Oui, le fichier sur le disque s'appelle bien `health.service.ts`.** On écrit `.js` parce qu'on désigne le fichier tel qu'il existera après compilation. C'est déroutant la première fois ; c'est la norme ESM.

Deux exceptions, où l'on n'écrit **pas** d'extension :

- les **paquets npm** : `import { Injectable } from '@nestjs/common';`
- le **back-office** : Next.js utilise un empaqueteur (`moduleResolution: "Bundler"`), qui résout les imports sans extension. On y écrit `import { cn } from '@/lib/utils';`

Le raisonnement de ce choix est consigné dans [`adr/0002-modules-esm.md`](./adr/0002-modules-esm.md).

---

## 5. Types partagés : définis une seule fois

La forme d'un `Account`, d'une `Company`, d'un `User` est définie **exclusivement** dans `packages/shared-types`. Ni l'API ni le back-office ne la redéclarent.

Si un type doit changer, il change à un seul endroit, et TypeScript signale immédiatement tous les appelants concernés.

---

## 6. Nommage des fichiers et des dossiers

**Fichiers et dossiers techniques : minuscules, tirets, sans accent ni majuscule.**

```
CORRECT                              INCORRECT
tenant-context.service.ts            TenantContextService.ts
base-de-connaissance/                Base de Connaissance/
calcul-anciennete.ts                 calculAncienneté.ts
```

Pourquoi : Windows ne distingue pas la casse, Linux si. Un fichier importé sous un nom et enregistré sous un autre fonctionne sur la machine du développeur et casse en production. Les accents, eux, provoquent des problèmes d'encodage entre systèmes.

**Suffixes NestJS** (imposés par le framework) : `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.guard.ts`, `*.middleware.ts`, `*.spec.ts`.

**Seules exceptions en majuscules :** les fichiers de documentation à la racine ou dans `docs/` (`README.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`), par convention universelle.

---

## 7. Structure des dossiers

```
apps/api/src/
├── common/            infrastructure transverse (tenancy, audit, prisma)
├── modules/           un dossier par domaine fonctionnel
│   └── <domaine>/     <domaine>.module.ts + .controller.ts + .service.ts
├── payroll-engine/    moteur pur — aucune I/O, jamais
└── deliverables/      port de stockage d'objets
```

- **Un fichier, une responsabilité.** Si un service dépasse ~200 lignes, il faut le découper.
- **Pas d'import circulaire.** `pnpm check:circular` le vérifie ; le script doit rester vert.
- **`common/` ne dépend jamais de `modules/`.** L'inverse est normal.

---

## 8. TypeScript strict

Le mode strict est activé partout, avec en plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns` et `noFallthroughCasesInSwitch`.

- **`any` est interdit.** Utiliser `unknown` puis restreindre par une vérification explicite (voir `estHealthResponse()` dans le back-office pour un exemple).
- **Les données venant de l'extérieur sont validées**, jamais supposées conformes : `class-validator` côté API, garde de type côté front.

---

## 9. Commentaires

On commente **pourquoi**, pas **quoi**.

```ts
// INUTILE — le code le dit déjà
// Incrémente le compteur
compteur += 1;

// UTILE — explique une contrainte invisible
// `findFirst` et non `findUnique` : on veut que le filtre par compte fasse
// partie de la recherche elle-même. Avec `findUnique({ id })`, on trouverait
// la société d'un AUTRE compte avant de pouvoir la refuser.
```

Les décisions contre-intuitives, les contraintes réglementaires et les pièges méritent toujours un commentaire. Le reste, non.

---

## 10. Tests

- Un lanceur unique : **Vitest**, depuis la racine (`pnpm test`).
- Les tests vivent **à côté du code** qu'ils vérifient (`*.spec.ts`), sauf les tests transverses, placés dans `apps/api/test/`.
- **Ce qui doit impérativement être testé :** tout ce qui touche à l'isolation multi-tenant et, à l'avenir, tout calcul de paie. Ce sont les deux endroits où une régression est grave.
- On privilégie l'instanciation directe des classes plutôt que le conteneur d'injection : les tests restent rapides et ne dépendent d'aucune infrastructure.

---

## 11. Git

- Une branche par module : `module-1-fiches`, `module-2-traitement-du-mois`…
- Messages de commit à l'impératif, en français : `Ajoute le filtrage par société sur les fiches`.
- **Le fichier `.env` n'est jamais versionné.** Seul `.env.example`, avec des valeurs factices, l'est.
