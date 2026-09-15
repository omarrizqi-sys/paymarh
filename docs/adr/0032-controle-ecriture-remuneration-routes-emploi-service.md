# ADR 0032 — Contrôle du droit d'écriture rémunération sur les routes emploi

## Statut

Accepté — temps 2.b (2.1.c-3).

## Contexte

Le `PATCH /emplois/:id/remuneration` modifie `EmploiRemunerationVersion` (montant, mode de paiement, compte bancaire, etc.). C'est une rubrique de **rémunération** : l'écran exigera `salarie.remuneration.ecrire`, indépendamment de `emploi.modifier`.

Avant le temps 2.b, seul `emploi.modifier` était vérifié sur la route. L'intercepteur `MasquageRemunerationInterceptor` contrôle les clés enregistrées dans `REGISTRE_CLE_RUBRIQUE` ; le corps de ce PATCH est **plat** (`montant`, `modePaiement`, …), pas englobé sous `remuneration` ou `paiement`. Un utilisateur avec `emploi.modifier` mais sans `salarie.remuneration.ecrire` pouvait modifier le salaire.

**Même défaut que les comptes bancaires (ADR 0024)** : un contrôle qui reconnaît des **noms de clés HTTP** au lieu de suivre la **donnée** écrite. Découvert par relevé au temps 4, corrigé avant exploitation écran.

Les avantages en nature portent un `montant` et n'avaient aucun contrôle service. La création d'emploi était protégée **accidentellement** par l'intercepteur (clé englobante `remuneration` dans le corps POST) — fragile si la forme du corps change.

## Décision

Le contrôle `salarie.remuneration.ecrire` est placé dans le **service qui écrit**, via `assertEcritureRemunerationSalarie` (renommage de l'ancien `assertEcritureComptesBancairesSalarie`, ADR 0024), au début de chaque méthode concernée, avant toute validation ou écriture :

| Point                           | Service                 | Méthodes                                                                         |
| ------------------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| PATCH rémunération (+ paiement) | `EmploisService`        | `modifierRemuneration`                                                           |
| Création emploi                 | `EmploisService`        | `creer`                                                                          |
| Avantages en nature             | `TableauxEmploiService` | `creerAvantageEnNature`, `modifierAvantageEnNature`, `supprimerAvantageEnNature` |

- Refus : `403 Forbidden`, message « Action non autorisée. », sans code métier — ADR 0029.
- **`REGISTRE_CLE_RUBRIQUE` n'est pas modifié.** Étendre le registre aurait été la correction la plus courte, mais elle protège une forme de corps, pas la donnée : import, modification en masse ou autre écran contourneraient la route.
- **Primes contractuelles exclues** : pas de montant, seulement `primeRef` et `moisApplication`.
- **Prêts et saisies sur salaire exclus** : retenues, point ouvert au module d'authentification.

## Pourquoi pas le registre

ADR 0024 a déjà tranché ce cas pour `comptes` vs `comptesBancaires`. Ici, `montant` en clé de premier niveau sur le PATCH rémunération. Ajouter les clés manquantes au registre aurait fonctionné **pour cette route et cette forme de corps** — c'est la troisième fois que le même défaut réapparaît. Le registre ne voyage pas avec la donnée.

## Conséquences

- RE1–RE4 et RE6 prouvent le refus et le non-débordement sur les routes réelles.
- RE5 prouve le refus au niveau service (`EmploisService.creer`), hors intercepteur.
- La propagation TAHFIZ (statuts particuliers) n'est pas traversée : elle n'écrit pas de versions rémunération.

## Note — 2026-09-15 (temps 5, sous-étape 2.1.c-3)

Quatrième occurrence du même défaut sur les **primes contractuelles** : `creerPrimeContractuelle`, `modifierPrimeContractuelle` et `supprimerPrimeContractuelle` n'appelaient pas `assertEcritureRemunerationSalarie` — seule `emploi.modifier` sur la route. Même cause, même correction (contrôle dans `TableauxEmploiService`, pas extension du registre). RE7–RE10 couvrent refus et non-débordement.
