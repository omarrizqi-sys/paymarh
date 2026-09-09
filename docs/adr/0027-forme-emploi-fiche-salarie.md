# ADR 0027 — Forme de l'emploi dans la fiche salarié

- **Date :** 2026-09-09
- **Statut :** accepté
- **Contexte :** temps 3, prompt 3-0

## Contexte

`FicheSalarie.emplois` était typé `EmploiFicheNonType` = `Record<string, unknown>` : un objet dont on ne savait rien. Ce n'était pas un oubli. Personne ne lisait encore ce tableau côté écran ; le typer trop tôt aurait figé un contrat sans consommateur. L'alias était **nommé** pour qu'une recherche le retrouve, pas pour servir de type.

Les écrans d'emploi arrivent à l'étape suivante. Découvrir la forme au moment d'écrire les écrans mélangerait deux natures de travail : concevoir l'UI et transcrire un contrat déjà produit par l'API.

## Décision

`EmploiFicheNonType` disparaît. Il est remplacé par `EmploiFiche`, transcription de ce que le code produit réellement :

- `versEmploiComplet` (identité, contrat, rémunération, paiement, affectation, et éventuellement les collections) ;
- l'objet `resolutions` ajouté par `listerEmploisPourFicheSalarie` (lecture complète, pas le mapper de base) ;
- `operations` ajouté uniquement par `enrichirFicheSalarie` sur le chemin **GET** `/salaries/:id`.

Aucun champ inventé, aucun champ omis, aucun renommage, aucune réorganisation.

Les types annexes atteignables depuis cette forme (`ResolutionChamp`, `NiveauHeritage`, `ResolutionsEmploi`, unions Prisma transcrites : statut cadre, mode de détermination du salaire, mode de paiement, base de saisie de la durée, origine d'un statut particulier) vivent dans `packages/shared-types`. L'API pointe dessus. Pas de seconde définition.

### Blocs masquables : optionnels, jamais nullables

Sans la permission `salarie.remuneration.lire`, l'intercepteur **retire la clé** : `remuneration`, `paiement`, `primesContractuelles`, `avantagesEnNature`. Une clé masquée est absente de la réponse, jamais `null`. Un `| null` mentirait sur le contrat et pousserait l'écran à tester la mauvaise chose (`=== null` au lieu de `'cle' in objet` / `=== undefined`).

`operations` suit la même règle : présent sur GET, absent des réponses d'écriture. Optionnel, jamais nullable.

`statutsParticuliers` et `resolutions` sont optionnels pour la même raison de transcription : `versEmploiComplet` peut omettre les collections, et `resolutions` n'est ajouté que par la lecture complète.

Le mapper `versEmploiComplet` déclare `EmploiFiche` comme type de retour, sans conversion forcée.

## Conséquences

- `FicheSalarie.emplois` est `readonly EmploiFiche[]`.
- Les lignes d'avantages en nature et de statuts particuliers portent `etat: EtatLigneFiche` (trois valeurs, ADR 0026).
- Les écrans d'emploi (prompts suivants) consomment cette forme ; ils ne la redécouvrent pas.
