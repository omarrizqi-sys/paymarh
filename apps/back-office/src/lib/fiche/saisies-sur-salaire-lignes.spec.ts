import { describe, expect, it } from 'vitest';
import {
  avertissementChangementType,
  creerLigneVide,
  versCorpsCreation,
  versCorpsModification,
} from './saisies-sur-salaire-lignes';

describe('saisies-sur-salaire-lignes', () => {
  it('T42 — avertissement tiers vers pension quand montant total saisi', () => {
    const ligne = { ...creerLigneVide('TIERS_DETENTEUR'), montantTotal: '5000.00' };
    const message = avertissementChangementType(ligne, 'PENSION_ALIMENTAIRE');
    expect(message).toBe(
      'Le montant total saisi ne s’applique pas à une pension alimentaire et sera abandonné lors de l’enregistrement.'
    );
  });

  it('T43 — avertissement pension vers tiers quand montant mensuel ou mois fin saisis', () => {
    const ligne = creerLigneVide('PENSION_ALIMENTAIRE');
    const avecMensuel = { ...ligne, montantMensuel: '2000.00' };
    expect(avertissementChangementType(avecMensuel, 'TIERS_DETENTEUR')).toBe(
      'Le montant mensuel et le mois de fin saisis ne s’appliquent pas à une saisie à tiers détenteur et seront abandonnés lors de l’enregistrement.'
    );
    const avecMoisFin = { ...ligne, moisFin: '2027-12' };
    expect(avertissementChangementType(avecMoisFin, 'TIERS_DETENTEUR')).toContain('abandonnés');
  });

  it('T44 — versCorpsCreation pension n envoie pas montantTotal', () => {
    const ligne = {
      ...creerLigneVide('PENSION_ALIMENTAIRE'),
      referenceDecision: 'REF',
      creancier: 'X',
      libelleBulletin: 'PEN',
      moisDebut: '2026-01',
      montantMensuel: '1500.00',
      montantTotal: '9999.00',
    };
    const corps = versCorpsCreation(ligne);
    expect(corps).not.toHaveProperty('montantTotal');
    expect(corps).toMatchObject({ montantMensuel: '1500.00' });
  });

  it('T45 — versCorpsCreation tiers n envoie pas montantMensuel ni moisFin', () => {
    const ligne = {
      ...creerLigneVide('TIERS_DETENTEUR'),
      referenceDecision: 'REF',
      creancier: 'X',
      libelleBulletin: 'SAI',
      moisDebut: '2026-01',
      montantTotal: '8000.00',
      montantMensuel: '100.00',
      moisFin: '2027-06',
    };
    const corps = versCorpsCreation(ligne);
    expect(corps).not.toHaveProperty('montantMensuel');
    expect(corps).not.toHaveProperty('moisFin');
    expect(corps).toMatchObject({ montantTotal: '8000.00' });
  });

  it('T46 — changement de type en modification n envoie que les champs du type choisi', () => {
    const ref = {
      ...creerLigneVide('TIERS_DETENTEUR'),
      id: 's-1',
      etat: 'ACTIVE' as const,
      referenceDecision: 'REF',
      creancier: 'Banque',
      libelleBulletin: 'SAI',
      moisDebut: '2026-01',
      montantTotal: '5000.00',
    };
    const courant = {
      ...ref,
      typeSaisieCode: 'PENSION_ALIMENTAIRE',
      montantMensuel: '2000.00',
    };
    const corps = versCorpsModification(courant, ref);
    expect(corps.typeSaisieCode).toBe('PENSION_ALIMENTAIRE');
    expect(corps.montantMensuel).toBe('2000.00');
    expect(corps).not.toHaveProperty('montantTotal');
  });
});
