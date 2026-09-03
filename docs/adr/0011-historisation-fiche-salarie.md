# ADR 0011 — Historisation de la fiche salarié

- **Statut :** accepté
- **Date :** 2026-09-02
- **Portée :** modèle de données fiche salarié (module 2, étape 2.1.a)
- **Complète :** [0006-historisation-par-mois-effet.md](./0006-historisation-par-mois-effet.md), [0008-mois-en-cours-et-date-effet.md](./0008-mois-en-cours-et-date-effet.md)

---

## Contexte

La fiche salarié regroupe des blocs de données dont certains doivent être conservés dans le temps pour permettre le recalcul de bulletins passés. La spécification v5 distingue cinq blocs historisés, portés soit par l'emploi soit par le salarié.

Deux types de contenu coexistent :

- des **champs scalaires** regroupés par bloc fonctionnel (contrat, rémunération, affectation) ;
- des **lignes répétables** (personnes à charge, retenues, avantages en nature, jours fériés travaillés).

---

## Décision

### Les cinq blocs

| Bloc | Porté par | Mécanisme |
| --- | --- | --- |
| `CONTRAT` | Emploi | table de versions (`EmploiContratVersion`) |
| `REMUNERATION` | Emploi | table de versions (`EmploiRemunerationVersion`) |
| `AFFECTATION_TEMPS_DE_TRAVAIL` | Emploi | table de versions (`EmploiAffectationVersion`) |
| `PERSONNES_A_CHARGE` | Salarié | lignes à validité temporelle (`PersonneACharge`) |
| `RETENUES` | Salarié | lignes à validité temporelle (`Pret`, `SaisieSurSalaire`) |

Les avantages en nature appartiennent au bloc `REMUNERATION` mais sont un tableau répétable : ils suivent le second mécanisme (`AvantageEnNature`).

Les jours fériés travaillés appartiennent au bloc affectation mais sont répétables : second mécanisme (`EmploiJourFerieTravaille`).

### Deux mécanismes, volontairement

1. **Versions datées par bloc** — une ligne par `(entité, moisEffet)` porte l'intégralité des champs scalaires du bloc. Unicité `(emploiId, moisEffet)`.
2. **Lignes à validité temporelle** — chaque ligne porte `moisEffetDebut` et `moisEffetFin` (`null` = en cours). Dupliquer toutes les lignes à chaque version serait absurde pour des tableaux répétables.

### Règle du mois d'effet

`moisEffet` n'est jamais saisi par l'utilisateur. Il est déduit du mois en cours du dossier (ADR 0008), **sauf pour la première version** d'un bloc historisé porté par un emploi, qui prend le mois de la date de début de cet emploi.

Les blocs portés par le salarié suivent la règle générale sans exception.

---

## Pourquoi

- **Reproductibilité des bulletins passés** : un recalcul doit retrouver le contrat, la rémunération et l'affectation en vigueur au mois concerné.
- **Granularité adaptée** : les blocs scalaires se versionnent en bloc entier (comme la fiche société) ; les tableaux répétables se closent ligne par ligne.
- **Cohérence Silae** : l'historisation par bloc entier évite les états incohérents où seul un champ d'un bloc aurait changé sans les autres.

---

## Conséquences

- L'enum `BlocHistorise` matérialise les cinq blocs pour usage applicatif ultérieur.
- Les primes contractuelles ne sont **pas** historisées : elles transitent par les éléments variables du mois.
- La résolution d'une version applicable reprend la fonction `resoudreLigneHistorique` (ADR 0006).
- Les lignes temporelles se résolvent via `moisEffetDebut` / `moisEffetFin`.

### Versionnage côté serveur (étape 2.1.b-3)

Le client envoie une modification ordinaire sur une **rubrique** ; il ne crée jamais de version ni ne fournit de date d'effet. Le serveur décide seul, pour le bloc concerné :

1. **Sans bulletin** (état ≥ calculé) au mois en cours du salarié → **écraser** la version courante résolue à ce mois.
2. **Avec bulletin** au mois en cours → **versionner** : nouvelle ligne au mois en cours, sauf si une version existe déjà à ce mois ( alors écrasement de cette ligne ).

Le mois en cours est toujours celui du **salarié** (tous emplois confondus), via `MoisEnCoursService`. La première version d'un bloc porté par un emploi prend le mois de la **date de début** de cet emploi (D7, E11).

Les bulletins lus pour cette décision passent par `BulletinPort.listerBulletinsParSalarie`. `listerBulletinsParEmploi` sert uniquement à la suppression (B5), pas à l'historisation.

Pourquoi le client n'écrit jamais une version : le front ne doit pas savoir ce qui est historisé (P3) ; une rubrique PATCH = un bloc = un périmètre net pour la décision écraser/versionner (ADR 0016).

---

## Alternatives rejetées

| Alternative | Motif |
| --- | --- |
| Historiser chaque champ salarié séparément | Explosion de tables ; incohérences inter-champs |
| Dupliquer toutes les lignes répétables à chaque version | Coût de stockage ; complexité de saisie |
| Un seul mécanisme pour tous les blocs | Inadapté aux tableaux répétables |
