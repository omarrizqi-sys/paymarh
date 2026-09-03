# API REST — Fiche société

- **Module :** 1 — Fiches
- **Étape :** 1.1.b
- **Date :** 2026-08-29

Ce document décrit l’API en langage accessible. Les permissions sont détaillées dans [05-permissions.md](./05-permissions.md). Les avertissements dans [06-validation-et-avertissements.md](./06-validation-et-avertissements.md).

Identification : en-tête de développement `x-paymarh-user-id` (rôle et compte relus en base). `accountId` ne vient **jamais** du client.

Toute réponse réussie a la forme :

```json
{ "data": {}, "warnings": [] }
```

Une société d’un autre compte → **404**. Un `PLATFORM_ADMIN` sur le chemin normal → **403**.

---

## Société (`/societes`)

| Méthode | Route                                    | Effet                                                                                                                                               |
| ------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/societes`                              | Liste des sociétés du compte                                                                                                                        |
| GET     | `/societes/:id`                          | Détail                                                                                                                                              |
| POST    | `/societes`                              | Crée la société + **un** établissement principal (adresse et ville obligatoires) + ligne d’historique initiale. `moisEnCours` = `moisDebutMontage`. |
| PATCH   | `/societes/:id`                          | Modifie la fiche (pas l’état, pas le régime, pas `moisEnCours`)                                                                                     |
| PATCH   | `/societes/:id/etat`                     | Change l’état du dossier                                                                                                                            |
| GET     | `/societes/:id/parametrage?mois=AAAA-MM` | Paramétrage applicable au mois                                                                                                                      |
| PUT     | `/societes/:id/parametrage`              | Écrit l’historique avec `moisEffet` = `moisEnCours` (jamais fourni par l’appelant)                                                                  |
| GET     | `/societes/:id/impact-suppression`       | Inventaire de ce qui serait perdu + `jetonConfirmation`                                                                                             |
| DELETE  | `/societes/:id?confirmationJeton=…`      | Supprime si le jeton correspond encore à l’inventaire actuel                                                                                        |

---

## Établissement

| Méthode | Route                                     | Effet                                                 |
| ------- | ----------------------------------------- | ----------------------------------------------------- |
| GET     | `/societes/:societeId/etablissements`     | Liste                                                 |
| POST    | `/societes/:societeId/etablissements`     | Crée un secondaire (pas de rattachement auto des RIB) |
| GET     | `/etablissements/:id`                     | Détail                                                |
| PATCH   | `/etablissements/:id`                     | Modifie                                               |
| POST    | `/etablissements/:id/designer-principal`  | Bascule atomique du principal                         |
| GET/PUT | `/etablissements/:id/parametrage`         | Lecture / écriture historisée                         |
| GET     | `/etablissements/:id/impact-suppression`  | Inventaire + jeton                                    |
| DELETE  | `/etablissements/:id?confirmationJeton=…` | Détache les RIB puis supprime (interdit si principal) |

---

## Compte bancaire

| Méthode | Route                                        | Effet                                           |
| ------- | -------------------------------------------- | ----------------------------------------------- |
| GET     | `/societes/:societeId/comptes-bancaires`     | Liste (+ avertissement si aucun usage salaires) |
| POST    | `/societes/:societeId/comptes-bancaires`     | Crée (RIB court → succès + avertissement)       |
| PATCH   | `/comptes-bancaires/:id`                     | Modifie                                         |
| POST    | `/comptes-bancaires/:id/cloturer`            | Passe en `CLOTURE`                              |
| GET     | `/comptes-bancaires/:id/impact-suppression`  | Inventaire + jeton                              |
| DELETE  | `/comptes-bancaires/:id?confirmationJeton=…` | Supprime si aucun bulletin ne l’a utilisé       |

---

## Référentiels (lecture)

`GET /referentiels/banques|jours-feries|formes-juridiques|types-heures|types-exoneration`

---

## Admin plateforme

`POST /admin/societes/:id/forcer-regime-de-base` — réservé `PLATFORM_ADMIN`, motif obligatoire, écriture dans `AuditLog` (ancienne / nouvelle valeur).

---

## Suppression : aperçu puis confirmation

1. `GET …/impact-suppression` → quantités + `jetonConfirmation`
2. L’interface affiche l’inventaire et demande acceptation
3. `DELETE …?confirmationJeton=<jeton>`
4. Si l’inventaire a changé entre-temps → **409** `CONFIRMATION_OBSOLETE` : il faut un nouvel aperçu

Aucune valeur fictive du type « À compléter » n’est acceptée pour l’adresse ou la ville.
