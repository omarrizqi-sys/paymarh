'use client';

import { useCallback, useRef } from 'react';
import type {
  Banque,
  CompteBancaireSalarie,
  EmploiFiche,
  ModeDeterminationSalaire,
  ModePaiement,
  Permission,
} from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierRemunerationEmploi } from '@/lib/api/emplois';
import { formaterMoisClotureConges } from '@/lib/affichage/libelles';
import {
  afficherMontantIndemniteTeletravail,
  afficherIndemniteTeletravailVersee,
} from '@/lib/affichage/conditions';
import {
  libelleModeDeterminationSalaire,
  libelleModePaiement,
} from '@/lib/affichage/libelles-emploi';
import { phraseHeritageBoolean, phraseHeritageMontant } from '@/lib/affichage/heritage-emploi';
import { afficherMontant } from '@/lib/affichage/montants';
import {
  booleanNullableDepuisSelect,
  chaineOuNull,
  valeursRemunerationDepuisEmploi,
  type ValeursRemunerationEmploi,
} from '@/lib/fiche/valeurs-emploi';
import { idRubriqueEmploi, libelleRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { possedePermission } from '@/lib/permissions';
import { TeteRubriqueFiche } from '../tete-rubrique-fiche';
import { useRubriqueFiche } from '../use-rubrique-fiche';
import { LigneHeritageChamp } from './ligne-heritage-champ';

interface Props {
  readonly companyId: string;
  readonly emploi: EmploiFiche;
  readonly remuneration: NonNullable<EmploiFiche['remuneration']>;
  readonly paiement: NonNullable<EmploiFiche['paiement']>;
  readonly comptesBancaires?: readonly CompteBancaireSalarie[];
  readonly banques: readonly Banque[];
  readonly operations: readonly Permission[];
  readonly onEmploiChange: (emploi: EmploiFiche) => void;
}

const MOIS_PRODUCTION = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function libelleCompteBancaire(
  compteId: string,
  comptes: readonly CompteBancaireSalarie[] | undefined,
  banques: readonly Banque[]
): string {
  const compte = comptes?.find((entry) => entry.id === compteId);
  if (compte === undefined) {
    return compteId;
  }
  const segments: string[] = [];
  if (compte.banqueId !== null) {
    const banque = banques.find((entry) => entry.id === compte.banqueId)?.nom;
    if (banque !== undefined && banque.length > 0) {
      segments.push(banque);
    }
  } else if (compte.banqueLibreSaisie !== null && compte.banqueLibreSaisie.length > 0) {
    segments.push(compte.banqueLibreSaisie);
  }
  if (compte.titulaire !== null && compte.titulaire.length > 0) {
    segments.push(compte.titulaire);
  }
  if (compte.rib !== null && compte.rib.length > 0) {
    segments.push(compte.rib);
  }
  return segments.join(' — ');
}

function estRemunerationModifiee(
  courant: ValeursRemunerationEmploi,
  serveur: ValeursRemunerationEmploi
): boolean {
  return (
    courant.modeDeterminationSalaire !== serveur.modeDeterminationSalaire ||
    courant.montant !== serveur.montant ||
    courant.masquerNombreHeures !== serveur.masquerNombreHeures ||
    courant.masquerTauxHoraire !== serveur.masquerTauxHoraire ||
    courant.bulletinTousLesMois !== serveur.bulletinTousLesMois ||
    courant.moisProduction.join(',') !== serveur.moisProduction.join(',') ||
    courant.teletravailIndemniteVersee !== serveur.teletravailIndemniteVersee ||
    courant.teletravailMontant !== serveur.teletravailMontant ||
    courant.modePaiement !== serveur.modePaiement ||
    courant.compteBancaireId !== serveur.compteBancaireId
  );
}

function afficherMoisProduction(mois: readonly number[]): string {
  if (mois.length === 0) {
    return '';
  }
  return mois.map((numero) => formaterMoisClotureConges(numero)).join(', ');
}

export function RubriqueEmploiRemuneration({
  companyId,
  emploi,
  remuneration,
  paiement,
  comptesBancaires,
  banques,
  operations,
  onEmploiChange,
}: Props) {
  const emploiRef = useRef(emploi);
  emploiRef.current = emploi;

  const peutEcrire = possedePermission(operations, 'salarie.remuneration.ecrire');
  const { id: emploiId, contrat, resolutions } = emploi;
  const libellePoste = contrat.libellePoste;
  const valeursServeur = valeursRemunerationDepuisEmploi(remuneration, paiement);

  const resolutionsRemuneration = resolutions as EmploiFiche['resolutions'] & {
    readonly teletravailIndemniteVersee?: EmploiFiche['resolutions']['teletravailIndemniteVersee'];
    readonly teletravailMontant?: EmploiFiche['resolutions']['teletravailMontant'];
  };

  const heritageIndemnite =
    'teletravailIndemniteVersee' in resolutionsRemuneration
      ? phraseHeritageBoolean(resolutionsRemuneration.teletravailIndemniteVersee ?? null)
      : null;

  const heritageMontant =
    'teletravailMontant' in resolutionsRemuneration
      ? phraseHeritageMontant(resolutionsRemuneration.teletravailMontant ?? null)
      : null;

  const onServeurChange = useCallback(
    (valeurs: ValeursRemunerationEmploi, version: number) => {
      const base = emploiRef.current;
      onEmploiChange({
        ...base,
        version,
        remuneration: {
          modeDeterminationSalaire: valeurs.modeDeterminationSalaire,
          montant: valeurs.montant,
          masquerNombreHeures: valeurs.masquerNombreHeures,
          masquerTauxHoraire: valeurs.masquerTauxHoraire,
          bulletinTousLesMois: valeurs.bulletinTousLesMois,
          moisProduction: [...valeurs.moisProduction],
          teletravailIndemniteVersee: booleanNullableDepuisSelect(
            valeurs.teletravailIndemniteVersee
          ),
          teletravailMontant: chaineOuNull(valeurs.teletravailMontant),
        },
        paiement: {
          modePaiement: (chaineOuNull(valeurs.modePaiement) as ModePaiement | null) ?? null,
          compteBancaireId: chaineOuNull(valeurs.compteBancaireId),
        },
      });
    },
    [onEmploiChange]
  );

  const rubrique = useRubriqueFiche({
    id: idRubriqueEmploi(emploiId, 'remuneration'),
    libelle: libelleRubriqueEmploi('remuneration', libellePoste),
    entite: { kind: 'emploi', emploiId },
    valeursServeur,
    estModifiee: estRemunerationModifiee,
    envoyer: async (version, courant) => {
      const reponse = await modifierRemunerationEmploi(companyId, emploiId, version, {
        modeDeterminationSalaire: courant.modeDeterminationSalaire,
        montant: courant.montant,
        masquerNombreHeures: courant.masquerNombreHeures,
        masquerTauxHoraire: courant.masquerTauxHoraire,
        bulletinTousLesMois: courant.bulletinTousLesMois,
        moisProduction: [...courant.moisProduction],
        teletravailIndemniteVersee: booleanNullableDepuisSelect(courant.teletravailIndemniteVersee),
        teletravailMontant: chaineOuNull(courant.teletravailMontant),
        modePaiement: (chaineOuNull(courant.modePaiement) as ModePaiement | null) ?? null,
        compteBancaireId: chaineOuNull(courant.compteBancaireId),
      });
      onEmploiChange(reponse.donnees);
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  const verrouille = rubrique.verrouille || !peutEcrire;
  const teletravailAutorise =
    emploi.affectation.teletravailAutorise ?? resolutions.teletravailAutorise?.valeur ?? null;
  const indemniteVersee = booleanNullableDepuisSelect(rubrique.courant.teletravailIndemniteVersee);

  const basculerMoisProduction = (mois: number, coche: boolean) => {
    const courants = new Set(rubrique.courant.moisProduction);
    if (coche) {
      courants.add(mois);
    } else {
      courants.delete(mois);
    }
    rubrique.modifier({ moisProduction: [...courants].sort((a, b) => a - b) });
  };

  return (
    <Rubrique
      id={idRubriqueEmploi(emploiId, 'remuneration')}
      titre={`Rémunération — ${libellePoste}`}
    >
      <TeteRubriqueFiche
        erreur={rubrique.erreur}
        alertes={rubrique.alertes}
        testidErreur={`erreur-rubrique-${emploiId}-remuneration`}
        testidAlertes={`alertes-tete-${emploiId}-remuneration`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-mode-determination-salaire`}>
            Mode de détermination du salaire
          </Label>
          <Select
            id={`${emploiId}-mode-determination-salaire`}
            value={rubrique.courant.modeDeterminationSalaire}
            disabled={verrouille}
            onChange={(e) =>
              rubrique.modifier({
                modeDeterminationSalaire: e.target.value as ModeDeterminationSalaire,
              })
            }
          >
            <option value="BRUT_MENSUEL">{libelleModeDeterminationSalaire('BRUT_MENSUEL')}</option>
            <option value="BRUT_HORAIRE">{libelleModeDeterminationSalaire('BRUT_HORAIRE')}</option>
            <option value="NET_CIBLE">{libelleModeDeterminationSalaire('NET_CIBLE')}</option>
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="modeDeterminationSalaire" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-montant`}>Montant</Label>
          {peutEcrire ? (
            <Input
              id={`${emploiId}-montant`}
              value={rubrique.courant.montant}
              disabled={verrouille}
              onChange={(e) => rubrique.modifier({ montant: e.target.value })}
              data-testid={`${emploiId}-montant`}
            />
          ) : (
            <p className="text-sm" data-testid={`${emploiId}-montant`}>
              {afficherMontant(rubrique.courant.montant)}
            </p>
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="montant" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${emploiId}-masquer-heures`}
            checked={rubrique.courant.masquerNombreHeures}
            disabled={verrouille}
            onChange={(e) => rubrique.modifier({ masquerNombreHeures: e.target.checked })}
          />
          <Label htmlFor={`${emploiId}-masquer-heures`}>Masquer le nombre d’heures</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${emploiId}-masquer-taux`}
            checked={rubrique.courant.masquerTauxHoraire}
            disabled={verrouille}
            onChange={(e) => rubrique.modifier({ masquerTauxHoraire: e.target.checked })}
          />
          <Label htmlFor={`${emploiId}-masquer-taux`}>Masquer le taux horaire</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${emploiId}-bulletin-tous-les-mois`}
            checked={rubrique.courant.bulletinTousLesMois}
            disabled={verrouille}
            onChange={(e) => rubrique.modifier({ bulletinTousLesMois: e.target.checked })}
          />
          <Label htmlFor={`${emploiId}-bulletin-tous-les-mois`}>Bulletin tous les mois</Label>
        </div>
        {!rubrique.courant.bulletinTousLesMois ? (
          <div className="col-span-full space-y-2">
            <Label>Mois de production</Label>
            <div className="flex flex-wrap gap-3">
              {MOIS_PRODUCTION.map((mois) => (
                <div key={mois} className="flex items-center gap-2">
                  <Checkbox
                    id={`${emploiId}-mois-${mois}`}
                    checked={rubrique.courant.moisProduction.includes(mois)}
                    disabled={verrouille}
                    onChange={(e) => basculerMoisProduction(mois, e.target.checked)}
                  />
                  <Label htmlFor={`${emploiId}-mois-${mois}`}>
                    {formaterMoisClotureConges(mois)}
                  </Label>
                </div>
              ))}
            </div>
            <MessagesAlerteChamp alertes={rubrique.alertes} champ="moisProduction" />
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">Mois de production</p>
            <p className="text-sm">{afficherMoisProduction(rubrique.courant.moisProduction)}</p>
          </div>
        )}
        {afficherIndemniteTeletravailVersee(teletravailAutorise) ? (
          <div className="space-y-2">
            <Label htmlFor={`${emploiId}-teletravail-indemnite`}>
              Indemnité de télétravail versée
            </Label>
            <Select
              id={`${emploiId}-teletravail-indemnite`}
              value={rubrique.courant.teletravailIndemniteVersee}
              disabled={verrouille}
              onChange={(e) => rubrique.modifier({ teletravailIndemniteVersee: e.target.value })}
            >
              <option value=""></option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </Select>
            <MessagesAlerteChamp alertes={rubrique.alertes} champ="teletravailIndemniteVersee" />
            <LigneHeritageChamp
              heritage={heritageIndemnite}
              testId={`${emploiId}-heritage-teletravail-indemnite`}
            />
          </div>
        ) : null}
        {afficherMontantIndemniteTeletravail(teletravailAutorise, indemniteVersee) ? (
          <div className="space-y-2">
            <Label htmlFor={`${emploiId}-teletravail-montant`}>
              Montant de l’indemnité de télétravail
            </Label>
            {peutEcrire ? (
              <Input
                id={`${emploiId}-teletravail-montant`}
                value={rubrique.courant.teletravailMontant}
                disabled={verrouille}
                onChange={(e) => rubrique.modifier({ teletravailMontant: e.target.value })}
              />
            ) : (
              <p className="text-sm" data-testid={`${emploiId}-teletravail-montant`}>
                {afficherMontant(rubrique.courant.teletravailMontant)}
              </p>
            )}
            <MessagesAlerteChamp alertes={rubrique.alertes} champ="teletravailMontant" />
            <LigneHeritageChamp
              heritage={heritageMontant}
              testId={`${emploiId}-heritage-teletravail-montant`}
            />
          </div>
        ) : null}
      </div>

      <h3 className="text-sm font-medium">Paiement</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-mode-paiement`}>Mode de paiement</Label>
          <Select
            id={`${emploiId}-mode-paiement`}
            value={rubrique.courant.modePaiement}
            disabled={verrouille}
            onChange={(e) => rubrique.modifier({ modePaiement: e.target.value })}
          >
            <option value=""></option>
            <option value="VIREMENT">{libelleModePaiement('VIREMENT')}</option>
            <option value="CHEQUE">{libelleModePaiement('CHEQUE')}</option>
            <option value="ESPECES">{libelleModePaiement('ESPECES')}</option>
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="modePaiement" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-compte-bancaire`}>Compte bancaire</Label>
          <Select
            id={`${emploiId}-compte-bancaire`}
            value={rubrique.courant.compteBancaireId}
            disabled={verrouille}
            onChange={(e) => rubrique.modifier({ compteBancaireId: e.target.value })}
            data-testid={`${emploiId}-compte-bancaire-select`}
          >
            <option value=""></option>
            {(comptesBancaires ?? []).map((compte) => (
              <option key={compte.id} value={compte.id}>
                {libelleCompteBancaire(compte.id, comptesBancaires, banques)}
              </option>
            ))}
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="compteBancaireId" />
        </div>
      </div>
    </Rubrique>
  );
}
