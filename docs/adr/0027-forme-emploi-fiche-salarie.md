# ADR 0027 — Forme de l'emploi dans la fiche salarié

- **Date :** 2026-09-09
- **Statut :** accepté
- **Contexte :** temps 3, prompt 3-0 ; corrigé le même jour (correctif du 3-0)

## Contexte

`FicheSalarie.emplois` était typé `EmploiFicheNonType` = `Record<string, unknown>` : un objet dont on ne savait rien. Ce n'était pas un oubli. Personne ne lisait encore ce tableau côté écran ; le typer trop tôt aurait figé un contrat sans consommateur. L'alias était **nommé** pour qu'une recherche le retrouve, pas pour servir de type.

Les écrans d'emploi arrivent à l'étape suivante. Découvrir la forme au moment d'écrire les écrans mélangerait deux natures de travail : concevoir l'UI et transcrire un contrat déjà produit par l'API.

## Décision

`EmploiFicheNonType` disparaît. Il est remplacé par `EmploiFiche`, transcription de ce que le code produit réellement :

- `versEmploiComplet` (identité, contrat, rémunération, paiement, affectation, **et les trois collections**) ;
- l'objet `resolutions`, ajouté par les **trois** chemins qui servent un emploi : `listerEmploisPourFicheSalarie`, `avecResolutions`, `reponseEmploi` ;
- `operations` ajouté uniquement par `enrichirFicheSalarie` sur le chemin **GET** `/salaries/:id`.

Aucun champ inventé, aucun champ omis, aucun renommage, aucune réorganisation.

Les types annexes atteignables depuis cette forme (`ResolutionChamp`, `NiveauHeritage`, `ResolutionsEmploi`, unions Prisma transcrites : statut cadre, mode de détermination du salaire, mode de paiement, base de saisie de la durée, origine d'un statut particulier) vivent dans `packages/shared-types`. L'API pointe dessus. Pas de seconde définition.

### Blocs masquables : optionnels, jamais nullables

Sans la permission `salarie.remuneration.lire`, l'intercepteur **retire la clé** : `remuneration`, `paiement`, `primesContractuelles`, `avantagesEnNature`. Une clé masquée est absente de la réponse, jamais `null`. Un `| null` mentirait sur le contrat et pousserait l'écran à tester la mauvaise chose (`=== null` au lieu de `'cle' in objet` / `=== undefined`).

### Correctif : une seule signification pour l'absence

La première version de cet ADR déclarait `statutsParticuliers` et `resolutions` optionnels, et affirmait à tort que `resolutions` n'était ajouté que par `listerEmploisPourFicheSalarie`. Ces deux choix reproduisaient le défaut que le prompt 3-0 venait de retirer du champ `etat` : une même forme (clé absente) pour deux significations sans rapport.

#### Branche `return base` de `versEmploiComplet`

Introduite au commit `90b4b13` (temps 2.1.b-4, 2026-09-03), lorsque les collections ont été greffées sur un mapper qui n'en avait pas. Si les trois relations Prisma étaient `undefined`, la fonction renvoyait un objet sans `primesContractuelles`, `avantagesEnNature` ni `statutsParticuliers`.

Cette branche n'avait **aucun appelant** : les trois appels chargent l'emploi avec `INCLUDE_COLLECTIONS_EMPLOI`, Prisma pose donc les relations comme tableaux (éventuellement vides), jamais `undefined`. Son intention d'origine n'a pas pu être établie. Elle est retirée comme code mort daté. `versEmploiComplet` retourne désormais toujours les trois collections.

#### `statutsParticuliers` et `resolutions` obligatoires

- `statutsParticuliers` n'est ni masquable (absent du registre des rubriques de rémunération) ni omis par un chemin.
- `resolutions` est ajouté par les trois chemins qui servent un emploi au client.

Les déclarer optionnels laissait croire qu'une clé absente pouvait signifier « ce chemin ne les remplit pas ». Ce n'est plus vrai.

#### Règle qui en résulte

Dans `EmploiFiche`, un champ optionnel signifie **« masqué faute de la permission `salarie.remuneration.lire` »**, à l'unique exception d'`operations` : présent sur GET `/salaries/:id` uniquement, où l'enrichisseur le pose ; absent partout ailleurs, y compris sur GET `/emplois/:id`. Ce n'est pas un masquage de droits. Un changement d'API qui poserait `operations` sur les autres chemins est un point ouvert, hors de ce correctif.

Le mapper `versEmploiComplet` ne pose pas `resolutions` : ce n'est plus `EmploiFiche` à lui seul. Les appelants l'ajoutent avant la réponse HTTP.

## Conséquences

- `FicheSalarie.emplois` est `readonly EmploiFiche[]`.
- Les lignes d'avantages en nature et de statuts particuliers portent `etat: EtatLigneFiche` (trois valeurs, ADR 0026).
- Les écrans d'emploi (prompts suivants) consomment cette forme ; ils ne la redécouvrent pas.
