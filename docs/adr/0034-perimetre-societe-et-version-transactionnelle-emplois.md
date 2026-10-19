# ADR 0034 — Périmètre société et version transactionnelle des emplois

- **Statut :** accepté
- **Date :** 2026-10-19
- **Portée :** module 2 (routes `/emplois/:id`)
- **Complète :** ADR 0013 (verrouillage optimiste), ADR 0016 (API emploi par rubrique), ADR 0018 / 0033 (synchronisation TAHFIZ dans la transaction de l'écriture)

---

## Contexte

Deux défauts sur les routes de l'emploi :

1. **Périmètre.** La garde `@PerimetreEmploi` et les deux `trouverEmploi` (`EmploisService`, `TableauxEmploiService`) ne filtraient l'emploi que par **compte**. Un utilisateur placé sur la société A pouvait lire ou modifier un emploi de la société B du même compte. Les routes `/salaries/:id` filtraient déjà par société (`salaries.service.ts`, `companyScope`).
2. **Version.** Sur les 12 écritures à `If-Match` (3 PATCH de rubrique, 9 écritures de tableaux), l'écriture était faite d'abord, puis le contrôle et l'incrément de version. Un `If-Match` périmé rendait bien `409 CONFLIT_VERSION`, mais **après** avoir écrit : contrat modifié, lignes TAHFIZ resynchronisées, prime ajoutée. Le contrôle de chevauchement des statuts particuliers était en outre fait hors transaction, donc exposé à deux écritures concurrentes.

---

## Décision

### Périmètre société (20 routes)

Les 20 routes portant `@PerimetreEmploi('id')` (`emplois.controller.ts`) filtrent l'emploi par **société active et compte** : `salarie: { companyId, company: { accountId } }`, où `companyId` et `accountId` viennent de `companyScope(tenant)`.

- Le filtre est appliqué à deux niveaux : dans la garde (`permission.guard.ts`, `verifierPerimetreEmploi`) et dans chaque `trouverEmploi` des services. Le service ne compte pas sur la garde.
- Emploi d'une autre société, ou d'un autre compte : `404`, message neutre « Ressource introuvable. ». Jamais `403` : un `403` révélerait que l'emploi existe.
- La garde contrôle le périmètre **avant** la permission : un utilisateur sans droit d'écriture sur un emploi d'une autre société reçoit `404`, pas `403`.
- Sans en-tête de société active : comportement identique à `/salaries`, c'est-à-dire le `403` de `companyScope` (« Cette requête exige une société active… », `tenant-scope.ts`). Le middleware de tenant n'est pas modifié.

### Version dans la transaction, avant l'écriture (12 écritures)

Chaque écriture suit l'ordre :

1. contrôles sans écriture (forme, références, règles métier, alertes) ;
2. ouverture de la transaction ;
3. `verrouillage.modifierEmploi({ id, versionAttendue, donnees: {} }, tx)` : `updateMany` conditionné par la version attendue, avec incrément ; `409 CONFLIT_VERSION` si aucune ligne ne correspond ;
4. lectures dépendantes de l'état (statuts existants pour le chevauchement) et écriture, par `tx` ;
5. synchronisation TAHFIZ par `tx` (PATCH contrat).

Un `409` lève une exception dans la transaction : **rien n'est écrit**, synchronisation TAHFIZ comprise. `VerrouillageOptimisteService.modifierEmploi` accepte un client transactionnel (par défaut `PrismaService`).

Le contrôle de chevauchement des statuts particuliers (création, modification) est fait dans la transaction, après le verrou : deux écritures concurrentes sur le même emploi sont sérialisées par le verrou de ligne sur `Emploi`.

`DELETE /emplois/:id` n'est pas concerné : il fait déjà un seul `deleteMany` conditionné par l'identifiant et la version.

---

## Conséquences

- Un client qui reçoit `409 CONFLIT_VERSION` peut relire et rejouer sans risque de double écriture.
- Les tests HTTP `emplois-corrections-api-http.spec.ts` vérifient, pour chaque écriture, que la base est strictement inchangée après un `409`.
- Les tableaux portés par le salarié (`tableaux-salarie.service.ts`) et la garde `verifierPerimetreSalarie` ne sont pas traités ici ; ils gardent l'ancien ordre et le filtre par compte. _(Levé par la note du 2026-10-19 ci-dessous.)_

---

## Note du 2026-10-19 — extension au salarié (temps 6, prompt A-bis)

La décision s'applique désormais aux routes `/salaries/:id` et `/salaries/:salarieId`, avec les mêmes mécanismes.

### Périmètre société

- **Garde** : `verifierPerimetreSalarie` (`permission.guard.ts`) filtre le salarié par `companyId` et `company: { accountId }` issus de `companyScope(tenant)`. Elle couvre les 21 routes de `salaries.controller.ts` qui portent `@PerimetreSalarie` (tout `:id` ou `:salarieId`, y compris `POST /salaries/:salarieId/emplois`).
- **Service** (`tableaux-salarie.service.ts`) : toutes les recherches passent par le même filtre de société, y compris la relecture de la fiche renvoyée après écriture (`reponseFiche`) et la recherche des homonymes parmi les personnes à charge. Une ligne (personne à charge, prêt, saisie) est recherchée par son identifiant **et** par son salarié, lui-même filtré par société. `creerPret` et `creerSaisieSurSalaire` recherchent désormais le salarié avant tout traitement.
- **Service** (`salaries.service.ts`) : la relecture après écriture (`chargerFiche`) et la relecture qui distingue `409` et `404` dans `supprimer` filtrent aussi par société.
- Routes qui n'avaient **aucun** contrôle de société dans le service : `GET …/personnes-a-charge/:ligneId/impact-suppression`, `DELETE …/personnes-a-charge/:ligneId`, `POST …/prets`, `PATCH …/prets/:ligneId`, `GET …/prets/:ligneId/impact-suppression`, `DELETE …/prets/:ligneId`, `POST …/saisies-sur-salaire`, `PATCH …/saisies-sur-salaire/:ligneId`, `GET …/saisies-sur-salaire/:ligneId/impact-suppression`, `DELETE …/saisies-sur-salaire/:ligneId`. `PATCH …/personnes-a-charge/:ligneId` contrôlait le salarié, mais recherchait la ligne par salarié seulement.
- Salarié d'une autre société ou d'un autre compte : `404`, « Ressource introuvable. », jamais `403`. Sans en-tête de société : le `403` de `companyScope`, comme pour les autres routes `/salaries`.
- **`PUT /salaries/:id/comptes-bancaires`** : un `comptes[i].id` qui n'est pas un compte de ce salarié (autre salarié, autre société, identifiant inconnu) est refusé **avant toute écriture** : `400`, `{ code: "VALEUR_INDISPONIBLE", message, champ: "id", indexLigne: i }`. La ligne est désignée par `indexLigne`, comme les alertes de ce PUT (ADR 0023). Auparavant, l'`update` se faisait sur le seul identifiant : le compte d'un autre salarié, même d'une autre société, était modifié. L'`update` filtre aussi par `salarieId`, en seconde protection.

### Version dans la transaction, avant l'écriture (10 écritures)

`verrouillage.modifierSalarie({ id, versionAttendue, donnees: {} }, tx)` est la première instruction d'une transaction qui contient toute l'écriture, pour :

1. `POST /salaries/:id/personnes-a-charge` (`creerPersonneACharge`) ;
2. `PATCH /salaries/:id/personnes-a-charge/:ligneId` (`modifierPersonneACharge`, écrasement ou versionnement) ;
3. `DELETE /salaries/:id/personnes-a-charge/:ligneId` (`supprimerPersonneACharge`, suppression ou inactivation) ;
4. `PUT /salaries/:id/comptes-bancaires` (`remplacerComptesBancaires`) ;
5. `POST /salaries/:id/prets` (`creerPret`) ;
6. `PATCH /salaries/:id/prets/:ligneId` (`modifierPret`) ;
7. `DELETE /salaries/:id/prets/:ligneId` (`supprimerPret`) ;
8. `POST /salaries/:id/saisies-sur-salaire` (`creerSaisieSurSalaire`) ;
9. `PATCH /salaries/:id/saisies-sur-salaire/:ligneId` (`modifierSaisieSurSalaire`) ;
10. `DELETE /salaries/:id/saisies-sur-salaire/:ligneId` (`supprimerSaisie`).

Un `409 CONFLIT_VERSION` annule tout : aucune ligne créée, modifiée ou supprimée, aucun compte bancaire remplacé.

Les PATCH `identite`, `coordonnees`, `identifiants-legaux` et `dates` étaient déjà sains : l'écriture y est le verrou (`updateMany` conditionné par la version, dans la même transaction que la consommation du matricule le cas échéant).

### PATCH de rubrique sans changement

Un corps qui ne porte aucun champ de la rubrique (par exemple `{}`) ne déclenchait aucun contrôle de version : un `If-Match` périmé recevait `200`. Désormais la version est contrôlée sans être incrémentée (`VerrouillageOptimisteService.controlerVersionSalarie`) :

- `If-Match` périmé : `409 CONFLIT_VERSION` ;
- `If-Match` à jour : `200`, version inchangée.

Un corps qui renvoie des valeurs identiques aux valeurs en base n'est pas concerné : il porte des champs, il est écrit et incrémente la version, comme avant.

Tests : `apps/api/test/salaries-corrections-api-http.spec.ts` (B01 à B26).
