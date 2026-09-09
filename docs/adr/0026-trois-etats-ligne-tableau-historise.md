# ADR 0026 — Trois états d'une ligne de tableau historisée

- **Date :** 2026-09-09
- **Statut :** accepté
- **Contexte :** temps 3, prompt 3-0

## Contexte

Les lignes à validité temporelle (personnes à charge, prêts, saisies sur salaire, avantages en nature, statuts particuliers) portent un champ `etat` **déduit à la lecture**, jamais stocké. Jusqu'ici l'union était `'ACTIVE' | 'INACTIVE'`.

La valeur `'INACTIVE'` recouvrait **deux situations sans rapport** :

1. une ligne **clôturée** par historisation (`moisEffetFin` renseigné, ligne terminée) ;
2. une ligne **pas encore effective** au mois en cours du salarié (`moisEffetDebut` postérieur à ce mois, `moisEffetFin` resté `null`).

L'écran a dû distinguer les deux en testant un second champ (`etat === 'INACTIVE' && moisEffetFin !== null`). L'API, elle, restait ambiguë : un import, un export ou le module de déclarations qui lirait `etat` seul reproduirait exactement l'erreur déjà vue à l'écran (lignes seed de démonstration affichées comme clôturées alors qu'elles sont modifiables).

## Décision

L'union `EtatLigneFiche` devient trois valeurs, sans alias vers l'ancienne :

```ts
type EtatLigneFiche = 'ACTIVE' | 'PAS_ENCORE_EFFECTIVE' | 'CLOTUREE';
```

`deduireEtatLigne` produit ces trois valeurs **dans le même ordre d'évaluation qu'auparavant** :

1. `moisEffetDebut > moisEnCours` → `'PAS_ENCORE_EFFECTIVE'` (était `'INACTIVE'`)
2. `moisEffetFin !== null && moisEffetFin <= moisEnCours` → `'CLOTUREE'` (était `'INACTIVE'`)
3. sinon → `'ACTIVE'`

Une ligne à la fois « commence plus tard » et « déjà terminée » est une donnée incohérente. Conserver l'ordre actuel fige le comportement dans ce cas : c'est encore la première branche qui gagne.

Côté écran, `estLigneTableauCloturee` compare à `'CLOTUREE'`. Le libellé utilisateur **ne change pas** : une ligne clôturée affiche toujours « inactive depuis MM/AAAA ».

Aucune colonne Prisma, aucun DTO, aucune valeur de seed : `etat` n'a jamais été stocké.

## Trace de la valeur retirée

**`'INACTIVE'` n'existe plus** pour les lignes de tableau historisées. Elle a été retirée parce qu'elle collait deux situations distinctes sous un seul mot, et que le second champ (`moisEffetFin`) devait alors porter une distinction que le contrat aurait dû exprimer lui-même.

Un lecteur qui trouverait trois valeurs là où une documentation plus ancienne en annonçait deux (`ACTIVE` / `INACTIVE`) ne doit pas y voir une dérive : c'est le remplacement volontaire de `'INACTIVE'` par `'PAS_ENCORE_EFFECTIVE'` et `'CLOTUREE'`. Hors les documents de reprise figés (`docs/PaymaRH-Contexte-Reprise-*.md`, non modifiés ici), ce document est le seul endroit du dépôt où `'INACTIVE'` continue d'apparaître **pour ces tableaux**, afin de conserver cette trace.

Les autres `'INACTIVE'` du dépôt (état de dossier d'une société, etc.) sont des homonymes : ils n'ont aucun rapport avec les lignes de tableau.

## Conséquences

- Cinq tableaux passent aux trois valeurs : les trois du salarié et les deux de l'emploi.
- L'écran n'a plus besoin du couple `etat` + `moisEffetFin` pour savoir si une ligne est clôturée. Le contrôle de nullité sur `moisEffetFin` reste dans le formatage du libellé : le type ne garantit pas que `'CLOTUREE'` implique un mois de fin.
- Les ADRs 0011 et 0018, et la description API des tableaux, utilisent désormais `'CLOTUREE'` / `'PAS_ENCORE_EFFECTIVE'`.
