import { chargerReferentielsFiche } from '@/lib/api/referentiels';
import { FormulaireCreationSociete } from '@/components/societes/formulaire-creation-societe';

export default async function PageCreationSociete() {
  const refs = await chargerReferentielsFiche();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Creer une societe</h1>
        <p className="text-muted-foreground text-sm">
          L etablissement principal sera cree automatiquement avec l adresse du siege.
        </p>
      </div>
      <FormulaireCreationSociete formesJuridiques={refs.formesJuridiques} />
    </div>
  );
}
