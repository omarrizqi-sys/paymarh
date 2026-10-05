# ADR 0033 — TAHFIZ limité aux périodes en CDI, IDMAJ réservé au contrat d’insertion

- **Statut :** accepté
- **Date :** 2026-10-05
- **Portée :** module 2 (propagation TAHFIZ, statuts particuliers, contrat de l'emploi) + seed
- **Complète :** ADR 0018 (le « qui est concerné » et le calcul des dates de l'ADR 0018 sont remplacés par le présent ADR ; le retrait, la lecture seule et la transaction unique restent valables)

---

## Contexte

Deux défauts de cadrage :

1. La propagation TAHFIZ posait une ligne sur **tout emploi ouvert**, quel que soit son type de contrat. L'exonération ne vise que les périodes en **CDI**.
2. Le statut IDMAJ pouvait être saisi sur n'importe quel emploi. IDMAJ est le dispositif ANAPEC du **contrat d’insertion**, qui n'existait pas dans le référentiel des types de contrat.

---

## Décision

### Nouveau type de contrat (référentiel)

`INSERTION` — « Contrat d’insertion », placé après `STAGE` (ordre 7, `MANDAT` passe à 8). Ajout de données, aucune migration de schéma.

### Périodes concernées par TAHFIZ (M2, M3, M4)

Seul le code `CDI` exact est visé. Tous les emplois sont évalués, ouverts ou terminés.

Pour chaque période continue en CDI d'un emploi, la ligne propagée va :

- **du plus tardif** de : 1er jour du mois de début de l'exonération société, date de début de l'emploi, 1er jour du mois d'effet de la version de contrat où le type devient CDI ;
- **au plus précoce** de : dernier jour du mois de fin de l'exonération société, date de sortie de l'emploi, veille du 1er jour du mois d'effet de la version où le type cesse d'être CDI.

Sans aucune borne de fin, la ligne est sans fin. Intersection vide : aucune ligne. Un emploi qui repasse en CDI après une interruption reçoit une ligne par période.

Précisions d'application :

- La date de début et la date de sortie de l'emploi sont lues sur la version de contrat de plus grand mois d'effet.
- La première version d'un emploi ne « devient » pas CDI : si elle est en CDI, seule la date de début de l'emploi borne la période.
- Des versions CDI successives forment une seule période.

### Une seule fonction de calcul (M9)

`calculerLignesTahfiz(versions, periode)` (`apps/api/src/modules/salaries/tahfiz/periodes-tahfiz.ts`) est une fonction pure. Le service de propagation et le seed l'appellent tous les deux ; aucune autre copie du calcul n'existe.

### Synchronisation (M5)

La synchronisation rend les lignes `PROPAGE_SOCIETE` / `TAHFIZ` de chaque emploi égales au calcul :

- ligne calculée sans ligne existante qui la chevauche → **création** ;
- ligne existante qui chevauche une ligne calculée → **mise à jour des dates**, dans la limite des bulletins (ADR 0018 : une ligne n'est jamais rétrécie en deçà d'un bulletin existant) ;
- ligne existante sans ligne calculée → **retrait** selon la règle de l'ADR 0018 : suppression si aucun bulletin ne l'utilise, sinon clôture au dernier jour du mois en cours société. Une ligne déjà close plus tôt n'est jamais rallongée par cette clôture.

Deux synchronisations successives sans changement de données ne modifient rien. Les écritures restent en lot (`deleteMany`, `updateMany`, `createMany`).

Conséquence assumée : si un bulletin couvre une période qui n'est plus en CDI, la ligne garde la partie couverte par ce bulletin. Le résultat n'est alors pas strictement égal au calcul ; c'est la protection des bulletins de l'ADR 0018 qui l'emporte.

### Déclencheurs (M6)

Chacun dans la transaction de l'écriture qui le provoque :

| Écriture                        | Portée                         |
| ------------------------------- | ------------------------------ |
| `PUT /societes/:id/parametrage` | tous les emplois de la société |
| Création d'un emploi            | l'emploi créé                  |
| `PATCH /emplois/:id/contrat`    | l'emploi modifié               |

Pour la création et le PATCH contrat, le paramétrage applicable est celui que `resoudreLigneHistorique` donne au mois en cours de la société (règle inchangée).

### IDMAJ réservé au contrat d’insertion (M7)

Le statut `IDMAJ` ne peut être saisi que sur un emploi dont le contrat, au mois en cours du salarié, est de type `INSERTION`.

- Refus : `400`, `{ code: "STATUT_RESERVE_CONTRAT_INSERTION", message: "Le statut IDMAJ ne peut être saisi que sur un emploi en contrat d’insertion.", champ: "statutCode" }` (forme ADR 0029).
- Contrôlé à la création d'une ligne de statut, et à la modification lorsque le code passe à `IDMAJ`.
- Contrôle distinct de « statut non saisissable » et de « code inconnu », qui restent inchangés.

### Le type INSERTION est immuable (M8)

Sur `PATCH /emplois/:id/contrat`, un changement de type vers ou depuis `INSERTION` est refusé, que l'écriture écrase la version du mois ou en crée une nouvelle : il faut créer un nouvel emploi.

- Refus : `400`, `{ code: "CHANGEMENT_TYPE_CONTRAT_INSERTION", message: "Un contrat d’insertion ne peut pas changer de type : créez un nouvel emploi.", champ: "typeContratCode" }`.
- Les autres changements de type (par exemple CDD vers CDI) restent permis.

Cette règle garantit qu'une ligne IDMAJ ne se retrouve jamais sur un emploi qui n'est plus en contrat d’insertion.

---

## Conséquences

- Aucune condition d'éligibilité TAHFIZ (plafond, effectif, durée) n'est introduite.
- Le seed démontre les deux règles : l'emploi n°1 de Youssef est en contrat d’insertion (ses lignes IDMAJ sont conservées, il n'a aucune ligne TAHFIZ) ; Karim Alaoui, en CDI, porte la ligne TAHFIZ calculée par la même fonction que l'API.
- Les tests qui posaient IDMAJ sur un emploi CDI ont été réécrits sur un emploi en contrat d’insertion ; aucun contrôle n'a été relâché.
