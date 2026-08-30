# `@paymarh/api` — l'API PaymaRH

## Rôle

Cette application **est** PaymaRH. Elle détient la totalité de la logique : règles de paie, accès aux données, contrôles d'isolation, journalisation.

Le back-office d'aujourd'hui, le portail salarié et l'application mobile de demain ne sont que des **clients** de cette API. C'est le principe 1 de l'architecture, et il n'a pas d'exception : **aucun calcul de paie ne vivra jamais dans une interface.**

---

## Démarrage

Depuis la **racine du dépôt** :

```bash
pnpm db:up        # PostgreSQL dans Docker
pnpm db:migrate   # crée les tables (la première fois)
pnpm db:seed      # données de démonstration (la première fois)
pnpm dev:api      # démarre l'API sur http://localhost:3001
```

Vérification : <http://localhost:3001/health> doit répondre

```json
{ "status": "ok", "timestamp": "…", "version": "0.1.0" }
```

---

## Structure

```
src/
├── main.ts                    point d'entrée : CORS, validation, écoute
├── app.module.ts              assemblage des modules + pose du middleware de tenant
│
├── common/                    mécanismes transversaux
│   ├── prisma/                unique porte d'entrée vers PostgreSQL
│   ├── tenancy/               isolation multi-tenant (voir ci-dessous)
│   └── audit/                 journalisation des actions sensibles
│
├── modules/                   un dossier par domaine
│   ├── health/                GET /health — le témoin que l'API tourne
│   ├── accounts/              GRAINE — comptes (tenants)
│   ├── companies/             GRAINE — sociétés
│   └── users/                 GRAINE — utilisateurs et rôles
│
├── payroll-engine/            MOTEUR DE PAIE — pur, isolé, VIDE au module 0
├── deliverables/              port de stockage d'objets — interface seule
└── generated/prisma/          client Prisma généré (non versionné)

prisma/
├── schema.prisma              modèle de données
├── migrations/                migrations SQL (versionnées, jamais modifiées à la main)
└── seed.ts                    données de démonstration
```

Les modules `accounts`, `companies` et `users` sont des **graines** : ils existent pour porter et démontrer le socle multi-tenant sur de vraies tables, pas pour faire de la paie. Ils sont volontairement en lecture seule.

---

## Le cœur : l'isolation multi-tenant

Trois fichiers de `common/tenancy/` font tout le travail. Il faut les avoir lus avant d'écrire une requête de données.

| Fichier                     | Rôle                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant-context.service.ts` | Transporte le contexte de la requête (qui, quel compte, quelle société) via `AsyncLocalStorage`, pour que personne n'ait à le passer en paramètre — ni à oublier de le faire |
| `tenant-scope.ts`           | **Le cœur.** Fonctions pures qui construisent les filtres. Aucune requête Prisma ne doit écrire son `where` à la main                                                        |
| `tenant.guard.ts`           | Refuse toute requête de données dépourvue de contexte                                                                                                                        |

```ts
// La forme à reproduire, systématiquement
const societes = await this.prisma.company.findMany({
  where: accountScope(context),
});
```

Deux comportements qui surprennent et qui sont **volontaires** :

- **Un `PLATFORM_ADMIN` reçoit une erreur 403** sur les routes normales. Il n'a pas de compte de rattachement : le chemin normal ne le mène nulle part. Son accès élargi passe par `crossAccountScope()`, qui exige un motif et une journalisation.
- **Une ressource appartenant à un autre compte renvoie 404, pas 403.** Répondre « interdit » révélerait son existence.

---

## Routes disponibles au module 0

| Route                | Garde         | Description                                       |
| -------------------- | ------------- | ------------------------------------------------- |
| `GET /health`        | aucune        | Témoin de santé. Ne lit ni la base ni le contexte |
| `GET /accounts/me`   | `TenantGuard` | Le compte de l'utilisateur courant                |
| `GET /societes`     | `TenantGuard` | Les sociétés de son compte                        |
| `GET /societes/:id` | `TenantGuard` | Une société de son compte                         |
| `GET /users`         | `TenantGuard` | Les utilisateurs de son compte                    |
| `GET /users/me`      | `TenantGuard` | L'utilisateur courant                             |

### Interroger les routes protégées

Le module 0 n'a **aucune authentification**. Un en-tête de développement tient lieu d'identité :

```bash
curl http://localhost:3001/societes \
  -H "x-paymarh-user-id: <identifiant affiché par pnpm db:seed>"
```

> **Ce n'est pas de l'authentification.** Le rôle et le compte ne sont jamais lus depuis la requête : seul l'identifiant l'est, et le reste est relu **en base**. Ce relais sera supprimé par le module d'authentification. **Aucune mise en production n'est possible tant qu'il existe.**

### Back-office : la même béquille, côté navigateur

Le back-office transmet le même identifiant via la variable `NEXT_PUBLIC_PAYMARH_USER_ID` (`.env`), qui alimente l'en-tête `x-paymarh-user-id` dans `apps/back-office/src/lib/api/client.ts`.

> **Béquille de développement — pas une authentification.** À remplacer par Auth.js. **Bloque toute mise en production tant qu'elle existe**, exactement comme l'en-tête côté API.

Un second en-tête, `x-paymarh-company-id`, désigne la société active pour le filtrage de second niveau. Il n'est utilisé par aucune route au module 0.

---

## Points d'attention

**Les imports relatifs portent l'extension `.js`.** L'API est un paquet ESM (NestJS 12 ne se distribue qu'en ESM). Voir [`docs/CONVENTIONS.md`](../../docs/CONVENTIONS.md) §3 et [`docs/adr/0002-modules-esm.md`](../../docs/adr/0002-modules-esm.md).

**Le client Prisma est généré dans `src/generated/prisma/`**, hors versionnement. Il est reconstruit par `pnpm db:migrate` ou `pnpm --filter @paymarh/api db:generate`.

**L'URL de connexion vit dans `prisma.config.ts`**, pas dans `schema.prisma` (changement de Prisma 7). Elle est lue depuis le `.env` unique de la racine du dépôt.

---

## Commandes propres à l'API

Depuis la racine, préfixer par `pnpm --filter @paymarh/api` :

| Commande      | Effet                                       |
| ------------- | ------------------------------------------- |
| `dev`         | Démarre avec rechargement automatique       |
| `build`       | Compile vers `dist/`                        |
| `start`       | Exécute la version compilée                 |
| `typecheck`   | Vérifie les types sans produire de fichiers |
| `db:generate` | Régénère le client Prisma                   |
| `db:migrate`  | Crée et applique une migration              |
| `db:studio`   | Ouvre Prisma Studio                         |

---

## Ce que cette API ne contient pas

Aucune entité ni logique de paie. Aucune authentification. Aucun moteur de calcul — seulement son contrat. Aucune implémentation de stockage d'objets. Ces éléments arriveront par modules successifs.
