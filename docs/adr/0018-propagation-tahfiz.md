# ADR 0018 — Propagation de l'exonération TAHFIZ

- **Statut :** accepté
- **Date :** 2026-09-03
- **Portée :** module 2 (propagation) + déclenchement depuis le module 1 (paramétrage société)

---

## Contexte

En règle générale, la société porte l'éligibilité à une exonération et la fiche salarié désigne les bénéficiaires (D12). TAHFIZ est une **exception nommée** (T7) : l'exonération concerne l'entreprise, pas un choix salarié par salarié.

---

## Décision

### Qui est concerné

Les salariés ayant **au moins un emploi ouvert**. Un salarié dont tous les emplois sont clos ne reçoit rien. « Existants et futurs » désigne l'effectif présent : les salariés créés ensuite reçoivent la ligne à la création de leur emploi ouvert.

Un salarié qui sort pendant la période conserve sa ligne : elle justifie les bulletins passés.

### Activation et dates

Activer TAHFIZ sur la société crée une ligne de statut particulier (`origine = PROPAGE_SOCIETE`) sur chaque emploi ouvert. Les dates suivent l'exonération société.

Un changement de dates de l'exonération s'enregistre toujours sur la société : l'écriture n'est pas bloquée. Les lignes déjà propagées suivent ces nouvelles dates **dans la limite des bulletins déjà produits**. Le début d'une ligne ne peut pas devenir postérieur au premier mois couvert par un bulletin, et la fin ne peut pas devenir antérieure au dernier. Une ligne n'est jamais rétrécie en deçà d'un bulletin existant (B4 / E4). Sans bulletin sur la période retirée, les nouvelles dates s'appliquent intégralement.

Le code `TAHFIZ` existe comme statut **technique** pour la clé étrangère ; il n'est pas saisissable (seul IDMAJ l'est en phase 2).

### Retrait (Z13)

- Ligne jamais utilisée par un bulletin → **suppression**.
- Ligne déjà utilisée → **inactivation** : `dateFin` au dernier jour du mois en cours société (B4 / E4), pour conserver la justification des bulletins.

L'existence des bulletins se lit via `BulletinPort`.

### Lecture seule

Une ligne propagée ne peut être ni modifiée ni supprimée depuis la fiche salarié.

### Dates civiles et état en lecture

Les lignes de statut particulier portent des **dates civiles** (`dateDebut` / `dateFin`) : c'est un héritage du schéma de l'étape 2.1.a. Les autres tableaux historisés portent des **mois**. Le schéma n'est pas unifié.

En lecture uniquement, une ligne de statut expose `etat` (`ACTIVE` | `INACTIVE`), dérivé de ses dates civiles converties en mois et du mois en cours du salarié, avec le même vocabulaire que les autres tableaux. Aucun champ n'est stocké ; aucune écriture, aucune migration.

### Transaction unique

Activation, changement de dates et retrait s'exécutent dans **la même transaction** que l'écriture du paramétrage société. Une propagation partielle laisserait l'effectif dans un état faux.

Les lignes sont posées en **une seule instruction** (`createMany`). Il n'existe donc aucun état intermédiaire où une partie de l'effectif serait traitée et l'autre non. Le test couvre l'annulation d'ensemble (paramétrage et lignes reviennent ensemble). L'état partiel n'est pas testé parce qu'il n'est pas atteignable.

Cette garantie tient à l'écriture en lot. Si la propagation devenait un jour itérative, salarié par salarié, la note ne vaudrait plus et un test d'interruption deviendrait nécessaire.

### Volumétrie

Les écritures sont des opérations d'ensemble (`createMany` / `updateMany` / `deleteMany`). Aucune file d'attente ni tâche de fond.

---

## Conséquences

- Seul le déclenchement dans `PUT /societes/:id/parametrage` touche au module 1.
- Aucune route d'exemption supplémentaire n'est ajoutée.
