'use client';

import type { ApiWarning, Banque, CompteBancaire, Etablissement, RessourceAvecOperations } from '@paymarh/shared-types';
import { afficherUtiliseParCompte } from '@/lib/affichage/conditions';
import { creerCompteBancaire, cloturerCompteBancaire } from '@/lib/api/comptes-bancaires';
import { possedePermission } from '@/lib/permissions';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface Props {
  readonly societeId: string;
  readonly comptes: readonly RessourceAvecOperations<CompteBancaire>[];
  readonly etablissements: readonly Etablissement[];
  readonly banques: readonly Banque[];
  readonly onChange: (c: readonly RessourceAvecOperations<CompteBancaire>[]) => void;
  readonly onAvertissements: (w: readonly ApiWarning[]) => void;
  readonly onErreur: (e: unknown) => void;
  readonly onSupprimer: (id: string) => void;
}

export function SectionComptesBancaires({
  societeId,
  comptes,
  etablissements,
  banques,
  onChange,
  onAvertissements,
  onErreur,
  onSupprimer,
}: Props) {
  const ops = comptes[0]?.operations ?? [];
  const peutCreer = possedePermission(ops, 'compte-bancaire.creer');
  const afficherUtilisePar = afficherUtiliseParCompte(etablissements.length);

  async function creer(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const etabIds = afficherUtilisePar
      ? fd.getAll('etablissementIds').map(String)
      : etablissements.map((et) => et.id);
    try {
      const r = await creerCompteBancaire(societeId, {
        libelle: fd.get('libelle') || undefined,
        banqueId: fd.get('banqueId') || null,
        banqueSaisieLibre: fd.get('banqueSaisieLibre') || null,
        rib: fd.get('rib') || undefined,
        iban: fd.get('iban') || undefined,
        bic: fd.get('bic') || undefined,
        usageSalaires: fd.get('usageSalaires') === 'on',
        usageCotisationsSociales: fd.get('usageCotisationsSociales') === 'on',
        usageIR: fd.get('usageIR') === 'on',
        etablissementIds: etabIds,
      });
      onChange([...comptes, r.data]);
      onAvertissements(r.warnings);
      e.currentTarget.reset();
    } catch (err) {
      onErreur(err);
    }
  }

  return (
    <Rubrique titre="Informations bancaires" id="comptes-bancaires">
      <ul className="space-y-4">
        {comptes.map((c) => (
          <li key={c.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{c.libelle ?? 'Compte sans libelle'}</span>
              <Badge variant={c.etat === 'ACTIF' ? 'success' : 'secondary'}>{c.etat}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">RIB : {c.rib ?? '—'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {possedePermission(c.operations, 'compte-bancaire.cloturer') && c.etat === 'ACTIF' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void cloturerCompteBancaire(c.id).then((r) => {
                      onChange(comptes.map((x) => (x.id === c.id ? r.data : x)));
                      onAvertissements(r.warnings);
                    })
                  }
                >
                  Cloturer
                </Button>
              ) : null}
              {possedePermission(c.operations, 'compte-bancaire.supprimer') ? (
                <Button size="sm" variant="destructive" onClick={() => onSupprimer(c.id)}>
                  Supprimer
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {peutCreer ? (
        <>
          <Separator className="my-6" />
          <form onSubmit={(e) => void creer(e)} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="libelle">Libelle</Label>
              <Input id="libelle" name="libelle" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banqueId">Banque</Label>
              <Select id="banqueId" name="banqueId" defaultValue="">
                <option value="">Saisie libre ci-dessous</option>
                {banques.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="banqueSaisieLibre">Banque (saisie libre)</Label>
              <Input id="banqueSaisieLibre" name="banqueSaisieLibre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rib">RIB</Label>
              <Input id="rib" name="rib" inputMode="numeric" />
            </div>
            <div className="flex flex-wrap gap-4 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox id="usageSalaires" name="usageSalaires" defaultChecked />
                <Label htmlFor="usageSalaires">Salaires</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="usageCotisationsSociales" name="usageCotisationsSociales" />
                <Label htmlFor="usageCotisationsSociales">Cotisations sociales</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="usageIR" name="usageIR" />
                <Label htmlFor="usageIR">IR</Label>
              </div>
            </div>
            {afficherUtilisePar ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>Utilise par</Label>
                <div className="flex flex-wrap gap-3">
                  {etablissements.map((et) => (
                    <div key={et.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`etab-${et.id}`}
                        name="etablissementIds"
                        value={et.id}
                        defaultChecked
                      />
                      <Label htmlFor={`etab-${et.id}`}>{et.nom}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit">Ajouter le compte</Button>
            </div>
          </form>
        </>
      ) : null}
    </Rubrique>
  );
}
