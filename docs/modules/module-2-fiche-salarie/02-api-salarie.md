# API REST — Fiche salarié (niveau salarié)

- **Module :** 2 — Fiche salarié
- **Étape :** 2.1.b-2
- **Date :** 2026-09-03

Identification : en-têtes `x-paymarh-user-id` et `x-paymarh-company-id`. Toute ressource d'une autre société ou d'un autre compte → **404** (message neutre).

Les réponses de lecture ont la forme `{ donnees }`. Les réponses d'écriture : `{ donnees, alertes }`.

---

## Salarié (`/salaries`)

| Méthode | Route | Permission | Effet |
| --- | --- | --- | --- |
| GET | `/salaries` | `salarie.lire` | Liste paginée par curseur (société courante). Filtres : état, établissement, recherche nom/prénom/matricule. |
| GET | `/salaries/:id` | `salarie.lire` | Fiche complète (niveau salarié) + valeurs déduites + collections vides |
| POST | `/salaries` | `salarie.creer` | Crée une fiche sans emploi. Matricule auto si vide. |
| POST | `/salaries/verifier` | `salarie.lire` | Pré-contrôle : alertes et blocages sans écriture |
| PATCH | `/salaries/:id/identite` | `salarie.modifier` | Rubrique identité |
| PATCH | `/salaries/:id/coordonnees` | `salarie.modifier` | Rubrique coordonnées (incl. contact d'urgence) |
| PATCH | `/salaries/:id/identifiants-legaux` | `salarie.modifier` | Rubrique identifiants légaux |
| PATCH | `/salaries/:id/dates` | `salarie.modifier` | Dates d'entrée et d'ancienneté |
| GET | `/salaries/:id/impact-suppression` | `salarie.supprimer` | Message unique + `jetonConfirmation` |
| DELETE | `/salaries/:id?confirmationJeton=` | `salarie.supprimer` | Supprime si aucun bulletin et jeton valide |

Les écritures (sauf création et pré-contrôle) exigent l'en-tête **If-Match** (version lue).

---

## Codes de réponse (registre salarié)

| Code | Type | Cas |
| --- | --- | --- |
| `EN_TETE_IF_MATCH_REQUIS` | Blocage 428 | If-Match absent ou invalide |
| `CONFLIT_VERSION` | Blocage 409 | Version obsolète |
| `VALEUR_INDISPONIBLE` | Blocage 400 | Matricule, pièce ou CNSS déjà pris (C9–C11) |
| `CARACTERE_NON_CONFORME` | Blocage 400 | Type de caractère invalide (C0) |
| `ANCIENNETE_POSTERIEURE_ENTREE` | Alerte | Date d'ancienneté > date d'entrée (C1) |
| `FORMAT_CONTACT_INVALIDE` | Alerte | Mail ou téléphone mal formé (C14) |
| `CODE_POSTAL_MAROC_INATTENDU` | Alerte | Code postal ≠ 5 chiffres si pays Maroc (C15) |
| `HOMONYME` | Alerte | Homonyme actif (P10) |
| `REEMBAUCHE` | Alerte | Salarié inactif correspondant + `salarieExistantId` (P10, D4) |
| `CONFIRMATION_REQUISE` | Blocage 400 | Suppression sans jeton |
| `CONFIRMATION_OBSOLETE` | Blocage 409 | Jeton de confirmation périmé |
| `SUPPRESSION_INTERDITE` | Blocage 409 | Bulletin existant (D5, E5) |

---

## Hors périmètre de ce document

Emplois, tableaux répétables, blocs historisés : prompt 3.
