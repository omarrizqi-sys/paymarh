# ADR 0024 — Contrôle du droit d'écriture rémunération sur les comptes bancaires salarié

## Statut

Accepté — temps 2.b (2.1.c-2).

## Contexte

Le `PUT /salaries/:id/comptes-bancaires` remplace les coordonnées bancaires d'un salarié. C'est une rubrique de **rémunération** : l'écran exige `salarie.remuneration.ecrire` pour modifier, indépendamment de `salarie.modifier`.

Avant le temps 2.b, seul `salarie.modifier` était vérifié sur la route. L'intercepteur `MasquageRemunerationInterceptor` contrôle les clés de corps enregistrées dans `REGISTRE_CLE_RUBRIQUE` ; le corps de ce PUT s'appelle `comptes`, pas `comptesBancaires`. Un utilisateur avec `salarie.modifier` mais sans `salarie.remuneration.ecrire` pouvait réécrire les comptes bancaires.

## Décision

Le contrôle `salarie.remuneration.ecrire` est placé dans **`TableauxSalarieService.remplacerComptesBancaires`**, via `assertEcritureComptesBancairesSalarie`, au début de la méthode, avant toute validation ou écriture.

- Refus : `403 Forbidden`, message « Action non autorisée. », sans code métier — aligné sur `permission.guard.ts`.
- L'intercepteur existant **n'est pas modifié**.
- **Aucune clé `comptes`** n'est ajoutée au registre corps/clé.

## Pourquoi pas un décorateur sur la route

Le document de contexte invite à se méfier des décorateurs et des exemptions : un décorateur protège une route qu'on a pensé à annoter, pas la donnée. Import futur, modification en masse (module 6), écran de création (temps 3) pourraient contourner une protection au niveau route. Placer le contrôle dans le **service qui écrit** garantit que tout appelant présent ou futur le rencontre.

## Conséquences

- TB28 prouve le refus HTTP sur la route réelle.
- TB30 prouve que les personnes à charge ne sont pas affectées.
