'use client';

import { useMemo, useState } from 'react';
import type {
  Banque,
  CompteBancaireSalarie,
  EmploiFiche,
  Etablissement,
  MotifSortie,
  Permission,
  TypeContrat,
} from '@paymarh/shared-types';
import { Button } from '@/components/ui/button';
import {
  ID_SOMMAIRE_EMPLOIS,
  LIBELLE_SOMMAIRE_EMPLOIS,
} from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { separerEmploisActifsEtTermines } from '@/lib/fiche/trier-emplois-affichage';
import { AccordeonEmploi } from './emploi/accordeon-emploi';

interface Props {
  readonly emplois: readonly EmploiFiche[];
  readonly operations: readonly Permission[];
  readonly typesContrat: readonly TypeContrat[];
  readonly motifsSortie: readonly MotifSortie[];
  readonly etablissements: readonly Etablissement[];
  readonly comptesBancaires?: readonly CompteBancaireSalarie[];
  readonly banques: readonly Banque[];
}

function emploiDeplieInitial(emplois: readonly EmploiFiche[]): string | null {
  if (emplois.length !== 1) {
    return null;
  }
  return emplois[0]?.id ?? null;
}

export function BlocEmplois({
  emplois,
  operations,
  typesContrat,
  motifsSortie,
  etablissements,
  comptesBancaires,
  banques,
}: Props) {
  const { actifs, termines } = useMemo(() => separerEmploisActifsEtTermines(emplois), [emplois]);
  const [emploiDeplieId, setEmploiDeplieId] = useState<string | null>(() =>
    emploiDeplieInitial(emplois)
  );
  const [terminésVisibles, setTerminésVisibles] = useState(false);

  if (emplois.length === 0) {
    return (
      <section id={ID_SOMMAIRE_EMPLOIS} className="scroll-mt-4 space-y-2">
        <h2 className="text-lg font-semibold">{LIBELLE_SOMMAIRE_EMPLOIS}</h2>
        <p className="text-muted-foreground text-sm" data-testid="emplois-vide">
          Aucun emploi n’est enregistré.
        </p>
      </section>
    );
  }

  function basculerEmploi(emploiId: string) {
    setEmploiDeplieId((courant) => (courant === emploiId ? null : emploiId));
  }

  return (
    <section id={ID_SOMMAIRE_EMPLOIS} className="scroll-mt-4 space-y-4">
      <h2 className="text-lg font-semibold">{LIBELLE_SOMMAIRE_EMPLOIS}</h2>
      <div className="space-y-3">
        {actifs.map((emploi) => (
          <AccordeonEmploi
            key={emploi.id}
            emploi={emploi}
            deplie={emploiDeplieId === emploi.id}
            onBasculer={() => basculerEmploi(emploi.id)}
            typesContrat={typesContrat}
            motifsSortie={motifsSortie}
            etablissements={etablissements}
            comptesBancaires={comptesBancaires}
            banques={banques}
            operations={operations}
          />
        ))}
        {termines.length > 0 ? (
          <>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              data-testid="basculer-emplois-termines"
              onClick={() => setTerminésVisibles((visible) => !visible)}
            >
              {terminésVisibles ? 'Masquer les emplois terminés' : 'Afficher les emplois terminés'}
            </Button>
            {terminésVisibles
              ? termines.map((emploi) => (
                  <AccordeonEmploi
                    key={emploi.id}
                    emploi={emploi}
                    deplie={emploiDeplieId === emploi.id}
                    onBasculer={() => basculerEmploi(emploi.id)}
                    typesContrat={typesContrat}
                    motifsSortie={motifsSortie}
                    etablissements={etablissements}
                    comptesBancaires={comptesBancaires}
                    banques={banques}
                    operations={operations}
                  />
                ))
              : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
