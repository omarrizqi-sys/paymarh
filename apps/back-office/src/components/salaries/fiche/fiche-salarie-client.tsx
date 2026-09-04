'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { FicheSalarieAvecOperations } from '@/lib/api/salaries';
import { lireSalarie } from '@/lib/api/salaries';
import { possedePermission } from '@/lib/permissions';
import { RegistreAlertesSalarie } from '@/components/salaries/formulaire/messages-alerte-salarie';
import {
  AvertissementNavigationFiche,
  confirmerNavigationAvecModifications,
} from './avertissement-navigation';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { RubriqueCoordonneesDemo } from './rubrique-coordonnees-demo';
import { RubriqueDatesDemo } from './rubrique-dates-demo';
import { RubriqueIdentiteDemo } from './rubrique-identite-demo';
import { RubriqueRemunerationPlaceholder } from './rubrique-remuneration-placeholder';
import { RailActionsFiche } from './rail-actions-fiche';
import { SommaireRubriques } from './sommaire-rubriques';
import { SqueletteFicheSalarie } from './squelette-fiche-salarie';

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly initial: FicheSalarieAvecOperations;
}

function SyncVersion({ version }: { readonly version: number }) {
  const { mettreAJourVersion } = useRegistreFiche();
  useEffect(() => {
    mettreAJourVersion(version);
  }, [mettreAJourVersion, version]);
  return null;
}

function LienRetourListe({ companyId }: { readonly companyId: string }) {
  const { rubriquesSommaire } = useRegistreFiche();
  const libelles = rubriquesSommaire.filter((r) => r.modifiee).map((r) => r.libelle);

  return (
    <Link
      href={`/societes/${companyId}/salaries`}
      className="text-primary mb-4 inline-block text-sm hover:underline"
      onClick={(event) => {
        if (!confirmerNavigationAvecModifications(libelles)) {
          event.preventDefault();
        }
      }}
    >
      ← Retour a la liste
    </Link>
  );
}

function ContenuFicheSalarie({
  companyId,
  salarieId,
  fiche,
  onFicheChange,
}: {
  readonly companyId: string;
  readonly salarieId: string;
  readonly fiche: FicheSalarieAvecOperations;
  readonly onFicheChange: (fiche: FicheSalarieAvecOperations) => void;
}) {
  const { alertesGlobales } = useRegistreFiche();
  const [rubriqueVisibleId, setRubriqueVisibleId] = useState<string | undefined>();

  const appliquerSlice = useCallback(
    (patch: Partial<FicheSalarieAvecOperations>) => {
      onFicheChange({ ...fiche, ...patch });
    },
    [fiche, onFicheChange]
  );

  return (
    <div className="space-y-4">
      <SyncVersion version={fiche.version} />
      <AvertissementNavigationFiche />

      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">
          {fiche.matricule} — {fiche.etat} — mois {fiche.moisEnCours}
        </p>
        <h1 className="text-2xl font-semibold">
          {fiche.prenom} {fiche.nom}
        </h1>
      </header>

      <RegistreAlertesSalarie alertes={alertesGlobales} />

      <SqueletteFicheSalarie
        sommaire={
          <SommaireRubriques
            rubriqueVisibleId={rubriqueVisibleId}
            onRubriqueVisibleChange={setRubriqueVisibleId}
          />
        }
        rubriques={
          <>
            {possedePermission(fiche.operations, 'salarie.modifier') ? (
              <>
                <RubriqueIdentiteDemo
                  companyId={companyId}
                  salarieId={salarieId}
                  valeurs={{ nom: fiche.nom, prenom: fiche.prenom }}
                  onServeurChange={(valeurs, version) => appliquerSlice({ ...valeurs, version })}
                />
                <RubriqueCoordonneesDemo
                  companyId={companyId}
                  salarieId={salarieId}
                  valeurs={{
                    adresse: fiche.adresse ?? '',
                    ville: fiche.ville ?? '',
                  }}
                  onServeurChange={(valeurs, version) =>
                    appliquerSlice({
                      adresse: valeurs.adresse,
                      ville: valeurs.ville,
                      version,
                    })
                  }
                />
                <RubriqueDatesDemo
                  companyId={companyId}
                  salarieId={salarieId}
                  valeurs={{
                    dateEntree: fiche.dateEntree,
                    dateAnciennete: fiche.dateAnciennete,
                  }}
                  onServeurChange={(valeurs, version) => appliquerSlice({ ...valeurs, version })}
                />
              </>
            ) : null}
            <RubriqueRemunerationPlaceholder operations={fiche.operations} />
          </>
        }
        renderRail={(compact) => (
          <RailActionsFiche operations={fiche.operations} modeCompact={compact} />
        )}
      />
    </div>
  );
}

export function FicheSalarieClient({ companyId, salarieId, initial }: Props) {
  const router = useRouter();
  const [fiche, setFiche] = useState(initial);

  const rechargerServeur = useCallback(async () => {
    const reponse = await lireSalarie(companyId, salarieId);
    setFiche(reponse.donnees);
    router.refresh();
  }, [companyId, router, salarieId]);

  return (
    <RegistreFicheProvider
      versionInitiale={initial.version}
      onRechargerServeur={rechargerServeur}
      onApresEnregistrement={(version) => setFiche((prev) => ({ ...prev, version }))}
    >
      <LienRetourListe companyId={companyId} />
      <ContenuFicheSalarie
        companyId={companyId}
        salarieId={salarieId}
        fiche={fiche}
        onFicheChange={setFiche}
      />
    </RegistreFicheProvider>
  );
}
