import Link from 'next/link';
import { lireSociete, lireParametrageSociete } from '@/lib/api/societes';
import { listerEtablissements } from '@/lib/api/etablissements';
import { listerComptesBancaires } from '@/lib/api/comptes-bancaires';
import { lireParametrageEtablissement } from '@/lib/api/etablissements';
import { chargerReferentielsFiche } from '@/lib/api/referentiels';
import {
  normaliserParametrageEtablissement,
  normaliserParametrageSociete,
} from '@/lib/api/parametrage-mapper';
import { FicheSocieteClient } from '@/components/societes/fiche-societe-client';
import { notFound } from 'next/navigation';

interface Props {
  readonly params: Promise<{ id: string }>;
}

export default async function PageFicheSociete({ params }: Props) {
  const { id } = await params;

  try {
    const [societeRes, refs, etabsRes, comptesRes] = await Promise.all([
      lireSociete(id),
      chargerReferentielsFiche(),
      listerEtablissements(id),
      listerComptesBancaires(id),
    ]);

    const societe = societeRes.data;
    const paramSocieteBrut = await lireParametrageSociete(id, societe.moisEnCours);

    const paramEtabs: Record<string, ReturnType<typeof normaliserParametrageEtablissement>> = {};
    await Promise.all(
      etabsRes.data.items.map(async (etab) => {
        const p = await lireParametrageEtablissement(etab.id, societe.moisEnCours);
        paramEtabs[etab.id] = normaliserParametrageEtablissement(
          p.data as Record<string, unknown> | null
        );
      })
    );

    return (
      <div className="space-y-4">
        <Link href="/societes" className="text-primary text-sm hover:underline">
          ← Retour a la liste
        </Link>
        <FicheSocieteClient
          initial={{
            societe,
            parametrageSociete: normaliserParametrageSociete(
              paramSocieteBrut.data as Record<string, unknown> | null
            ),
            etablissements: etabsRes.data.items,
            comptes: comptesRes.data.items,
            parametragesEtablissements: paramEtabs,
            formesJuridiques: refs.formesJuridiques,
            banques: refs.banques,
            joursFeries: refs.joursFeries,
            typesHeures: refs.typesHeures,
            typesExoneration: refs.typesExoneration,
          }}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
