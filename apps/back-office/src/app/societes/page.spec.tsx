// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RessourceAvecOperations, SocieteListe } from '@paymarh/shared-types';

const { listerSocietes } = vi.hoisted(() => ({
  listerSocietes: vi.fn(),
}));

vi.mock('@/lib/api/journaliser-erreur-serveur', () => ({
  journaliserErreurServeur: () => undefined,
}));

vi.mock('@/lib/api/societes', () => ({
  listerSocietes: (...args: unknown[]) => listerSocietes(...args),
}));

vi.mock('@/lib/api/referentiels', () => ({
  chargerReferentielsFiche: () =>
    Promise.resolve({
      formesJuridiques: [{ id: 'forme-sarl', code: 'SARL', libelle: 'SARL' }],
      banques: [],
      joursFeries: [],
      typesHeures: [],
      typesExoneration: [],
    }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: unknown }) => (
    <a href={href}>{children as never}</a>
  ),
}));

import PageListeSocietes from './page';

/** Texte affiche aujourd hui — tout ecart est une fuite ou une regression. */
const MESSAGE_ECHEC_LISTE =
  'Impossible de charger les sociétés. Vérifiez que l’API tourne et que NEXT_PUBLIC_PAYMARH_USER_ID est correct.';

function societeListe(
  surcharges: Partial<RessourceAvecOperations<SocieteListe>> = {}
): RessourceAvecOperations<SocieteListe> {
  return {
    id: 'soc-1',
    accountId: 'acc-1',
    codeDossier: 'DEMO-001',
    raisonSociale: 'Societe de demonstration',
    nomCommercial: null,
    formeJuridiqueId: 'forme-sarl',
    activiteExercee: null,
    identifiantFiscal: null,
    registreCommerce: null,
    tribunalRegistreCommerce: null,
    dateCreation: null,
    dateCessationActivite: null,
    siteWeb: null,
    regimeDeBase: 'NON_AGRICOLE',
    periodicitePaie: 'MENSUEL',
    etatDossier: 'EN_MONTAGE',
    moisDebutMontage: '2026-01',
    moisDebutProduction: '2026-01',
    dateInactivite: null,
    moisEnCours: '2026-01',
    signataireCivilite: null,
    signatairePrenom: null,
    signataireNom: null,
    signataireQualite: null,
    matriculePrefixe: null,
    matriculeLongueur: 5,
    matriculeGenerationAuto: true,
    calculAutoAbsencesEntreesSorties: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    nombreEtablissements: 1,
    operations: ['societe.lire'],
    ...surcharges,
  };
}

describe('PageListeSocietes', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_PAYMARH_USER_ID', '62f76910-2937-4451-bdbc-0ad988c270e4');
    listerSocietes.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('affiche le message generique inchange apres un echec d appel', async () => {
    listerSocietes.mockRejectedValue(new Error('echec volontaire du test'));

    const ui = await PageListeSocietes();
    render(ui);

    expect(screen.getByRole('alert').textContent?.replace(/\s+/g, ' ').trim()).toBe(
      MESSAGE_ECHEC_LISTE
    );
    expect(document.body.textContent).not.toContain('echec volontaire du test');
  });

  it('se rend sans erreur lorsque les appels aboutissent', async () => {
    listerSocietes.mockResolvedValue({
      data: {
        items: [societeListe()],
        total: 1,
        operations: ['societe.lire', 'societe.creer'],
      },
      warnings: [],
    });

    const ui = await PageListeSocietes();
    render(ui);

    expect(screen.queryByText(MESSAGE_ECHEC_LISTE)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Sociétés' })).toBeTruthy();
    expect(screen.getByText('Societe de demonstration')).toBeTruthy();
    expect(screen.getByText('SARL')).toBeTruthy();
  });
});
