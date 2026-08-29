# `@paymarh/shared-types`

Les types TypeScript échangés entre l'**API** et ses clients : le back-office aujourd'hui, le portail salarié et l'application mobile demain.

---

## La règle d'or

> **Un type métier se définit UNE SEULE FOIS, ici. Jamais ailleurs, jamais deux fois.**

Ni l'API ni le back-office ne redéclarent la forme d'un `Account`, d'une `Company` ou d'un `User`.

```ts
// CORRECT — dans l'API comme dans le back-office
import type { Company } from '@paymarh/shared-types';

// INTERDIT — redéclaration locale
interface Company {
  id: string;
  name: string;
}
```

### Pourquoi c'est strict

Un type dupliqué ne pose aucun problème **le jour où on l'écrit**. Il en pose un six mois plus tard, quand l'API ajoute un champ et que le front l'ignore, ou pire, quand un champ change de sens des deux côtés sans que rien ne le signale.

Avec une définition unique, un changement de contrat **casse immédiatement la compilation** de tout ce qui en dépend. C'est exactement le retour qu'on veut : une erreur bruyante à la compilation plutôt qu'un bogue silencieux en production.

---

## Ce que contient le package

| Fichier      | Contenu                                                |
| ------------ | ------------------------------------------------------ |
| `common.ts`  | `Uuid`, `IsoDateTime`, `Timestamps`, `ListResponse<T>` |
| `role.ts`    | `Role` — les quatre rôles utilisateurs                 |
| `account.ts` | `Account`, `AccountType`                               |
| `company.ts` | `Company`                                              |
| `user.ts`    | `User`                                                 |
| `tenancy.ts` | `TenantContext`, `PlatformAccessReason`                |
| `audit.ts`   | `AuditLog`                                             |
| `health.ts`  | `HealthResponse`                                       |

Tout est réexporté par `src/index.ts`, le point d'entrée unique.

---

## Le package ne contient QUE des types

Aucune fonction, aucune constante, aucune classe. Rien qui existe à l'exécution.

C'est délibéré, et cela a une conséquence agréable : les imports sont **entièrement effacés à la compilation**. Le package n'ajoute donc pas un octet au code livré, ni côté API, ni côté navigateur.

C'est aussi pour cela qu'il n'a pas de tests : il n'y a rien d'exécutable à tester. Sa justesse est vérifiée par `pnpm typecheck`.

Si un besoin de valeur à l'exécution apparaît un jour (une liste de rôles à parcourir pour un menu, par exemple), il faudra en discuter explicitement : ce serait un changement de nature du package, pas un simple ajout.

---

## Deux conventions à respecter

### 1. Les dates sont des chaînes ISO 8601, jamais des `Date`

```ts
export interface Company extends Timestamps {
  readonly createdAt: IsoDateTime; // "2026-01-31T23:59:59.000Z"
}
```

L'API expose toujours des dates en chaîne UTC. C'est au client d'afficher dans le fuseau local.

Pourquoi : un objet `Date` ne survit pas à la sérialisation JSON, et surtout, les décalages de fuseau sur des périodes de paie changent le mois de rattachement. Un jour d'écart, et une prime bascule sur le mois suivant.

### 2. Le nommage suit la convention du projet

Identifiants techniques **en anglais** (`accountId`, `ListResponse`), termes métier réglementaires marocains **en français** (`salarie`, `bulletin`, `cotisationCNSS`, `IR`) — jamais traduits.

Les commentaires sont en français. Voir [`docs/CONVENTIONS.md`](../../docs/CONVENTIONS.md) §2.

---

## Rester aligné avec Prisma

Certains types reflètent des énumérations du schéma Prisma :

| Type ici      | Enum Prisma   |
| ------------- | ------------- |
| `Role`        | `Role`        |
| `AccountType` | `AccountType` |

**Ils doivent rester strictement alignés.** Une valeur ajoutée d'un côté doit l'être de l'autre, et côté base cela implique une migration.

Ils ne sont volontairement pas générés automatiquement depuis Prisma : le client Prisma est un détail interne de l'API, alors que ce package est le **contrat public**. Les garder distincts permet de faire évoluer le stockage sans casser les clients — mais impose cette vigilance.

---

## Utilisation

```ts
import type { Account, Company, ListResponse, Role, User } from '@paymarh/shared-types';

async function chargerSocietes(): Promise<ListResponse<Company>> {
  const reponse = await fetch(`${urlApi()}/companies`);
  return reponse.json() as Promise<ListResponse<Company>>;
}
```

Le package est déjà déclaré comme dépendance de `@paymarh/api` et `@paymarh/back-office`. Il n'y a rien à installer.

---

## Ajouter un type

1. Créer le fichier dans `src/` (minuscules, tirets, sans accent).
2. Documenter en français **le rôle du type et ses contraintes** — pas sa syntaxe.
3. Le réexporter depuis `src/index.ts`.
4. Vérifier avec `pnpm typecheck`.

Avant de créer un type ici, posez-vous la question : **est-il vraiment échangé entre l'API et un client ?** Un type interne à l'API (une ligne de base avant sérialisation, par exemple) n'a rien à faire dans le contrat public : il reste dans `apps/api`.
