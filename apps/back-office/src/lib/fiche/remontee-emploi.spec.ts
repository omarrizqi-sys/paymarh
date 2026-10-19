import { describe, expect, it } from 'vitest';
import type { EmploiFiche, StatutParticulierFiche } from '@paymarh/shared-types';
import { fusionnerReponseEmploi } from './remontee-emploi';

function ligneStatut(surcharges: Partial<StatutParticulierFiche>): StatutParticulierFiche {
  return {
    id: 'st-1',
    statutCode: 'IDMAJ',
    dateDebut: '2024-01-01',
    dateFin: null,
    origine: 'SAISIE_MANUELLE',
    etat: 'ACTIVE',
    ...surcharges,
  };
}

function emploiCourant(): EmploiFiche {
  return {
    id: 'emp-1',
    version: 5,
    numeroOrdre: 1,
    contrat: {
      libellePoste: 'Comptable',
      dateDebut: '2024-01-01',
      dateFin: null,
      typeContratCode: 'CDI',
      periodeEssaiDateFin: null,
      periodeEssaiDureeJours: null,
      renouvellementEssaiDateFin: null,
      statutCadre: null,
      coefficient: null,
      position: null,
      indice: null,
      dateSortie: null,
      motifSortieCode: null,
      estOuvert: true,
    },
    affectation: {
      etablissementId: 'etab-1',
      departementRef: null,
      serviceRef: null,
      baseSaisieDuree: 'HEBDOMADAIRE',
      dureeContractuelle: null,
      dureeDansAutreBase: null,
      repartitionHoraireRef: null,
      reposHebdomadaire: null,
      suivreJoursFeriesEtablissement: true,
      teletravailAutorise: null,
    },
    remuneration: {
      modeDeterminationSalaire: 'BRUT_MENSUEL',
      montant: '12000.00',
      masquerNombreHeures: false,
      masquerTauxHoraire: false,
      bulletinTousLesMois: true,
      moisProduction: [],
      teletravailIndemniteVersee: null,
      teletravailMontant: null,
    },
    paiement: { modePaiement: 'VIREMENT', compteBancaireId: null },
    primesContractuelles: [{ id: 'pc-courante', primeRef: 'A15', moisApplication: [6] }],
    avantagesEnNature: [],
    statutsParticuliers: [
      ligneStatut({ id: 'st-saisie-courante', origine: 'SAISIE_MANUELLE' }),
      ligneStatut({
        id: 'st-tahfiz-ancien',
        statutCode: 'TAHFIZ',
        origine: 'PROPAGE_SOCIETE',
      }),
    ],
    resolutions: {
      dureeContractuelle: null,
      reposHebdomadaire: null,
      teletravailAutorise: null,
      grilleHoraire: null,
      joursFeriesTravailles: null,
    },
    operations: ['emploi.modifier', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
  };
}

function reponseApi(courant: EmploiFiche): EmploiFiche {
  const { operations: _operations, ...sansOperations } = courant;
  return {
    ...sansOperations,
    version: 6,
    contrat: { ...courant.contrat, libellePoste: 'Chef comptable' },
    affectation: { ...courant.affectation, dureeContractuelle: '44' },
    remuneration: { ...courant.remuneration!, montant: '99999.00' },
    paiement: { modePaiement: 'CHEQUE', compteBancaireId: null },
    primesContractuelles: [],
    avantagesEnNature: [],
    statutsParticuliers: [
      ligneStatut({ id: 'st-saisie-reponse', origine: 'SAISIE_MANUELLE' }),
      ligneStatut({
        id: 'st-tahfiz-resynchronise',
        statutCode: 'TAHFIZ',
        dateDebut: '2025-07-01',
        origine: 'PROPAGE_SOCIETE',
      }),
    ],
    resolutions: {
      ...courant.resolutions,
      dureeContractuelle: {
        valeur: '44',
        origine: 'ETABLISSEMENT',
        libelleEntite: 'Siège',
      },
    },
  };
}

describe('fusionnerReponseEmploi (RE06)', () => {
  it('RE06a — contrat : version, bloc contrat, resolutions et lignes propagees viennent de la reponse', () => {
    const courant = emploiCourant();
    const reponse = reponseApi(courant);

    const fusion = fusionnerReponseEmploi(courant, reponse, 'contrat');

    expect(fusion.version).toBe(6);
    expect(fusion.contrat).toEqual(reponse.contrat);
    expect(fusion.resolutions).toEqual(reponse.resolutions);
    expect(fusion.statutsParticuliers.filter((l) => l.origine === 'PROPAGE_SOCIETE')).toEqual(
      reponse.statutsParticuliers.filter((l) => l.origine === 'PROPAGE_SOCIETE')
    );
  });

  it('RE06b — contrat : operations, autres blocs, collections et lignes saisies restent ceux de l etat courant', () => {
    const courant = emploiCourant();
    const reponse = reponseApi(courant);

    const fusion = fusionnerReponseEmploi(courant, reponse, 'contrat');

    expect(fusion.operations).toEqual(courant.operations);
    expect(fusion.affectation).toBe(courant.affectation);
    expect(fusion.remuneration).toBe(courant.remuneration);
    expect(fusion.paiement).toBe(courant.paiement);
    expect(fusion.primesContractuelles).toBe(courant.primesContractuelles);
    expect(fusion.avantagesEnNature).toBe(courant.avantagesEnNature);
    expect(fusion.statutsParticuliers.filter((l) => l.origine !== 'PROPAGE_SOCIETE')).toEqual(
      courant.statutsParticuliers.filter((l) => l.origine !== 'PROPAGE_SOCIETE')
    );
  });

  it('RE06c — affectation : version, bloc affectation et resolutions remplaces ; le reste intact, statuts compris', () => {
    const courant = emploiCourant();
    const reponse = reponseApi(courant);

    const fusion = fusionnerReponseEmploi(courant, reponse, 'affectation');

    expect(fusion.version).toBe(6);
    expect(fusion.affectation).toEqual(reponse.affectation);
    expect(fusion.resolutions).toEqual(reponse.resolutions);
    expect(fusion.operations).toEqual(courant.operations);
    expect(fusion.contrat).toBe(courant.contrat);
    expect(fusion.remuneration).toBe(courant.remuneration);
    expect(fusion.paiement).toBe(courant.paiement);
    expect(fusion.primesContractuelles).toBe(courant.primesContractuelles);
    expect(fusion.avantagesEnNature).toBe(courant.avantagesEnNature);
    expect(fusion.statutsParticuliers).toBe(courant.statutsParticuliers);
  });

  it('RE06d — un autre emploi n est pas touche', () => {
    const autre = { ...emploiCourant(), id: 'emp-2' };
    const reponse = reponseApi(emploiCourant());

    expect(fusionnerReponseEmploi(autre, reponse, 'contrat')).toBe(autre);
  });

  it('RE06e — remuneration : version, blocs remuneration et paiement et resolutions remplaces ; le reste intact', () => {
    const courant = emploiCourant();
    const reponse = reponseApi(courant);

    const fusion = fusionnerReponseEmploi(courant, reponse, 'remuneration');

    expect(fusion.version).toBe(6);
    expect(fusion.remuneration).toEqual(reponse.remuneration);
    expect(fusion.paiement).toEqual(reponse.paiement);
    expect(fusion.resolutions).toEqual(reponse.resolutions);
    expect(fusion.operations).toEqual(courant.operations);
    expect(fusion.contrat).toBe(courant.contrat);
    expect(fusion.affectation).toBe(courant.affectation);
    expect(fusion.primesContractuelles).toBe(courant.primesContractuelles);
    expect(fusion.avantagesEnNature).toBe(courant.avantagesEnNature);
    expect(fusion.statutsParticuliers).toBe(courant.statutsParticuliers);
  });
});
