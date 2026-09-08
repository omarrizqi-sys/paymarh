# ADR 0023 — PUT groupé : reprise intégrale du bloc en réponse et rattachement des alertes par position

## Statut

Accepté — temps 2.b (2.1.c-2).

## Contexte

La règle générale §11.4 dit que l'écran ne retient d'une réponse d'écriture que le numéro de version et la ligne concernée par l'appel. Les tableaux ligne par ligne (personnes à charge, prêts, saisies) s'y conforment.

Les comptes bancaires salarié sont différents : un seul `PUT /salaries/:id/comptes-bancaires` remplace **toute** la liste. Il n'existe pas « une » ligne concernée ; les lignes nouvelles n'ont d'identifiant qu'après la réponse ; les alertes reviennent avec `indexLigne` (position dans le tableau **envoyé**, pas un id).

## Décision

Pour la rubrique **Comptes bancaires**, et pour elle seule :

1. Après un enregistrement réussi, l'écran retient le **numéro de version** et **l'intégralité du bloc `comptesBancaires`** de la réponse. Aucune autre rubrique de la fiche renvoyée n'est appliquée.

2. En cas de refus métier `400`, la saisie locale est **intégralement conservée** ; la séquence d'enregistrement continue.

3. Les alertes avec `indexLigne` sont rattachées à la ligne correspondante du tableau **tel qu'il vient d'être envoyé**. L'écran conserve ce tableau jusqu'à la réponse, puis applique le bloc renvoyé en cas de succès.

4. Une alerte sans `champ` ni `indexLigne` (ex. somme des parts ≠ 100 %) s'affiche en tête de la rubrique.

## Conséquences

- TB11 monte deux rubriques réelles pour prouver qu'une autre saisie non enregistrée n'est pas écrasée.
- Le verrouillage de la rubrique pendant l'enregistrement global est requis : une modification pendant l'aller-retour déplacerait les positions des alertes.
- La suppression différée des comptes bancaires passe par `strategieSuppression` de l'enveloppe (confirmation + callback). L'enveloppe **ne connaît aucun mode de suppression** — voir CONVENTIONS §13.
