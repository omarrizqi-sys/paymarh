# ADR 0025 — Deux formes de saisie sur salaire selon le type

- **Date :** 2026-09-08
- **Statut :** accepté
- **Contexte :** étape 2.1.c-2, temps 2.c-0

## Contexte

Les saisies sur salaire regroupaient jusqu’ici un montant total et un montant mensuel obligatoires, avec un contrôle C17 (`MONTANT_MENSUEL_SUPERIEUR_TOTAL`) comparant les deux. Or la réglementation marocaine distingue deux réalités :

1. **Pension alimentaire** — montant mensuel fixé par décision de justice ; pas de plafond « total » saisi.
2. **Saisie à tiers détenteur** — le montant réellement prélevé dépend de la quotité saisissable (article 387 du code du travail) ; il se **calcule au bulletin**, pas à la saisie.

Ces deux figures n’ont pas la même forme de données. Les regrouper sous les mêmes champs obligatoires forçait soit des valeurs fictives, soit un contrôle C17 devenu sans fondement dès que les montants divergent par nature.

## Décision

### Référentiel `TypeSaisieSurSalaire`

Deux entrées ordonnées (extensibles sans migration de schéma) : `PENSION_ALIMENTAIRE`, `TIERS_DETENTEUR`. Lecture via `GET /referentiels/types-saisie-sur-salaire`, sur le modèle de `LienParente`.

### Champs conditionnels

Chaque ligne porte `typeSaisieCode` (comme `lienParenteCode` sur une personne à charge). Les montants sont **nullables** en base : une pension n’a pas de `montantTotal`, une saisie à tiers détenteur n’a pas de `montantMensuel`.

| Champ          | Pension    | Tiers détenteur |
| -------------- | ---------- | --------------- |
| montantMensuel | requis     | interdit        |
| montantTotal   | interdit   | requis          |
| moisFin        | facultatif | interdit        |

`moisFin` (donnée métier, format AAAA-MM) ne doit pas être confondu avec `moisEffetFin` (historisation, serveur seul).

### Validations

- Champ **interdit** envoyé → `CHAMP_INTERDIT` avec le nom du champ (jamais ignoré silencieusement).
- Champ **obligatoire** absent sur l’état résultant (création ou modification, y compris changement de type) → `CHAMP_OBLIGATOIRE`.
- En modification, les règles s’apprécient sur l’**état fusionné** ligne + corps.
- Lors d’un changement de type, l’API remet à `null` les montants et `moisFin` devenus incompatibles **sans refuser la requête** : ce nettoyage est volontairement silencieux côté serveur ; l’avertissement à l’utilisateur est à la charge de l’écran (prompt 2.c-2), conformément au principe 8 (l’API seule juge la compatibilité).

### Retrait de C17

Le contrôle C17 (`MONTANT_MENSUEL_SUPERIEUR_TOTAL`) comparait le montant mensuel au montant total. Ces deux montants **ne coexistent plus jamais** sur une même ligne : une pension alimentaire n’a pas de `montantTotal`, une saisie à tiers détenteur n’a pas de `montantMensuel`. Le contrôle est donc devenu **impossible à déclencher**. Un contrôle correct qu’aucun chemin réel n’atteint est plus dangereux qu’une absence de contrôle — il laisse croire à une protection qui n’existe plus. C17 est supprimé du registre et du code. Aucun plafond de remplacement n’est introduit côté fiche salarié : la quotité saisissable relève du module bulletin (module 4).

## Conséquences

- Les nullable sur `montantTotal` / `montantMensuel` ne sont pas un relâchement : ils expriment l’exclusion mutuelle imposée par le type.
- L’écran des saisies (prompt 2.c-2) consommera le référentiel et adaptera le formulaire au type choisi.
- Migration : les lignes existantes en développement sont rattachées à `TIERS_DETENTEUR` avec `montantMensuel` mis à null.
