/**
 * Routes du module 1 (fiche societe) exemptees du scan de conformite 2.1.b.
 *
 * PROVISOIRE — ces routes utilisent encore `peutFaire` / `assertPeutFaire` et
 * n ont pas les decorateurs @RequiertPermission, @JournaliserEcriture, @ExigeIfMatch.
 * Cette liste doit DISPARAITRE quand le module 1 sera repris sur le nouveau socle.
 *
 * Aucun joker, aucun prefixe : une entree par route (methode + chemin).
 */
export const EXEMPTIONS_ROUTES_MODULE_1: ReadonlySet<string> = new Set([
  // HealthModule — temoin public, hors tenant
  'GET /health',

  // AccountsModule
  'GET /accounts/me',

  // UsersModule
  'GET /users/me',
  'GET /users',

  // ReferentielsController
  'GET /referentiels/banques',
  'GET /referentiels/jours-feries',
  'GET /referentiels/formes-juridiques',
  'GET /referentiels/types-heures',
  'GET /referentiels/types-exoneration',

  // SocietesController
  'GET /societes',
  'GET /societes/:id/impact-suppression',
  'GET /societes/:id/parametrage',
  'GET /societes/:id',
  'POST /societes',
  'PATCH /societes/:id/etat',
  'PATCH /societes/:id',
  'PUT /societes/:id/parametrage',
  'DELETE /societes/:id',

  // EtablissementsController
  'GET /societes/:societeId/etablissements',
  'POST /societes/:societeId/etablissements',
  'GET /etablissements/:id/impact-suppression',
  'GET /etablissements/:id/parametrage',
  'GET /etablissements/:id',
  'PATCH /etablissements/:id',
  'POST /etablissements/:id/designer-principal',
  'PUT /etablissements/:id/parametrage',
  'POST /etablissements/:id/deduire-heures-mensuelles',
  'DELETE /etablissements/:id',

  // ComptesBancairesController
  'GET /societes/:societeId/comptes-bancaires',
  'POST /societes/:societeId/comptes-bancaires',
  'GET /comptes-bancaires/:id/impact-suppression',
  'PATCH /comptes-bancaires/:id',
  'POST /comptes-bancaires/:id/cloturer',
  'DELETE /comptes-bancaires/:id',

  // AdminSocietesController
  'POST /admin/societes/:id/forcer-regime-de-base',
]);
