'use client';

import type {
  Banque,
  CompteBancaireSalarie,
  EmploiFiche,
  Etablissement,
  MotifSortie,
  Permission,
  TypeContrat,
} from '@paymarh/shared-types';
import { ChevronDown } from 'lucide-react';
import { possedePermission } from '@/lib/permissions';
import { libelleReferentielParCode } from '@/lib/affichage/libelles-emploi';
import { RubriqueEmploiAffectation } from './rubrique-emploi-affectation';
import { RubriqueEmploiContrat } from './rubrique-emploi-contrat';
import { RubriqueEmploiRemuneration } from './rubrique-emploi-remuneration';

interface Props {
  readonly companyId: string;
  readonly emploi: EmploiFiche;
  readonly deplie: boolean;
  readonly onBasculer: () => void;
  readonly typesContrat: readonly TypeContrat[];
  readonly motifsSortie: readonly MotifSortie[];
  readonly etablissements: readonly Etablissement[];
  readonly comptesBancaires?: readonly CompteBancaireSalarie[];
  readonly banques: readonly Banque[];
  readonly operations: readonly Permission[];
  readonly onEmploiChange: (emploi: EmploiFiche) => void;
}

function ligneRepliée(emploi: EmploiFiche, typesContrat: readonly TypeContrat[]): string {
  const segments = [
    emploi.contrat.libellePoste,
    libelleReferentielParCode(typesContrat, emploi.contrat.typeContratCode),
    emploi.contrat.dateDebut,
  ];
  if (emploi.contrat.dateSortie !== null) {
    segments.push(emploi.contrat.dateSortie);
  }
  return segments.join(' · ');
}

export function AccordeonEmploi({
  companyId,
  emploi,
  deplie,
  onBasculer,
  typesContrat,
  motifsSortie,
  etablissements,
  comptesBancaires,
  banques,
  operations,
  onEmploiChange,
}: Props) {
  const peutLireRemuneration = possedePermission(operations, 'salarie.remuneration.lire');

  return (
    <section className="rounded-lg border" data-testid={`accordeon-emploi-${emploi.id}`}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={deplie}
        data-testid={`accordeon-emploi-entete-${emploi.id}`}
        onClick={onBasculer}
      >
        <span className="text-sm font-medium">{ligneRepliée(emploi, typesContrat)}</span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${deplie ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <div
        className={`space-y-4 border-t px-4 py-4 ${deplie ? '' : 'hidden'}`}
        data-testid={`accordeon-emploi-corps-${emploi.id}`}
      >
        <RubriqueEmploiContrat
          companyId={companyId}
          emploi={emploi}
          typesContrat={typesContrat}
          motifsSortie={motifsSortie}
          onEmploiChange={onEmploiChange}
        />
        <RubriqueEmploiAffectation
          companyId={companyId}
          emploi={emploi}
          etablissements={etablissements}
          onEmploiChange={onEmploiChange}
        />
        {peutLireRemuneration &&
        emploi.remuneration !== undefined &&
        emploi.paiement !== undefined ? (
          <RubriqueEmploiRemuneration
            companyId={companyId}
            emploi={emploi}
            remuneration={emploi.remuneration}
            paiement={emploi.paiement}
            comptesBancaires={comptesBancaires}
            banques={banques}
            operations={operations}
            onEmploiChange={onEmploiChange}
          />
        ) : null}
      </div>
    </section>
  );
}
