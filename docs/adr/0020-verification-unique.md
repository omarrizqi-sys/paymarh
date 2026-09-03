# ADR 0020 — Vérification unique (`pnpm verify`)

- **Statut :** accepté
- **Date :** 2026-09-03
- **Portée :** discipline de qualité du monorepo (lint, format, types, tests, imports)

---

## Contexte

Le dépôt documentait **deux listes de vérification contradictoires** :

- le **README** enchaînait `lint`, `format:check`, `typecheck`, `test` et `check:circular` ;
- **docs/DEVELOPMENT.md** omettait `typecheck` et proposait une autre combinaison (`lint`, `test`, `check:circular`, `build`).

La seconde liste a vraisemblablement servi de référence lors de la livraison de l'étape 2.1.b. Résultat : **25 erreurs TypeScript** se sont accumulées dans 10 fichiers, invisibles parce qu'aucune commande utilisée comme critère d'acceptation ne lançait `pnpm typecheck`.

Chaque commande couvre un angle mort des autres :

| Commande         | Ce qu'elle vérifie                                 | Ce qu'elle ne détecte pas                                                             |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `lint`           | Règles ESLint (style, patterns interdits, imports) | Erreurs de typage TypeScript, formatage Prettier, régressions métier, cycles d'import |
| `format:check`   | Conformité Prettier                                | Typage, logique, tests, cycles                                                        |
| `typecheck`      | Cohérence des types en mode strict                 | Comportement à l'exécution, formatage, cycles                                         |
| `test`           | Comportement attendu (unitaire + intégration HTTP) | Erreurs de typage si les tests ne touchent pas le fichier, formatage, cycles          |
| `check:circular` | Imports circulaires entre modules sources          | Typage, formatage, logique métier                                                     |

Aucune ne remplace une autre. Omettre `typecheck` d'une liste « officielle » rend les erreurs de typage **structurellement ignorables**.

---

## Décision

### Un seul point de vérification

Créer à la racine du monorepo un script **`verify`** qui enchaîne, dans cet ordre et en s'arrêtant à la première échec :

1. `pnpm lint`
2. `pnpm format:check`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm check:circular`

L'ordre place les vérifications les plus rapides en tête : une erreur de lint ou de format est détectée en secondes, sans attendre la compilation TypeScript ni la suite de tests.

### Documentation alignée

Le **README** et **docs/DEVELOPMENT.md** désignent **`pnpm verify`** comme unique critère de fin de module. Aucune liste de commandes recopiée à la main n'apparaît ailleurs : toute divergence future serait immédiatement visible en comparant la doc au script `verify` du `package.json` racine.

Les commandes individuelles (`lint`, `typecheck`, etc.) restent disponibles pour un diagnostic ciblé pendant le développement, mais **ne constituent plus un critère d'acceptation autonome**.

---

## Conséquences

- Une régression de typage en mode strict ne peut plus passer inaperçue si `pnpm verify` est exécuté avant validation.
- Toute modification de la barre qualité se fait en **un seul endroit** (`package.json` → script `verify`).
- Les 25 erreurs corrigées lors de l'introduction de ce script prouvent le risque concret de listes divergentes ; ce ADR enregistre la leçon pour les modules suivants.
