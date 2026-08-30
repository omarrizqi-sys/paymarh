# ADR 0009 — Front sans règle métier

- **Date :** 2026-08-30
- **Statut :** Accepté
- **Module :** 1 — Fiches, étape 1.1.c

## Contexte

PaymaRH applique le principe **API d’abord** : toute règle de paie, validation bloquante, calcul ou contrôle d’unicité vit côté serveur. Le back-office est un client qui affiche ce que l’API décide.

## Décision

Le front **ne rejoue jamais** une règle métier :

- Un champ est bloqué ou modifiable parce que l’API le dit (via erreur, avertissement ou permission), pas parce que le front a recalculé une condition métier.
- Un doublon ou un conflit affiche le **message exact** renvoyé par l’API (`VALEUR_INDISPONIBLE` reste neutre).
- Les heures mensuelles déduites de l’hebdomadaire sont calculées par l’API, pas par le navigateur.

## Exceptions admises (deux seulement)

1. **Confort de saisie** — masquer un champ non pertinent, indiquer un format attendu (ex. code postal marocain), empêcher les lettres dans un champ numérique. Aucune conséquence métier.
2. **Affichage conditionnel de structure** — reproduire la disposition du formulaire de la spec (ex. date d’inactivité si état inactive, dates d’exonération si type choisi). Ces fonctions vivent dans `lib/affichage/conditions.ts` et ne valident rien.

## Conséquences

- Si un écran a besoin d’une nouvelle règle, **l’API doit l’exposer** (champ, code, permission) plutôt que de la coder dans React.
- Les montants et durées passent par **decimal.js** ; `parseFloat` et `Math.round` restent interdits (ESLint).
- Les tests `conformite-front.spec.ts` scannent le code source pour détecter les régressions.

## Références

- [04-api-fiche-societe.md](../modules/module-1-fiches/04-api-fiche-societe.md)
- [06-validation-et-avertissements.md](../modules/module-1-fiches/06-validation-et-avertissements.md)
- [07-ecrans-fiche-societe.md](../modules/module-1-fiches/07-ecrans-fiche-societe.md)
