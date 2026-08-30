# ADR 0010 — Serveur source de vérité

- **Date :** 2026-08-30
- **Statut :** Accepté
- **Module :** transversal (complète ADR 0009)

## Contexte

PaymaRH applique le principe **API d'abord** : toute règle de paie, validation, calcul ou contrôle d'unicité vit côté serveur. L'ADR 0009 interdit au front de **rejouer** une règle métier. Ce document généralise la règle à **tout** calcul et **tout** contrôle.

## Décision

1. **Tout calcul et tout contrôle sont exécutés côté serveur.** Le front n'en rejoue aucun.
2. **Ce que le front calcule pour l'affichage n'a aucune valeur métier.** Un total affiché, un indicateur de cohérence ou un formatage ne préempte jamais la décision du serveur.
3. **Le serveur revalide toujours ce qu'il reçoit.** Aucune valeur calculée ou agrégée envoyée par le client n'est acceptée sans recalcul et vérification indépendants.

### Exemple immédiat : grille horaire

Le « total de contrôle » affiché dans le back-office est un **indicateur visuel** (decimal.js, somme des cellules). À l'enregistrement :

- l'API **recalcule** la somme à partir des lignes `horaireDefautLignes` ;
- si un `totalControle` est transmis, il est **comparé** au total recalculé et **rejeté** en cas d'écart ;
- seules les lignes individuelles sont persistées.

## Conséquences

- Les écrans peuvent afficher des totaux ou des prévisualisations ; ils ne bloquent jamais ni ne valident une saisie au nom du métier.
- Toute nouvelle saisie structurée (grilles, tableaux, montants dérivés) doit être validée côté API à partir des éléments atomiques.
- Les tests d'intégration HTTP exigent PostgreSQL ; une base absente **fait échouer** `pnpm test` avec un message explicite.

## Références

- [ADR 0009 — Front sans règle métier](./0009-front-sans-regle-metier.md)
- [07-ecrans-fiche-societe.md](../modules/module-1-fiches/07-ecrans-fiche-societe.md)
