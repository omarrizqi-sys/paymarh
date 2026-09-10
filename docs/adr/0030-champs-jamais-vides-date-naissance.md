# ADR 0030 — Trois champs jamais vides, date de naissance facultative

- **Date :** 2026-09-10
- **Statut :** accepté
- **Contexte :** étape 2.1.c, temps 3, prompt 3-1-API

## Contexte

Pour un salarié du secteur privé marocain, un dossier sans nom n’est pas une fiche incomplète : c’est une donnée fausse. Le DTO de création n’avait que `@IsString` et `@MaxLength` sur `nom` et `prenom`. Un `POST` avec `nom: ""` et des dates valides répondait 201. Le même trou existait au `PATCH` d’identité.

`dateNaissance` était obligatoire au `POST` et facultative au `PATCH`. Un cabinet qui reprend un dossier ancien peut ne pas l’avoir. L’obliger pousserait à inventer une date.

## Décision

### Les trois champs qui ne peuvent jamais être vides

`nom`, `prenom`, `dateEntree`. Une chaîne vide, et une chaîne ne contenant que des espaces, sont refusées (`CHAMP_OBLIGATOIRE`, structure de l’ADR 0029). Le trim des espaces en bordure suit le traitement déjà en place pour le matricule.

Le sexe l’est aussi, mais il est protégé par construction : énumération fermée `HOMME` | `FEMME`, liste sans option vide, valeur initiale `HOMME` à la création.

### Vide n’est pas absence

- **Création** : les trois champs doivent être **présents** et **non vides**.
- **Modification** : un champ **absent** du corps est normal — une modification n’envoie que ce qui change. Ce qu’on refuse, c’est un champ envoyé **explicitement vide**. Rendre ces champs obligatoires au `PATCH` casserait chaque enregistrement d’une autre rubrique.

Aucune contrainte de base, aucune migration de données. Les trois colonnes restent ce qu’elles sont en PostgreSQL.

### `dateNaissance` devient facultative à la création

Même régime qu’à la modification. Un dossier repris sans date de naissance se crée. L’astérisque disparaît de l’écran de création et de la fiche.

Conséquence en base : la colonne `Salarie.dateNaissance` devient nullable. Sans cela, le `POST` sans date échouerait après la validation, en violation Prisma. Ce n’est pas un nettoyage de données : les lignes existantes conservent leur date.

Quand la date est absente, un calcul qui en dépend **ne se fait pas**. Rien n’est inventé. Le rapprochement par réembauche (nom + prénom + date, ou pièce d’identité) ne s’exécute pas si ni date ni pièce n’est fournie. L’homonyme (nom + prénom parmi les salariés actifs) ne dépend pas de la date. Le calcul d’âge (`ENFANT_AGE_DEPASSE`) ne porte que sur les personnes à charge, dont la date de naissance reste obligatoire.

## Conséquences

- Le DTO de création exige `nom`, `prenom`, `dateEntree` non vides ; `dateNaissance` est omise si vide.
- Le DTO de modification refuse `nom` / `prenom` / `dateEntree` envoyés vides, et ignore leur absence.
- La fiche et la création affichent le refus sous le champ désigné.
