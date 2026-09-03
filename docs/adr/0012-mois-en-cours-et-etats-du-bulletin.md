# ADR 0012 — Mois en cours et états du bulletin (fiche salarié)

- **Statut :** accepté
- **Date :** 2026-09-03
- **Portée :** fiche salarié, étape 2.1.b

---

## Contexte

Le mois en cours d'un salarié pilote le `moisEffet` des écritures historisées (ADR 0008, 0011). Il ne peut pas être saisi ni stocké : le recalculer à chaque lecture évite qu'une valeur figée diverge silencieusement de la réalité des bulletins et des emplois.

Le module 2 (traitement du mois) possédera la table des bulletins. À ce stade, seul un port est défini ; une implémentation provisoire renvoie une liste vide.

---

## États du bulletin

| Valeur | Nom            | Stocké en base |
| ------ | -------------- | -------------- |
| 0      | NON_CALCULABLE | Non (déduit)   |
| 1      | CALCULABLE     | Non (déduit)   |
| 2      | CALCULE        | Oui            |
| 3      | VALIDE         | Oui            |
| 4      | EDITE          | Oui            |

Seuls les états 2, 3 et 4 correspondent à une ligne existante. Les états 0 et 1 se déduisent de l'absence de ligne.

---

## Cascade de calcul du mois en cours (niveau salarié)

Ordre strict, premier cas satisfait gagne :

1. **Cas 1** — s'il existe au moins un bulletin à l'état 2 ou 3 : le mois en cours est le **plus récent** de ces mois.
2. **Cas 2** — sinon, s'il existe des bulletins tous à l'état 4 : le mois en cours est le **mois suivant** le plus récent d'entre eux.
3. **Cas 3** — sinon (aucun bulletin) : s'il existe au moins un emploi actif, le mois en cours est le mois de la date de début de l'emploi actif **le plus ancien** ; sinon, le **mois calendaire courant** au fuseau `Africa/Casablanca`.

Le mois est une chaîne `AAAA-MM` (ADR 0006), jamais un `DateTime`.

---

## Deux fonctions de conversion de mois (ne pas confondre)

| Fonction                | Entrée                                                            | Règle                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `moisDepuisDate`        | Date civile **stockée** à minuit UTC (ex. date de début d'emploi) | Lit année et mois en **UTC**. Ne jamais convertir en heure locale : une date au 1er avril minuit UTC reste avril, pas mars.                      |
| `moisCalendaireCourant` | Instant présent (`Date.now()`)                                    | Mois courant au fuseau nommé **`Africa/Casablanca`** via `Intl` — jamais un décalage fixe (+1), car le Maroc repasse à UTC+0 pendant le Ramadan. |

Le cas 3 de la cascade utilise `moisCalendaireCourant` pour « aujourd'hui » et `moisDepuisDate` pour les dates de début d'emploi stockées.

---

## Décision

- Une **seule source de vérité** : le mois en cours est **calculé**, jamais persisté sur `Salarie`.
- Le port `BulletinPort.listerBulletinsParSalarie` isole la dépendance au module 2.
- L'exposition en lecture (`moisEnCours` dans les réponses salarié) est calculée à la volée (décision 5d).

---

## Conséquences

- Deux sources de vérité (colonne + calcul) produiraient des divergences silencieuses — rejetées.
- Les tests du service branchant un double du port couvrent les trois cas de la cascade, y compris ceux inaccessibles avec l'implémentation provisoire vide.

---

## Alternatives rejetées

| Alternative                         | Motif                                           |
| ----------------------------------- | ----------------------------------------------- |
| Colonne `moisEnCours` sur `Salarie` | Risque de désynchronisation avec les bulletins  |
| Mois en cours au niveau emploi      | Décision 5a : un seul mois en cours par salarié |
