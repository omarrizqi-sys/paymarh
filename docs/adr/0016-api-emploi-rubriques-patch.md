# ADR 0016 — API fiche emploi : rubriques PATCH calquées sur les blocs historisés

- **Statut :** accepté
- **Date :** 2026-09-03
- **Portée :** endpoints emploi (module 2, étape 2.1.b-3)

---

## Contexte

Un emploi porte trois blocs historisés (`CONTRAT`, `REMUNERATION`, `AFFECTATION_TEMPS_DE_TRAVAIL`). La spécification v5 ne détaille pas explicitement le découpage PATCH ; il fallait trancher sans chevauchement ni ambiguïté sur la décision écraser/versionner.

---

## Décision

### Trois rubriques PATCH, une par bloc

| Route                                  | Bloc Prisma                 | Contenu                                                                       |
| -------------------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| `PATCH …/contrat`                      | `EmploiContratVersion`      | Poste, dates, type contrat, essai, cadre, sortie                              |
| `PATCH …/remuneration`                 | `EmploiRemunerationVersion` | Mode salaire, montant, options bulletin, télétravail, **paiement** (écriture) |
| `PATCH …/affectation-temps-de-travail` | `EmploiAffectationVersion`  | Établissement, durée, repos, fériés, télétravail                              |

En **lecture**, `paiement` (`modePaiement`, `compteBancaireId`) est une clé JSON distincte pour le masquage (A12, E2), bien qu'en écriture elle reste dans la rubrique rémunération.

### Pourquoi une rubrique = un bloc

Quand une rubrique correspond exactement à un bloc historisé, la décision d'écraser ou de versionner porte sur un périmètre net. Une rubrique chevauchant deux blocs, ou deux rubriques partageant un bloc, rendraient cette décision ambiguë.

### Sortie (D9)

Date et motif de sortie sont dans la rubrique contrat. La confirmation exigée ne se déclenche **que** sur l'**apparition** d'une date de sortie (null → valeur). Modifier le poste ou tout autre champ sans faire apparaître une date de sortie ne demande aucune confirmation.

### Repli lecture — emploi futur (lecture seule)

En lecture agrégée (`GET /emplois/:id`, `emplois[]` dans `GET /salaries/:id`, réponses d'écriture mappées via `versEmploiComplet`), lorsqu'**aucune** version d'un bloc n'est applicable au mois en cours **et** que **toutes** les versions de ce bloc ont un `moisEffet` **strictement postérieur** au mois en cours, le serveur affiche la **première** version du bloc (plus petit `moisEffet`).

**Condition exacte du repli :** `resoudreLigneHistorique` retourne `null` **et** `∀ v ∈ versions : v.moisEffet > moisEnCours`.

**Justification :** la première version d'un bloc porté par l'emploi prend le mois de la date de début (D7), qui peut être **futur** ; sans ce repli, un emploi préparé à l'avance provoquerait une erreur (500) à la lecture. Toute autre absence de version applicable (incohérence de données) **n'est pas** masquée : le serveur lève une erreur.

**Hors périmètre du repli :** décision écraser/versionner ; `GET /emplois/:id/versions/*` (liste brute de toutes les versions, sans repli).

---

## Conséquences

- Le verrouillage optimiste porte sur la **version de l'emploi** (`If-Match`), pas sur celle du salarié.
- Les versions historiques se lisent via `GET /emplois/:id/versions/<bloc>` (mois d'effet décroissant).

---

## Alternatives rejetées

| Alternative                             | Motif                                                           |
| --------------------------------------- | --------------------------------------------------------------- |
| Rubrique `paiement` séparée en écriture | Partage le bloc REMUNERATION → décision d'historisation ambiguë |
| Rubrique `sortie` dédiée                | Même bloc CONTRAT ; confirmation partielle difficile à isoler   |
| Rubriques plus fines (ex. poste seul)   | Chevauchement du bloc CONTRAT                                   |

---

## Port référentiel national (complément)

Voir [0015-port-referentiel-national.md](./0015-port-referentiel-national.md) pour le port SMIG / durée légale.
