# ADR 0014 — API fiche salarié : lecture unique, écriture par rubrique

- **Statut :** accepté
- **Date :** 2026-09-03
- **Portée :** endpoints salarié (module 2, étape 2.1.b-2)

---

## Contexte

La fiche salarié regroupe identité, coordonnées, identifiants légaux et dates. Certaines valeurs affichées ne sont jamais stockées : état actif/inactif, type de pièce d'identité, libellé accordé de la situation familiale, mois en cours.

---

## Décision

### Lecture en un appel

`GET /salaries/:id` rend l'intégralité du niveau salarié (champs scalaires + emplacements des collections vides en attendant le prompt 3). Le client charge la fiche une fois pour l'affichage ; les rubriques d'écriture ne fragmentent pas la lecture.

### Écriture découpée par rubrique

Quatre routes `PATCH`, alignées sur la spec v5 (« Identité, coordonnées, identifiants légaux, dates d'entrée et d'ancienneté ») :

| Route                         | Contenu                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `PATCH …/identite`            | Nom, prénom, sexe, naissance, nationalité, situation familiale |
| `PATCH …/coordonnees`         | Adresse, contacts, personne à prévenir                         |
| `PATCH …/identifiants-legaux` | Matricule, pièce, CNSS, CIMR                                   |
| `PATCH …/dates`               | Date d'entrée, date d'ancienneté                               |

Chaque rubrique correspond à un écran ou bloc de saisie ; une modification ciblée n'emporte pas les autres champs.

### Valeurs déduites recalculées à chaque lecture

| Valeur                                | Motif                                                   |
| ------------------------------------- | ------------------------------------------------------- |
| État actif/inactif                    | Dépend des emplois ouverts au moment de la consultation |
| Type de pièce (CIN / carte de séjour) | Dérivé de la nationalité courante                       |
| Libellé situation familiale           | Accordé selon le sexe (P3)                              |
| Mois en cours                         | Cascade bulletins / emplois (ADR 0012)                  |

Les stocker créerait des risques de désynchronisation avec les emplois, les bulletins ou les référentiels.

---

## Conséquences

- Le front envoie `If-Match` par rubrique modifiée ; la version salarié est partagée entre toutes les rubriques.
- Les collections (emplois, personnes à charge, etc.) arriveront au prompt 3 sans changer la forme de la réponse de lecture.

---

## Alternatives rejetées

| Alternative                        | Motif                                                     |
| ---------------------------------- | --------------------------------------------------------- |
| PATCH unique sur toute la fiche    | Couplage des écrans ; risque d'écrasement inter-rubriques |
| Stocker l'état ou le type de pièce | Violation des règles de stockage de la spec v5            |
| Mois en cours saisi                | Décision 5d / ADR 0012                                    |
