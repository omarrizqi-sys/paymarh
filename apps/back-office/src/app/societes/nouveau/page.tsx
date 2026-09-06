import { chargerReferentielsFiche } from '@/lib/api/referentiels';
import { FormulaireCreationSociete } from '@/components/societes/formulaire-creation-societe';

export default async function PageCreationSociete() {
  const refs = await chargerReferentielsFiche();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Créer une société</h1>
        <p className="text-muted-foreground text-sm">
          L’établissement principal sera créé automatiquement avec l’adresse du siège.
        </p>
      </div>
      <FormulaireCreationSociete formesJuridiques={refs.formesJuridiques} />
    </div>
  );
}
