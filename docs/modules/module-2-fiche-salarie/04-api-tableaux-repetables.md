# API REST — Tableaux répétables fiche salarié (2.1.b-4)

- **Module :** 2 — Fiche salarié
- **Étape :** 2.1.b-4
- **Date :** 2026-09-03

Les réponses d'écriture ont la forme `{ donnees, alertes }`. Les écritures exigent l'en-tête **If-Match** (version lue).

---

## Portés par le salarié (`/salaries/:id`)

Permission d'écriture : `salarie.modifier`. Lecture via `GET /salaries/:id` (`salarie.lire`).

| Méthode | Route                                                           | Régime suppression         | Notes                                                        |
| ------- | --------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| POST    | `/salaries/:id/personnes-a-charge`                              | Historisé (aperçu + jeton) | `moisEffetDebut` déduit                                      |
| PATCH   | `/salaries/:id/personnes-a-charge/:ligneId`                     | —                          | Versionne si bulletin au mois en cours                       |
| GET     | `/salaries/:id/personnes-a-charge/:ligneId/impact-suppression`  | —                          | Retourne `jetonConfirmation`                                 |
| DELETE  | `/salaries/:id/personnes-a-charge/:ligneId?confirmationJeton=`  | Historisé                  | Suppression physique ou inactivation                         |
| PUT     | `/salaries/:id/comptes-bancaires`                               | Envoi groupé               | Remplace tout le tableau ; somme parts = 100 % si > 1 compte |
| POST    | `/salaries/:id/prets`                                           | Historisé                  |                                                              |
| PATCH   | `/salaries/:id/prets/:ligneId`                                  | —                          |                                                              |
| GET     | `/salaries/:id/prets/:ligneId/impact-suppression`               | —                          |                                                              |
| DELETE  | `/salaries/:id/prets/:ligneId?confirmationJeton=`               | Historisé                  |                                                              |
| POST    | `/salaries/:id/saisies-sur-salaire`                             | Historisé                  |                                                              |
| PATCH   | `/salaries/:id/saisies-sur-salaire/:ligneId`                    | —                          |                                                              |
| GET     | `/salaries/:id/saisies-sur-salaire/:ligneId/impact-suppression` | —                          |                                                              |
| DELETE  | `/salaries/:id/saisies-sur-salaire/:ligneId?confirmationJeton=` | Historisé                  |                                                              |

### Valeurs déduites en lecture (salarié)

- `nombrePersonnesACharge` — compté depuis les lignes actives cochées « à charge »
- `soldeRestant` (prêt) — déduit du montant total, mensualité et échéances prélevées via bulletins
- `etat` (`ACTIVE` / `INACTIVE`) — sur les lignes à validité temporelle

### Contrôles salarié

| Code                               | Type    | Objet                                |
| ---------------------------------- | ------- | ------------------------------------ |
| `PART_VIREMENT_INVALIDE`           | Blocage | Somme des parts ≠ 100 % (C23)        |
| `MONTANT_MENSUEL_SUPERIEUR_TOTAL`  | Blocage | Saisie sur salaire (C17)             |
| `PERSONNE_A_CHARGE_DOUBLON`        | Alerte  | Homonymie enfant (B7)                |
| `ENFANT_AGE_DEPASSE`               | Alerte  | Si référentiel fournit le seuil (C8) |
| `MENSUALITE_ECHEANCES_INCOHERENTE` | Alerte  | Prêt (C16)                           |
| `RIB_DEJA_UTILISE`                 | Alerte  | C12                                  |
| `FORMAT_IDENTIFIANT_BANCAIRE`      | Alerte  | RIB / IBAN / BIC (C13)               |
| `BANQUE_INCOHERENTE`               | Alerte  | Incohérence banque / RIB (T11)       |

> **Pré-remplissage banque et alerte d'incohérence (T11)** — le serveur résout la banque depuis les trois premiers chiffres du RIB (`resoudreBanqueDepuisRib`) et signale une incohérence si la banque désignée ne correspond pas au RIB. Ces deux mécanismes restent **inertes en production** tant que le référentiel national des banques n'a pas de `codeBanque` renseigné (au seed, les 21 banques ont `codeBanque: null` volontairement).

---

## Portés par l'emploi (`/emplois/:id`)

Permission d'écriture : `emploi.modifier`. Lecture via `GET /emplois/:id` ou emplois embarqués sur la fiche salarié.

| Méthode | Route                                         | Régime suppression | Notes                                              |
| ------- | --------------------------------------------- | ------------------ | -------------------------------------------------- |
| POST    | `/emplois/:id/primes-contractuelles`          | Simple             | Rattachement seul (code + mois), jamais de montant |
| PATCH   | `/emplois/:id/primes-contractuelles/:ligneId` | Simple             |                                                    |
| DELETE  | `/emplois/:id/primes-contractuelles/:ligneId` | Simple             |                                                    |
| POST    | `/emplois/:id/avantages-en-nature`            | Simple             | Porte un montant                                   |
| PATCH   | `/emplois/:id/avantages-en-nature/:ligneId`   | Simple             | Validité temporelle à la modification              |
| DELETE  | `/emplois/:id/avantages-en-nature/:ligneId`   | Simple             |                                                    |
| POST    | `/emplois/:id/statuts-particuliers`           | Simple             |                                                    |
| PATCH   | `/emplois/:id/statuts-particuliers/:ligneId`  | Simple             | Refus si origine `PROPAGE_SOCIETE`                 |
| DELETE  | `/emplois/:id/statuts-particuliers/:ligneId`  | Simple             | Idem                                               |

### Contrôles emploi

| Code                            | Type        | Objet                                   |
| ------------------------------- | ----------- | --------------------------------------- |
| `CHEVAUCHEMENT_STATUTS`         | Blocage     | Deux périodes qui se chevauchent (B7)   |
| `STATUT_PROPAGE_LECTURE_SEULE`  | Blocage 409 | Ligne propagée par la société (A17, B8) |
| `STATUT_HORS_INTERVALLE_EMPLOI` | Alerte      | Dates hors emploi (C7)                  |

---

## Masquage rémunération

Sans `salarie.remuneration.lire` : `comptesBancaires`, `primesContractuelles`, `avantagesEnNature` absents de toute réponse.

---

## Tri serveur (B2)

- Personnes à charge : date de naissance
- Prêts et saisies : mois de début
- Statuts particuliers : date de début
- Autres : ordre de saisie (`createdAt`)
