# ADR 0022 — Propagation de version hors séquence et lecture partielle des réponses tableau

- **Date :** 2026-09-07
- **Statut :** accepté
- **Contexte :** étape 2.1.c-2, temps 2.a

## Contexte

La fiche salarié partage un numéro de version unique entre toutes les rubriques (verrouillage optimiste, ADR 0013). Au temps 2.a, seul le bouton **Enregistrer** faisait circuler ce numéro, rubrique par rubrique, le long d'une séquence PATCH.

Les tableaux répétables introduisent une **suppression immédiate** : elle part hors de la séquence Enregistrer et incrémente la version côté serveur dès la confirmation. Sans propagation, la rubrique suivante enregistrée partirait avec un numéro périmé et provoquerait un `CONFLIT_VERSION` que l'utilisateur ne comprendrait pas.

Par ailleurs, les routes POST, PATCH et DELETE des tableaux renvoient la **fiche entière** relue en base. Appliquer cette fiche en bloc écraserait silencieusement la saisie non enregistrée des autres rubriques — le même défaut corrigé au temps 1-bis, sous une autre forme.

## Décision

### Lecture partielle des réponses d'écriture tableau

Après un POST, PATCH ou DELETE de ligne, l'écran ne retient que :

1. le **nouveau numéro de version** ;
2. la **ligne portant l'identifiant concerné** par l'appel (ou la ligne nouvellement créée pour un POST).

Tout le reste de la fiche renvoyée est ignoré.

Raison : les autres rubriques peuvent porter une saisie locale non enregistrée ; la fiche serveur contient les valeurs en base, donc les anciennes.

Exception conservée pour la ligne concernée : une suppression peut rendre la ligne **inactive** (mois de fin) au lieu de la retirer ; l'écran doit refléter cet état.

### Propagation hors séquence

Le registre de la fiche expose `signalerVersionApresEcritureHorsSequence(nouvelleVersion)`, appelé après chaque suppression immédiate réussie. Il propage le numéro à **toutes** les rubriques déclarées, comme après un enregistrement global réussi.

## Conséquences

- Les rubriques scalaires (identité, coordonnées…) continuent d'appliquer uniquement leur tranche de réponse PATCH, comme au temps 1.
- Les rubriques tableau appliquent la même règle, étendue à la ligne concernée.
- Le test T18 vérifie qu'une saisie non enregistrée dans une autre rubrique survit à une écriture de tableau.
