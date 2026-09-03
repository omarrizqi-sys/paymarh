# ADR 0017 — Résolution de l'héritage (fiche salarié)

- **Statut :** accepté
- **Date :** 2026-09-03
- **Portée :** module 2, étape 2.1.b-5

---

## Contexte

Les paramètres de temps de travail et de télétravail peuvent être portés par l'emploi, l'établissement, la société ou le référentiel national. L'écran doit montrer à la fois la valeur propre saisie (y compris vide) et la valeur effective après héritage, avec son origine.

---

## Décision

### Cascade SAL > ETB > SOC > NAT (D9)

Pour chaque champ héritable, le premier niveau qui porte une valeur non nulle l'emporte. Le niveau national passe par `ReferentielNationalPort` (aucune table en phase 2, D11). Aucun champ héritable de la v7 n'est porté au niveau société : la case SOC reste vide dans la cascade actuelle.

### Case vide = héritée (D8, R26)

Un champ héritable est toujours nullable en base. `null` signifie « hérité », jamais « non renseigné ». Il n'y a pas de case à cocher d'héritage, ni de bouton « tout hériter » (Y6).

### Forme parallèle de la réponse

La lecture rend la valeur propre telle qu'elle est (`null` compris) et un objet `resolutions` parallèle. La valeur résolue n'est **jamais** écrite dans le champ : le client distingue sans ambiguïté « vide, voici ce dont j'hérite » de « cette valeur est propre ».

### Absence de valeur (P6)

Si aucun niveau ne porte de valeur, la résolution rend l'absence (`null` dans `resolutions`). Aucun défaut n'est inventé (pas de semaine type, pas de durée légale codée en dur).

### Exception des jours fériés travaillés (A15, T2)

Le modèle « case vide = héritée » ne convient pas aux cases à cocher. Un booléen `suivreJoursFeriesEtablissement` (défaut `true`) porte l'intention : tant qu'il est vrai, l'emploi suit l'établissement ; à faux, il porte sa propre grille, y compris entièrement vide, sans confusion avec un héritage.

### Moteur de paie

La résolution construit un jeu de paramètres effectifs en amont. Le moteur reste vide en phase 2 : il n'est ni appelé ni alimenté.

---

## Conséquences

- `GET /emplois/:id` et les emplois de `GET /salaries/:id` exposent `resolutions`.
- Le contrôle C24 (repos vs grille) s'appuie sur la grille **résolue**.
- Les résolutions portant sur la rémunération suivent le masquage déclaratif.
