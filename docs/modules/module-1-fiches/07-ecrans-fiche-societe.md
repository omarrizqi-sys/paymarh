# Écrans back-office — Fiche société

- **Module :** 1 — Fiches
- **Étape :** 1.1.c
- **Date :** 2026-08-30

Ce document décrit les écrans du back-office pour la fiche société et les appels API associés.

---

## Liste des sociétés (`/societes`)

**Rôle :** Vue d’ensemble des dossiers du compte.

| Action | API |
| --- | --- |
| Charger la liste | `GET /societes` → `{ items[], total, operations[] }` |
| Compter les établissements | `GET /societes/:id/etablissements` (par société) |
| Libellé forme juridique | `GET /referentiels/formes-juridiques` |
| Créer | Bouton si `operations` contient `societe.creer` → `/societes/nouveau` |

Colonnes : code dossier, raison sociale, forme juridique, état, mois en cours, nombre d’établissements. Recherche, tri et pagination côté client (TanStack Table).

---

## Création (`/societes/nouveau`)

**Rôle :** Créer une société et son établissement principal en une fois.

| Action | API |
| --- | --- |
| Soumettre | `POST /societes` (adresse + ville obligatoires dans `etablissementPrincipal`) |
| Formes juridiques | `GET /referentiels/formes-juridiques` |

---

## Fiche société (`/societes/:id`)

Rubriques dans l’ordre de la spec :

### État du dossier

`PATCH /societes/:id/etat` — affichage conditionnel de la date d’inactivité si `INACTIVE`.

### Identification

`PATCH /societes/:id` — champs légaux et mois de montage/production.

### Employeur signataire

`PATCH /societes/:id` — civilité, prénom, nom, qualité.

### Congés payés · Exonération

`GET/PUT /societes/:id/parametrage?mois=<moisEnCours>` — mois de clôture, type et dates d’exonération. Les dates restent en base si l’exonération est retirée (champs masqués, valeurs conservées via champs cachés).

### Paramétrage technique

`PATCH /societes/:id` — préfixe et longueur des matricules.

### Informations bancaires

| Action | API |
| --- | --- |
| Liste | `GET /societes/:id/comptes-bancaires` |
| Créer | `POST /societes/:id/comptes-bancaires` |
| Clôturer | `POST /comptes-bancaires/:id/cloturer` |
| Supprimer | Aperçu `GET …/impact-suppression` puis `DELETE …?confirmationJeton=` |

« Utilisé par » masqué si un seul établissement.

### Établissements

| Action | API |
| --- | --- |
| Liste | `GET /societes/:id/etablissements` |
| Créer | `POST /societes/:id/etablissements` |
| Modifier | `PATCH /etablissements/:id` |
| Désigner principal | `POST /etablissements/:id/designer-principal` |
| Paramétrage (horaires, fériés, télétravail) | `GET/PUT /etablissements/:id/parametrage?mois=` |
| Supprimer | Aperçu + jeton |

Grille horaire : lignes depuis `GET /referentiels/types-heures`. Total de contrôle affiché (somme d’affichage via decimal.js).

---

## Composant d’aperçu d’impact

Réutilisé pour société, établissement et compte bancaire :

1. `GET …/impact-suppression`
2. Inventaire avec quantités
3. Case d’acceptation obligatoire
4. `DELETE` avec jeton
5. Si `CONFIRMATION_OBSOLETE` → rechargement de l’aperçu

---

## Droits

Chaque réponse de lecture inclut `operations: Permission[]`. Le front masque ou désactive les boutons ; l’API reste la barrière.

---

## Configuration développement

Dans `.env` :

- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_PAYMARH_USER_ID=<uuid admin compte>` (affiché par `pnpm db:seed`)

### Béquilles de développement (pas d'authentification)

| Côté | Mécanisme | Fichier |
| --- | --- | --- |
| API (curl, tests HTTP) | En-tête `x-paymarh-user-id` | `apps/api/src/common/tenancy/tenant-context.middleware.ts` |
| Back-office (navigateur) | Variable `NEXT_PUBLIC_PAYMARH_USER_ID` → même en-tête | `apps/back-office/src/lib/api/client.ts` |

> **Béquilles de développement — pas une authentification.** À remplacer par Auth.js. **Bloquent toute mise en production tant qu'elles existent.**

---

## Fichiers principaux

| Fichier | Rôle |
| --- | --- |
| `apps/back-office/src/app/societes/` | Pages App Router |
| `apps/back-office/src/lib/api/` | Clients HTTP |
| `apps/back-office/src/lib/affichage/conditions.ts` | Affichage conditionnel (spec étape 2) |
| `apps/back-office/src/components/impact-suppression/` | Dialogue de suppression |
| `apps/api/src/common/permissions/operations-ressource.ts` | Permissions en lecture |
