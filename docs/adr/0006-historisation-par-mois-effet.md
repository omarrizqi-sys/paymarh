# ADR 0006 — Historisation par `moisEffet` (texte `AAAA-MM`)

- **Statut :** accepté
- **Date :** 2026-08-29
- **Portée :** paramètres de fiche société / établissement (module 1), extensible aux paramètres de paie ultérieurs

---

## Contexte

Certains paramètres de la fiche société conditionnent le calcul ou le recalcul d’un bulletin : durée hebdomadaire, jour de repos, exonération, mois de clôture des congés, grille horaire, jours fériés travaillés.

Si l’on écrase la valeur courante, un recalcul d’un mois passé utilise la valeur d’aujourd’hui. En paie marocaine, c’est une faute : le passé doit rester reproductible.

La spécification v7 (décision V1) impose en outre que **l’utilisateur ne saisisse pas** la date d’effet : elle est déduite du mois de paie en cours du dossier.

---

## Décision

1. **Une table d’historique par niveau** (`CompanyParametrageHistorique`, `EtablissementParametrageHistorique`), pas de colonnes versionnées éparpillées sur la table principale.
2. **Colonne `moisEffet` en `TEXT` au format `AAAA-MM`**, clé composite avec l’identifiant de l’entité.
3. **Sémantique :** une ligne s’applique de son `moisEffet` jusqu’au `moisEffet` suivant (exclus). Résolution = ligne de `moisEffet` maximal parmi celles `≤` mois demandé.
4. **`moisEffet` n’est jamais saisi** dans l’UI ; l’écriture (étape 1.1.b) le déduira du mois de paie en cours.
5. **`regimeDeBase` n’est pas historisé** : sa modification est bloquée dès qu’un salarié existe, donc il ne varie pas dans le temps.

---

## Pourquoi `AAAA-MM` en texte plutôt qu’une date

| Approche | Problème |
| --- | --- |
| `Date` / `timestamptz` au 1er du mois | Invente un jour ; fuseaux et « fin de mois » créent de la confusion. |
| Entier `202507` | Moins lisible ; conversions manuelles partout. |
| Deux colonnes `annee` + `mois` | Comparaisons plus lourdes ; risque d’incohérence. |
| **`TEXT 'AAAA-MM'`** | Comparable, triable, lisible, aligné sur la saisie métier MM/AAAA affichée. |

Le format texte `AAAA-MM` est stable pour les index et pour les tests (`'2025-03' < '2025-07'`).

---

## Pourquoi l’utilisateur ne saisit pas la date d’effet

1. **Réduit l’erreur humaine.** Une mauvaise date d’effet silencieuse corrompt tous les bulletins d’une période.
2. **Aligne l’écriture sur le dossier.** Le « présent » opérationnel est le mois de paie en cours, pas le calendrier civil du jour de saisie.
3. **Simplifie l’UI.** Moins de champs, moins de cas limites (effet dans le futur lointain, chevauchements saisis à la main).

La structure en base reste capable d’accueillir plusieurs `moisEffet` (le seed en crée deux pour le démontrer). Seule la **déduction** est reportée à 1.1.b.

---

## Conséquences

- Les services d’écriture devront toujours passer par une résolution / insertion de ligne d’historique, jamais un simple `UPDATE` du champ courant sur `Company` / `Etablissement` pour les paramètres historisés.
- Les lectures pour un mois de paie M appellent `resoudreLigneHistorique(lignes, M)`.
- Les champs non historisés restent sur `Company` / `Etablissement` en colonnes simples.

---

## Alternatives rejetées

| Alternative | Motif de rejet |
| --- | --- |
| SCD type 2 avec `validFrom` / `validTo` dates | Surdimensionné ; double borne à maintenir à chaque écriture. |
| Event sourcing complet | Coût hors de portée pour des paramètres de fiche. |
| Snapshot JSON par mois | Moins requêtable ; pas de FK vers référentiels (exonération, jours fériés). |
| Champ `dateEffet` saisi par l’utilisateur | Contredit V1 ; source d’erreurs. |
