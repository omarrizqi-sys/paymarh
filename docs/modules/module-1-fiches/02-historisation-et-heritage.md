# Historisation et héritage — Fiche société

- **Module :** 1 — Fiches
- **Étape :** 1.1.a
- **Date :** 2026-08-29
- **ADR associé :** [0006-historisation-par-mois-effet.md](../../adr/0006-historisation-par-mois-effet.md)

---

## 1. Pourquoi historiser ?

Un bulletin de **mars** recalculé en **décembre** doit utiliser les paramètres de mars (durée hebdomadaire, jour de repos, exonération, mois de clôture des congés, etc.). Sans historique, toute modification actuelle écraserait le passé et fausserait les recalculs.

L’héritage (qui utilise la valeur) et l’historisation (conserve-t-on les valeurs passées ?) sont **indépendants**. Un champ peut être historisé sans être héritable par le salarié (exemple : mois de clôture des congés).

---

## 2. Mécanisme retenu : `moisEffet` en texte `AAAA-MM`

Pour chaque niveau historisé, une table d’historique :

| Table | Clé |
| --- | --- |
| `CompanyParametrageHistorique` | `(companyId, moisEffet)` |
| `EtablissementParametrageHistorique` | `(etablissementId, moisEffet)` |

**Règle de validité.** Une ligne vaut à partir de son `moisEffet` jusqu’au `moisEffet` de la ligne suivante (exclus). Pour un mois cible M, on prend la ligne applicable dont `moisEffet ≤ M` et `moisEffet` est le plus grand possible.

**L’utilisateur ne saisit jamais `moisEffet`.** En 1.1.b, cette date sera déduite du mois de paie en cours du dossier au moment de l’écriture. L’étape 1.1.a pose uniquement la structure et la fonction de résolution pure `resoudreLigneHistorique`.

### Pourquoi du texte `AAAA-MM` et pas une `Date` ?

1. Un mois de paie n’est pas un jour calendaire : stocker le 1er du mois inventerait une fausse précision.
2. Le format `AAAA-MM` se **compare et se trie** correctement en ordre lexicographique (`2025-01` < `2025-07` < `2026-01`).
3. Les écrans et déclarations manipulent déjà des mois, pas des instants.

---

## 3. Ce qui est historisé

### Niveau société (`CompanyParametrageHistorique`)

- `moisClotureConges` (1–12, défaut 12) — historisé même s’il n’est **pas** héritable par le salarié (décision X2 de la spec).
- Exonération : `typeExonerationId` (une seule à la fois, jamais de cumul), `exonerationDateDebut` / `exonerationDateFin` (`AAAA-MM`).

### Niveau établissement (`EtablissementParametrageHistorique`)

- `dureeHebdomadaire` (Decimal, défaut 44)
- `jourReposHebdomadaire` (un seul jour, défaut dimanche)
- Télétravail : `teletravailAutorise`, `indemniteTeletravailVersee`, `montantIndemniteTeletravail` (booléens nullable = trois états)
- Grille `HoraireDefautLigne` et heures mensuelles `HoraireMensuelLigne`
- Jours fériés travaillés (`JourFerieTravaille`)

### Conversion hebdomadaire → mensuel

Coefficient **52 / 12**, arrondi à l’unité supérieure via `Decimal.ceil()` (`heuresHebdomadairesVersMensuelles`). `Math.round` est interdit. Le résultat reste modifiable à la saisie.

---

## 4. Ce qui n’est pas historisé (et pourquoi)

| Champ | Raison |
| --- | --- |
| `regimeDeBase` | Modification **bloquée** dès qu’un salarié existe → ne peut pas varier dans le temps. Correction exceptionnelle possible par `PLATFORM_ADMIN` + `AuditLog` (plus tard). |
| Identité légale (raison sociale, IF, RC, …) | Pas de recalcul de bulletin dépendant d’une ancienne raison sociale au sens paramètre de paie ; hors scope historisation fiche. |
| État du dossier / mois de montage / production | Décrivent le cycle de vie du dossier, pas un paramètre de calcul mois par mois. |
| Matricules (préfixe, longueur, auto) | Règles de génération futures ; les matricules déjà attribués ne bougent jamais. |
| Comptes bancaires | Cycle de vie propre (`ACTIF` / `CLOTURE`), pas une grille par moisEffet. |

---

## 5. Exemple de résolution

Historique société :

| moisEffet | moisClotureConges |
| --- | --- |
| 2025-01 | 12 |
| 2025-07 | 6 |

| Mois demandé | Ligne retenue | Clôture |
| --- | --- | --- |
| 2024-12 | aucune | — |
| 2025-03 | 2025-01 | 12 |
| 2025-07 | 2025-07 | 6 |
| 2025-12 | 2025-07 | 6 |

Le piège à éviter : prendre « la ligne la plus récente tout court ». Pour mars 2025, ce serait faux (on obtiendrait 6 au lieu de 12).

---

## 6. Héritage vers le salarié (aperçu, hors 1.1.a)

Plusieurs paramètres établissement seront **héritables** par la fiche salarié (durée, horaires, repos, fériés, télétravail). Le salarié pourra cocher « utiliser le paramétrage de l’établissement ». La granularité exacte de ces cases est reportée à la phase fiche salarié.

Point important pour la relecture métier : le libellé d’héritage doit coller au **niveau réel** du champ (établissement, pas « société » par défaut — E4).

---

## 7. Ce que 1.1.a fournit / ne fournit pas

**Fournit :** tables, clés, seed avec deux `moisEffet`, fonction de résolution testée.

**Ne fournit pas :** écriture métier qui déduit `moisEffet`, API, écrans, héritage salarié.
