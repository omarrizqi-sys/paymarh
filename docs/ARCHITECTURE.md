# Architecture de PaymaRH

Ce document décrit **comment PaymaRH est construit** et, surtout, **les six principes non négociables** qui régissent chaque ligne de code. Un choix technique qui contredit l'un de ces principes doit être refusé, quelle que soit sa commodité apparente.

---

## 1. Ce qu'est PaymaRH

Un logiciel de paie marocain pour le **secteur privé**, distribué en **SaaS multi-société**, avec deux publics :

- des **entreprises**, qui gèrent la paie de leurs propres salariés ;
- des **cabinets**, qui gèrent la paie de plusieurs sociétés clientes.

Cette dualité explique à elle seule la forme du modèle de données : un compte (_Account_) détient une ou plusieurs sociétés (_Company_).

---

## 2. Le stack technique

| Couche               | Technologie                 | Version au module 0   |
| -------------------- | --------------------------- | --------------------- |
| Langage              | TypeScript (mode strict)    | 6.0.x                 |
| Exécution            | Node.js LTS                 | 24.x                  |
| Paquets              | pnpm workspaces             | 11.x                  |
| Base de données      | PostgreSQL (Docker)         | 18                    |
| ORM                  | Prisma                      | 7.10                  |
| Backend              | NestJS (API REST, ESM)      | 12.x                  |
| Frontend             | Next.js + React (Turbopack) | 16.x / 19.x           |
| UI                   | Tailwind CSS + shadcn/ui    | 4.x                   |
| Tableaux             | TanStack Table              | 9.x                   |
| Calcul monétaire     | decimal.js                  | 10.x                  |
| Authentification     | Auth.js                     | _coquille désactivée_ |
| Stockage de fichiers | abstraction type S3         | _interface seule_     |
| Lint / Format        | ESLint + Prettier           | 10.x / 3.x            |
| Tests                | Vitest                      | 4.x                   |
| Imports circulaires  | madge                       | 8.x                   |

Tout est open source et gratuit.

---

## 3. La carte des couches

```
┌──────────────────────────────────────────────────────────────┐
│  INTERFACES (clients)                                        │
│                                                              │
│  back-office (Next.js)   portail salarié*   mobile*          │
│                          * n'existent pas encore             │
└───────────────────────────┬──────────────────────────────────┘
                            │  HTTP / JSON — lecture seule de la logique
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  API (NestJS) — SEULE DÉTENTRICE DE LA LOGIQUE               │
│                                                              │
│  common/tenancy   ← contexte + garde + patron de filtrage    │
│  common/audit     ← journalisation des actions sensibles     │
│  common/prisma    ← unique porte d'entrée vers la base       │
│                                                              │
│  modules/health   modules/accounts                           │
│  modules/companies   modules/users                           │
│                                                              │
│  payroll-engine   ← moteur PUR, sans accès base (vide)       │
│  deliverables     ← port de stockage d'objets (interface)    │
└───────────┬───────────────────────────────┬──────────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐      ┌────────────────────────────────┐
│  PostgreSQL           │      │  Stockage d'objets (type S3)   │
│  données structurées  │      │  documents finalisés — la base │
│                       │      │  n'en garde qu'une référence   │
└───────────────────────┘      └────────────────────────────────┘
```

Le sens de lecture est important : **les flèches ne remontent jamais**. L'API ne connaît pas ses clients, et le moteur de paie ne connaît ni l'API ni la base.

---

## 4. Les six principes fondateurs

### Principe 1 — API d'abord

Le backend **est** l'application. Le back-office d'aujourd'hui, le portail salarié et l'application mobile de demain ne sont que des **clients** de cette API.

Conséquence directe et absolue : **aucun calcul de paie ne vivra jamais dans le front.** Un montant affiché à l'écran a toujours été calculé par l'API. Le front ne fait ni addition, ni arrondi, ni proratisation — pas même « pour éviter un aller-retour ».

Pourquoi c'est vital : le jour où trois interfaces existeront, une logique dupliquée dans le front produirait trois résultats différents pour un même bulletin. En paie, c'est une faute.

_Où c'est visible dans le code :_ `apps/back-office/src/lib/api/health.ts` ne fait que lire et afficher. Le back-office n'a aucune dépendance vers une bibliothèque de calcul.

### Principe 2 — Moteur de paie pur et isolé

Le dossier `apps/api/src/payroll-engine/` contient un moteur conçu comme une **fonction pure** :

- on lui **passe** en entrée toutes les données nécessaires ;
- il **rend** un résultat ;
- il **n'accède jamais** à la base de données, ni au réseau, ni à l'horloge.

Ce sont les modules (`accounts`, `companies`, et demain les modules métier) qui lisent et écrivent les données. Le moteur, lui, se contente de calculer à partir de ce qu'on lui donne.

Pourquoi c'est vital : un calcul de paie doit être **reproductible**. On doit pouvoir rejouer le bulletin de mars 2026 dans deux ans et obtenir exactement le même résultat, pour un contrôle ou un contentieux. Un moteur qui va chercher lui-même ses données en base produirait un résultat dépendant de l'état de la base au moment du calcul — donc irreproductible.

_État au module 0 :_ le moteur est **vide**. Seul son contrat existe (`payroll-engine/contract.ts`), avec son README.

### Principe 3 — Double isolation multi-tenant

La hiérarchie est : **Account → Company → (Salarié, plus tard)**.

Toute requête de données est filtrée **d'abord par `accountId`, puis par `companyId`**. Ce n'est pas une recommandation, c'est un mécanisme :

- `common/tenancy/tenant-context.service.ts` transporte le contexte de la requête (qui, quel compte, quelle société) grâce à `AsyncLocalStorage`, pour qu'aucun service n'ait besoin de se le faire passer en paramètre — et donc ne puisse l'oublier ;
- `common/tenancy/tenant-scope.ts` construit les filtres. **Aucune requête Prisma du projet ne doit écrire son `where` à la main** : elle part toujours de `accountScope()` ou `companyScope()` ;
- `common/tenancy/tenant.guard.ts` refuse toute requête de données dépourvue de contexte.

Deux détails de conception qui comptent :

- **On échoue fermé.** Sans contexte, on ne lit rien. Il n'existe aucun repli silencieux vers une requête non filtrée. Si `accountScope()` renvoyait `{}` au lieu de lever une erreur, la requête Prisma remonterait les données de **tous** les comptes : c'est exactement le scénario que les tests de `tenant-scope.spec.ts` interdisent.
- **On répond 404, pas 403**, quand on demande une ressource appartenant à un autre compte. Répondre « interdit » révélerait l'existence de cette ressource chez un concurrent.

_Démonstration :_ `modules/companies` et `modules/users`, et les tests `apps/api/test/isolation-multi-tenant.spec.ts` (service) et `apps/api/test/isolation-http.spec.ts` (HTTP réel).

### Principe 4 — Super-admin séparé, hors hiérarchie

`PLATFORM_ADMIN` n'est **pas** un compte placé au-dessus des autres. C'est un rôle **distinct**, dont l'`accountId` est **nul par construction**.

Le filtrage par tenant reste la règle par défaut **pour tout le monde, y compris le super-admin**. Concrètement, un `PLATFORM_ADMIN` qui appelle `GET /societes` reçoit une **erreur 403** : il n'a pas de compte de rattachement, donc le chemin normal ne le mène nulle part. C'est voulu, et c'est vérifié par les tests.

Son accès élargi passe par un **chemin explicite, motivé et tracé** : la fonction `crossAccountScope(context, { reason, accountId })`, qui exige un motif, refuse tout autre rôle, et doit être accompagnée d'un appel à `AuditService.record()` dans le même flux.

Pourquoi c'est vital : dans un SaaS de paie, l'éditeur a techniquement accès aux salaires de milliers de personnes. La seule protection acceptable est que cet accès soit _impossible par accident_ et _toujours tracé quand il est délibéré_.

_État au module 0 :_ le rôle est modélisé, le chemin est figé, la table `AuditLog` existe. **Aucune interface d'administration n'est construite.**

### Principe 5 — Calcul monétaire en décimal exact

Aucun montant ne sera **jamais** calculé en virgule flottante (`number`, `float`, `double`).

- **En base :** type `Decimal` de Prisma (`NUMERIC` PostgreSQL).
- **En code :** `decimal.js`.

Pourquoi c'est vital : en virgule flottante, `0.1 + 0.2` vaut `0.30000000000000004`. Répercuté sur des cotisations et cumulé sur douze mois et des centaines de salariés, l'écart devient un litige avec la CNSS ou la DGI.

Ce principe est **outillé, pas seulement écrit** : la configuration ESLint interdit `parseFloat`, `Number.parseFloat` et `Math.round` avec un message explicite (voir `packages/config/eslint/base.js`).

_État au module 0 :_ il n'existe encore aucun montant, mais la règle et son garde-fou sont installés.

### Principe 6 — Livrables : un monde à part

Les documents finalisés (futurs bulletins PDF, états, déclarations) ne sont **pas** stockés en base. La base ne conserve qu'une **référence** vers un **stockage d'objets** de type S3.

Pourquoi c'est vital : stocker des PDF en base fait gonfler les sauvegardes, ralentit les restaurations et rend les migrations pénibles, pour un bénéfice nul.

_État au module 0 :_ `apps/api/src/deliverables/object-storage.port.ts` définit l'interface attendue (déposer, récupérer, référencer, signer une URL, supprimer) et un jeton d'injection. **Aucune implémentation concrète n'existe** : ni S3, ni MinIO, ni disque local.

---

## 5. Modèle de données au module 0

Uniquement le socle multi-tenant. **Aucune entité de paie.**

| Table      | Rôle                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| `Account`  | Le tenant : titulaire de l'abonnement (`CABINET` ou `ENTREPRISE`)        |
| `Company`  | La société dont on produira la paie ; appartient toujours à un `Account` |
| `User`     | Utilisateur ; `accountId` **nullable** (nul pour `PLATFORM_ADMIN`)       |
| `AuditLog` | Journal des actions sensibles                                            |

Enum `Role` : `PLATFORM_ADMIN`, `ACCOUNT_ADMIN`, `MANAGER`, `EMPLOYEE` (ce dernier prévu pour le futur portail salarié, non utilisé).

---

## 6. Ce qui n'existe volontairement pas

Rappel utile pour éviter de chercher ce qui n'a pas encore été construit :

- aucune entité ni logique de paie (bulletin, rubrique, cotisation, absence, déclaration) ;
- aucune authentification réelle — seulement une coquille Auth.js désactivée ;
- aucun portail salarié, aucune application mobile ;
- aucune interface d'administration de la plateforme ;
- aucune implémentation de stockage d'objets ;
- aucun article métier dans la base de connaissance.

---

## 7. Journal des décisions

Les choix figés et leurs raisons sont consignés dans [`docs/adr/`](./adr/). Toute décision d'architecture ultérieure doit y ajouter une entrée numérotée.
