# API REST — Fiche emploi

- **Module :** 2 — Fiche salarié
- **Étape :** 2.1.b-3
- **Date :** 2026-09-03

Identification : en-têtes `x-paymarh-user-id` et `x-paymarh-company-id`. Ressource hors périmètre → **404** (message neutre).

Les réponses de lecture ont la forme `{ donnees }`. Les réponses d'écriture : `{ donnees, alertes }`.

---

## Création

| Méthode | Route                          | Permission     | Effet                                               |
| ------- | ------------------------------ | -------------- | --------------------------------------------------- |
| POST    | `/salaries/:salarieId/emplois` | `emploi.creer` | Crée un emploi (3 blocs initiaux). Sans `If-Match`. |

---

## Emploi (`/emplois`)

| Méthode | Route                                                | Permission         | Effet                                                  |
| ------- | ---------------------------------------------------- | ------------------ | ------------------------------------------------------ |
| GET     | `/emplois/:id`                                       | `salarie.lire`     | Emploi complet au mois en cours du salarié             |
| PATCH   | `/emplois/:id/contrat`                               | `emploi.modifier`  | Rubrique contrat (+ confirmation sortie si apparition) |
| PATCH   | `/emplois/:id/remuneration`                          | `emploi.modifier`  | Rubrique rémunération (incl. paiement en écriture)     |
| PATCH   | `/emplois/:id/affectation-temps-de-travail`          | `emploi.modifier`  | Rubrique affectation / temps de travail                |
| DELETE  | `/emplois/:id`                                       | `emploi.supprimer` | Supprime si aucun bulletin sur **cet** emploi          |
| GET     | `/emplois/:id/versions/contrat`                      | `salarie.lire`     | Historique contrat (mois d'effet ↓)                    |
| GET     | `/emplois/:id/versions/remuneration`                 | `salarie.lire`     | Historique rémunération + paiement (mois d'effet ↓)    |
| GET     | `/emplois/:id/versions/affectation-temps-de-travail` | `salarie.lire`     | Historique affectation (mois d'effet ↓)                |

Les écritures (sauf création) exigent **If-Match** (version de l'emploi).

La collection `emplois[]` de `GET /salaries/:id` reprend le même format, triée par date de début croissante puis numéro d'ordre (D25, B2).

---

## Rubriques PATCH et spec v5

| Route                          | Section spec (blocs emploi)                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| `contrat`                      | EmploiContratVersion — poste, dates, type contrat, essai, cadre, sortie     |
| `remuneration`                 | EmploiRemunerationVersion — rémunération + paiement (écriture)              |
| `affectation-temps-de-travail` | EmploiAffectationVersion — établissement, durée, repos, fériés, télétravail |

Découpage validé : une rubrique par bloc historisé (ADR 0016). Pas de rubrique plus fine.

---

## Historisation (mois d'effet)

| Situation                                | Mois d'effet                                                     |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Première version d'un bloc sur un emploi | Mois de la **date de début** de l'emploi                         |
| Versions suivantes                       | Mois en cours du **salarié** (via bulletins / emplois, ADR 0012) |

Le client ne fournit jamais `moisEffet`. Le serveur décide écraser vs versionner selon la présence d'un bulletin (≥ calculé) au mois en cours du salarié (ADR 0011).

---

## Codes de réponse (registre emploi)

| Code                                   | Type        | Cas                                                    |
| -------------------------------------- | ----------- | ------------------------------------------------------ |
| `DATE_FIN_ANTERIEURE_DEBUT`            | Blocage 400 | C3 — rien n'est écrit                                  |
| `DATE_SORTIE_HORS_INTERVALLE`          | Alerte      | C4                                                     |
| `FIN_ESSAI_HORS_INTERVALLE`            | Alerte      | C5                                                     |
| `RENOUVELLEMENT_ESSAI_ANTERIEUR`       | Alerte      | C6                                                     |
| `SALAIRE_INFERIEUR_SMIG`               | Alerte      | C19 — si port référentiel renvoie un SMIG              |
| `DUREE_CONTRACTUELLE_TOTALE_EXCESSIVE` | Alerte      | C20 — si port référentiel renvoie le seuil             |
| `REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE`    | Alerte      | C24 — repos sur un jour travaillé de la grille résolue |
| `CHAMP_INTERDIT`                       | Blocage 400 | `moisEffet` fourni par le client                       |
| `CONFIRMATION_REQUISE`                 | Blocage 409 | Apparition d'une date de sortie (D9)                   |
| `CONFIRMATION_OBSOLETE`                | Blocage 409 | Jeton périmé                                           |
| `CONFLIT_VERSION`                      | Blocage 409 | Version emploi obsolète                                |
| `SUPPRESSION_INTERDITE`                | Blocage 409 | Bulletin existant sur l'emploi (B5)                    |

Codes partagés avec le salarié : `EN_TETE_IF_MATCH_REQUIS`, `CONFLIT_VERSION`, etc.

---

## Valeurs déduites en lecture

- `affectation.dureeDansAutreBase` — conversion hebdomadaire → mensuelle (× 52/12, décimal exact)
- `contrat.periodeEssaiDureeJours` — déduite de la date de fin d'essai
- `contrat.estOuvert` — dérivé de la date de sortie

---

## Masquage rémunération

Clés `remuneration` et `paiement` (emploi et versions) soumises à `salarie.remuneration.lire` / `.ecrire`.

---

## Laissé de côté (prompts suivants)

| Élément                        | Raison                            |
| ------------------------------ | --------------------------------- |
| Alimentation du moteur de paie | Moteur vide en phase 2 (ADR 0017) |
