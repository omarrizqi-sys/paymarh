# Héritage et propagation TAHFIZ

- **Module :** 2 — Fiche salarié
- **Étape :** 2.1.b-5
- **Date :** 2026-09-03
- **ADR :** [0017](../../adr/0017-resolution-heritage.md), [0018](../../adr/0018-propagation-tahfiz.md)

---

## Champs héritables retenus

| Champ (emploi / résolution)  | Cascade                                                                                                 | Source spec                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `dureeContractuelle`         | SAL > ETB (`dureeHebdomadaire`) > SOC (aucun) > NAT (`DUREE_LEGALE_TRAVAIL`)                            | v5 § Nullabilité et héritage ; v7 établissement « Durée hebdomadaire » (Héritable = oui) |
| `reposHebdomadaire`          | SAL > ETB (`jourReposHebdomadaire`) > SOC (aucun) > NAT (aucun)                                         | v5 ; v7 établissement « Repos hebdomadaire »                                             |
| `teletravailAutorise`        | SAL > ETB > SOC (aucun) > NAT (aucun)                                                                   | v5 ; v7 établissement « Télétravail autorisé »                                           |
| `teletravailIndemniteVersee` | SAL > ETB (`indemniteTeletravailVersee`) > SOC (aucun) > NAT (aucun)                                    | v5 ; v7 établissement « indemnité de télétravail »                                       |
| `teletravailMontant`         | SAL > ETB (`montantIndemniteTeletravail`) > SOC (aucun) > NAT (aucun)                                   | v5 ; v7 établissement « Montant de l'indemnité »                                         |
| `grilleHoraire` (résolution) | Si `repartitionHoraireRef` propre → pas de grille d'heures (module 3) ; sinon ETB `horaireDefautLignes` | v5 `repartitionHoraireRef` ; v7 Annexe 1 / « Grille des horaires »                       |
| `joursFeriesTravailles`      | Exception A15 : `suivreJoursFeriesEtablissement`                                                        | v5 exception `suivreJoursFeriesEtablissement` ; v7 « Jours fériés travaillés » (T1)      |

Aucun autre champ n'a été ajouté. Les congés payés société ne sont pas héritables (T1 / v7).

---

## Lecture API

`GET /emplois/:id` et les emplois de `GET /salaries/:id` exposent :

- les champs propres (null = hérité) ;
- `resolutions` : pour chaque champ ci-dessus, `{ valeur, origine, libelleEntite }` ou `null`.

Sans `salarie.remuneration.lire`, les clés `teletravailIndemniteVersee` et `teletravailMontant` sont **retirées** des résolutions (clé absente, jamais `null`) ; la rubrique `remuneration` de l'emploi l'est aussi. Les cinq autres champs de `resolutions` restent présents.

---

## C24

Alerte `REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE` si le repos résolu tombe un jour où la grille résolue porte des heures > 0. Sans grille résolue, aucune alerte. L'écriture a toujours lieu.

---

## Propagation TAHFIZ

Lignes `PROPAGE_SOCIETE` / code technique `TAHFIZ`, calculées sur les **périodes en CDI** de chaque emploi, ouvert ou terminé (ADR 0033). La ligne commence au plus tardif du début de l'exonération, du début de l'emploi et du passage en CDI ; elle finit au plus précoce de la fin de l'exonération, de la date de sortie et de la sortie du CDI.

Synchronisation déclenchée, chacune dans la transaction de l'écriture :

1. **`PUT /societes/:id/parametrage`** — tous les emplois de la société (activation, changement de dates, retrait).
2. **Création d'un emploi** — l'emploi créé, selon le paramétrage applicable au mois en cours société.
3. **`PATCH /emplois/:id/contrat`** — l'emploi modifié (changement de type, de date de début ou de date de sortie).

Lignes en trop : suppression si jamais utilisées par un bulletin ; sinon `dateFin` au mois en cours société. Une ligne n'est jamais rétrécie en deçà d'un bulletin.

Pas de bouton « tout hériter », pas de file d'attente.
