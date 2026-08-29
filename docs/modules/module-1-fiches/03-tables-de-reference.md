# Tables de référence — Fiche société

- **Module :** 1 — Fiches
- **Étape :** 1.1.a
- **Date :** 2026-08-29
- **Source :** onglets « Réf - … » de `Fiche société v7.xlsx`

---

## 1. Principes communs

Toutes les tables ci-dessous :

- **n’ont pas** d’`accountId` — ce sont des référentiels nationaux ;
- sont **maintenues** par le `PLATFORM_ADMIN` ;
- sont **lisibles** par tous les comptes ;
- sont peuplées par le seed (`apps/api/prisma/reference-data.ts` + `seed.ts`).

Aucune de ces tables ne contient de taux, de barème ni de date calendaire calculée.

---

## 2. `FormeJuridique`

| Colonne | Rôle |
| --- | --- |
| `code` | Identifiant stable (unique) |
| `libelle` | Libellé d’affichage |

**Seed (15) :** SARL, SARLAU, SA, SAS, SNC, SCS, SCA, GIE, SEP, SUCC, COOP, ASSO, EP, EI, AE.

**Comment étendre :** ajouter une ligne (code + libellé) via seed ou futur écran admin. Les sociétés déjà saisies gardent leur FK (`onDelete: Restrict`).

---

## 3. `Banque`

| Colonne | Rôle |
| --- | --- |
| `nom` | Libellé d’affichage |
| `ancienNom` | Sigle historique pour la recherche (ex. `SGMB`, `BMCE`) |
| `codeBanque` | 3 premiers chiffres du RIB — **prévu, laissé vide** (X3) |
| `couleur` | Hex d’affichage |

**Seed (21 banques).** Libellés particuliers figés en X4 :

- `Saham Bank (ex Société Générale)` avec `ancienNom = SGMB`
- `Bank of Africa (ex BMCE)` avec `ancienNom = BMCE`

CDG Capital est volontairement absente. La saisie libre reste possible sur le compte bancaire (`banqueSaisieLibre`) si la banque n’est pas listée.

**Comment étendre :** ajouter une banque ; renseigner `codeBanque` plus tard pour activer le pré-remplissage à partir du RIB (1.1.b / suite).

---

## 4. `JourFerie`

| Colonne | Rôle |
| --- | --- |
| `code` | **Stable à vie** — ne change jamais, même si le libellé évolue |
| `libelle` | Affichage |
| `referenceDate` | Texte (ex. `1er janvier`, `1er Chawal`) — pas une date |
| `type` | `CIVIL` ou `RELIGIEUX` |

**Seed (18) :** 11 fêtes civiles à date fixe + 7 journées religieuses.

Les cases cochées par établissement pointent vers le `code` via `JourFerieTravaille`. Ainsi un changement de libellé ne casse pas les coches.

**Hors module 1 :** aucune date réelle, aucune résolution lunaire (module 4). `JF_FETE_UNITE` (Aïd Al Wahda) notera une année d’entrée en vigueur au module 4.

---

## 5. `TypeHeure`

| Colonne | Rôle |
| --- | --- |
| `code` | Stable (`NORMALE`, `MAJOREE_25`, …) |
| `libelle` | Affichage (les % dans le libellé sont indicatifs) |
| `ordre` | Ordre d’affichage dans la grille |

**Seed (4) :** NORMALE, MAJOREE_25, MAJOREE_50, MAJOREE_100.

**Aucun taux en base.** Le module 5 étendra le référentiel et portera les majorations calculables. La grille (`HoraireDefautLigne`) référence `TypeHeure` plutôt que des colonnes figées.

---

## 6. `TypeExoneration`

| Colonne | Rôle |
| --- | --- |
| `code` | Stable |
| `libelle` | Affichage |

**Seed :** `TAHFIZ` seulement. La liste sera complétée plus tard.

Règle métier : **une seule exonération à la fois** sur un paramétrage société — jamais de cumul. Portée dans `CompanyParametrageHistorique.typeExonerationId`.

---

## 7. Qui fait quoi, concrètement

| Acteur | Droit prévu (à brancher en 1.1.b+) |
| --- | --- |
| `PLATFORM_ADMIN` | Créer / modifier / désactiver les lignes de référence (chemin explicite + audit) |
| Compte client | Lecture seule pour alimenter les listes déroulantes |
| Seed | Charge initiale idempotente à chaque `pnpm db:seed` |

---

## 8. Vérification rapide après seed

Dans Prisma Studio, constater :

1. **15** formes juridiques
2. **21** banques
3. **18** jours fériés
4. **4** types d’heures
5. **1** type d’exonération (`TAHFIZ`)
