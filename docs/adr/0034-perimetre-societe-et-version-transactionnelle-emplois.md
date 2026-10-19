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
- Les tableaux portés par le salarié (`tableaux-salarie.service.ts`) et la garde `verifierPerimetreSalarie` ne sont pas traités ici ; ils gardent l'ancien ordre et le filtre par compte.
