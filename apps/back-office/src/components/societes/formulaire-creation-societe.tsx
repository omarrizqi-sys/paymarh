'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ApiWarning, FormeJuridique } from '@paymarh/shared-types';
import { creerSociete } from '@/lib/api/societes';
import { AppelApiEchoue } from '@/lib/api/client';
import { MessagesChamp, RegistreAvertissements } from '@/components/formulaire/messages-champ';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface Props {
  readonly formesJuridiques: readonly FormeJuridique[];
}

export function FormulaireCreationSociete({ formesJuridiques }: Props) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [avertissements, setAvertissements] = useState<readonly ApiWarning[]>([]);
  const [erreurGlobale, setErreurGlobale] = useState<string | undefined>();

  async function soumettre(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setEnvoi(true);
    setErreurs({});
    setErreurGlobale(undefined);
    setAvertissements([]);

    const fd = new FormData(e.currentTarget);
    const corps = {
      codeDossier: String(fd.get('codeDossier') ?? ''),
      raisonSociale: String(fd.get('raisonSociale') ?? ''),
      formeJuridiqueId: String(fd.get('formeJuridiqueId') ?? ''),
      etatDossier: String(fd.get('etatDossier') ?? 'EN_PRODUCTION'),
      moisDebutMontage: String(fd.get('moisDebutMontage') ?? ''),
      moisDebutProduction: String(fd.get('moisDebutProduction') ?? ''),
      etablissementPrincipal: {
        adresse: String(fd.get('adresse') ?? ''),
        ville: String(fd.get('ville') ?? ''),
        pays: String(fd.get('pays') ?? 'MA') || 'MA',
        codePostal: String(fd.get('codePostal') ?? '') || undefined,
        nom: String(fd.get('nomEtablissement') ?? '') || undefined,
      },
    };

    try {
      const reponse = await creerSociete(corps);
      setAvertissements(reponse.warnings);
      router.push(`/societes/${reponse.data.id}`);
    } catch (err) {
      if (err instanceof AppelApiEchoue) {
        if (err.erreur.champ) {
          setErreurs({ [err.erreur.champ]: err.erreur.message });
        } else {
          setErreurGlobale(err.erreur.message);
        }
      } else {
        setErreurGlobale('La creation a echoue.');
      }
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={(e) => void soumettre(e)} className="mx-auto max-w-3xl space-y-6">
      <RegistreAvertissements avertissements={avertissements} />
      {erreurGlobale ? <p className="text-destructive text-sm">{erreurGlobale}</p> : null}

      <Rubrique titre="Identification" id="identification">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="codeDossier">Code dossier *</Label>
            <Input id="codeDossier" name="codeDossier" required />
            <MessagesChamp champ="codeDossier" erreur={erreurs.codeDossier} avertissements={avertissements} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raisonSociale">Raison sociale *</Label>
            <Input id="raisonSociale" name="raisonSociale" required />
            <MessagesChamp champ="raisonSociale" erreur={erreurs.raisonSociale} avertissements={avertissements} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="formeJuridiqueId">Forme juridique *</Label>
            <Select id="formeJuridiqueId" name="formeJuridiqueId" required defaultValue="">
              <option value="" disabled>
                Choisir...
              </option>
              {formesJuridiques.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.libelle}
                </option>
              ))}
            </Select>
            <MessagesChamp champ="formeJuridiqueId" erreur={erreurs.formeJuridiqueId} />
          </div>
        </div>
      </Rubrique>

      <Rubrique titre="Etat du dossier" id="etat">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="etatDossier">Etat *</Label>
            <Select id="etatDossier" name="etatDossier" defaultValue="EN_PRODUCTION">
              <option value="EN_MONTAGE">En montage</option>
              <option value="EN_PRODUCTION">En production</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="moisDebutMontage">Mois de debut de montage *</Label>
            <Input id="moisDebutMontage" name="moisDebutMontage" placeholder="AAAA-MM" required />
            <MessagesChamp champ="moisDebutMontage" erreur={erreurs.moisDebutMontage} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moisDebutProduction">Mois de debut de production *</Label>
            <Input id="moisDebutProduction" name="moisDebutProduction" placeholder="AAAA-MM" required />
            <MessagesChamp champ="moisDebutProduction" erreur={erreurs.moisDebutProduction} />
          </div>
        </div>
      </Rubrique>

      <Rubrique
        titre="Etablissement principal"
        description="Cree automatiquement avec la societe. Adresse et ville obligatoires."
        id="etablissement-principal"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="adresse">Adresse *</Label>
            <Input id="adresse" name="adresse" required />
            <MessagesChamp champ="etablissementPrincipal.adresse" erreur={erreurs['etablissementPrincipal.adresse']} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ville">Ville *</Label>
            <Input id="ville" name="ville" required />
            <MessagesChamp champ="etablissementPrincipal.ville" erreur={erreurs['etablissementPrincipal.ville']} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pays">Pays</Label>
            <Input id="pays" name="pays" defaultValue="MA" maxLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codePostal">Code postal</Label>
            <Input id="codePostal" name="codePostal" inputMode="numeric" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nomEtablissement">Nom de l etablissement</Label>
            <Input id="nomEtablissement" name="nomEtablissement" />
          </div>
        </div>
      </Rubrique>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={envoi}>
          {envoi ? 'Creation...' : 'Creer la societe'}
        </Button>
      </div>
    </form>
  );
}
