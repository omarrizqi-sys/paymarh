'use client';

import { useCallback, useState } from 'react';
import type {
  ApiWarning,
  Etablissement,
  JourFerie,
  ParametrageEtablissement,
  RessourceAvecOperations,
  TypeHeure,
} from '@paymarh/shared-types';
import {
  afficherFormatCodePostalMaroc,
  afficherIndemniteTeletravailVersee,
  afficherMontantIndemniteTeletravail,
} from '@/lib/affichage/conditions';
import { libelleJourSemaine } from '@/lib/affichage/libelles';
import {
  creerEtablissement,
  deduireHeuresMensuelles,
  designerPrincipal,
  ecrireParametrageEtablissement,
  modifierEtablissement,
} from '@/lib/api/etablissements';
import { possedePermission } from '@/lib/permissions';
import {
  extraireGrilleDepuisParametrage,
  GrilleHoraireDefaut,
  serialiserGrille,
} from '@/components/etablissements/grille-horaire';
import { JoursFeriesTravailles } from '@/components/etablissements/jours-feries-travailles';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface Props {
  readonly societeId: string;
  readonly etablissements: readonly RessourceAvecOperations<Etablissement>[];
  readonly paramEtabs: Readonly<Record<string, ParametrageEtablissement | null>>;
  readonly typesHeures: readonly TypeHeure[];
  readonly joursFeries: readonly JourFerie[];
  readonly etabSelectionne: string;
  readonly onSelectEtab: (id: string) => void;
  readonly onChangeEtab: (e: readonly RessourceAvecOperations<Etablissement>[]) => void;
  readonly onChangeParam: (p: Record<string, ParametrageEtablissement | null>) => void;
  readonly onAvertissements: (w: readonly ApiWarning[]) => void;
  readonly onErreur: (e: unknown) => void;
  readonly onSupprimer: (id: string) => void;
}

export function SectionEtablissements({
  societeId,
  etablissements,
  paramEtabs,
  typesHeures,
  joursFeries,
  etabSelectionne,
  onSelectEtab,
  onChangeEtab,
  onChangeParam,
  onAvertissements,
  onErreur,
  onSupprimer,
}: Props) {
  const etab = etablissements.find((e) => e.id === etabSelectionne);
  const param = etab ? paramEtabs[etab.id] : null;
  const ops = etab?.operations ?? etablissements[0]?.operations ?? [];
  const peutCreer = possedePermission(ops, 'etablissement.creer');
  const peutModifier = possedePermission(ops, 'etablissement.modifier');

  const [grille, setGrille] = useState<Record<string, string>>(() =>
    param?.horaireDefautLignes ? extraireGrilleDepuisParametrage(param.horaireDefautLignes) : {}
  );
  const [mensuel, setMensuel] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const l of param?.horaireMensuelLignes ?? []) m[l.typeHeureId] = l.nombreHeures;
    return m;
  });
  const [jfCoches, setJfCoches] = useState<Set<string>>(
    () => new Set((param?.joursFeriesTravailles ?? []).map((j) => j.jourFerieId))
  );

  const rechargerParamLocal = useCallback((p: ParametrageEtablissement | null) => {
    setGrille(p?.horaireDefautLignes ? extraireGrilleDepuisParametrage(p.horaireDefautLignes) : {});
    const m: Record<string, string> = {};
    for (const l of p?.horaireMensuelLignes ?? []) m[l.typeHeureId] = l.nombreHeures;
    setMensuel(m);
    setJfCoches(new Set((p?.joursFeriesTravailles ?? []).map((j) => j.jourFerieId)));
  }, []);

  const [deductionEnCours, setDeductionEnCours] = useState(false);

  async function deduireDepuisHebdo(form: HTMLFormElement): Promise<void> {
    if (!etab || !peutModifier) return;
    const fd = new FormData(form);
    setDeductionEnCours(true);
    try {
      const r = await deduireHeuresMensuelles(etab.id, {
        horaireDefautLignes: serialiserGrille(grille, typesHeures),
        dureeHebdomadaire: String(fd.get('dureeHebdomadaire') ?? param?.dureeHebdomadaire ?? '44'),
      });
      const m: Record<string, string> = {};
      for (const l of r.data.horaireMensuelLignes) m[l.typeHeureId] = l.nombreHeures;
      setMensuel(m);
    } catch (err) {
      onErreur(err);
    } finally {
      setDeductionEnCours(false);
    }
  }

  async function enregistrerParamEtab(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!etab || !peutModifier) return;
    const fd = new FormData(e.currentTarget);
    try {
      const r = await ecrireParametrageEtablissement(etab.id, {
        dureeHebdomadaire: fd.get('dureeHebdomadaire'),
        jourReposHebdomadaire: fd.get('jourReposHebdomadaire'),
        teletravailAutorise:
          fd.get('teletravailAutorise') === 'true'
            ? true
            : fd.get('teletravailAutorise') === 'false'
              ? false
              : null,
        indemniteTeletravailVersee:
          fd.get('indemniteTeletravailVersee') === 'true'
            ? true
            : fd.get('indemniteTeletravailVersee') === 'false'
              ? false
              : null,
        montantIndemniteTeletravail: fd.get('montantIndemniteTeletravail') || null,
        horaireDefautLignes: serialiserGrille(grille, typesHeures),
        horaireMensuelLignes: typesHeures.map((t) => ({
          typeHeureId: t.id,
          nombreHeures: mensuel[t.id] ?? '0',
        })),
        joursFeriesTravaillesIds: [...jfCoches],
      });
      onChangeParam({ ...paramEtabs, [etab.id]: r.data });
      rechargerParamLocal(r.data);
      onAvertissements(r.warnings);
    } catch (err) {
      onErreur(err);
    }
  }

  async function creerEtab(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const r = await creerEtablissement(societeId, {
        nom: fd.get('nom'),
        adresse: fd.get('adresse'),
        ville: fd.get('ville'),
        pays: fd.get('pays') || 'MA',
        codePostal: fd.get('codePostal') || undefined,
      });
      onChangeEtab([...etablissements, r.data]);
      onSelectEtab(r.data.id);
      onAvertissements(r.warnings);
      e.currentTarget.reset();
    } catch (err) {
      onErreur(err);
    }
  }

  const teletravail = param?.teletravailAutorise ?? null;
  const indemnite = param?.indemniteTeletravailVersee ?? null;
  const [teletravailSaisi, setTeletravailSaisi] = useState<boolean | null>(teletravail);
  const [indemniteSaisie, setIndemniteSaisie] = useState<boolean | null>(indemnite);

  const teletravailAffiche = teletravailSaisi ?? teletravail;
  const indemniteAffiche = indemniteSaisie ?? indemnite;

  return (
    <Rubrique
      titre="Etablissements"
      id="etablissements"
      indiceHeritage="La duree hebdomadaire, les horaires et les jours feries serviront de valeurs par defaut aux salaries (etablissement)."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {etablissements.map((e) => (
          <Button
            key={e.id}
            size="sm"
            variant={e.id === etabSelectionne ? 'default' : 'outline'}
            onClick={() => {
              onSelectEtab(e.id);
              rechargerParamLocal(paramEtabs[e.id] ?? null);
              setTeletravailSaisi(paramEtabs[e.id]?.teletravailAutorise ?? null);
              setIndemniteSaisie(paramEtabs[e.id]?.indemniteTeletravailVersee ?? null);
            }}
          >
            {e.nom}
            {e.estPrincipal ? ' (principal)' : ''}
          </Button>
        ))}
      </div>

      {etab ? (
        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!peutModifier) return;
              const fd = new FormData(e.currentTarget);
              void modifierEtablissement(etab.id, {
                nom: fd.get('nom'),
                adresse: fd.get('adresse'),
                complementAdresse: fd.get('complementAdresse') || null,
                ville: fd.get('ville'),
                pays: fd.get('pays'),
                codePostal: fd.get('codePostal') || null,
                ice: fd.get('ice') || null,
                taxeProfessionnelle: fd.get('taxeProfessionnelle') || null,
                telephone: fd.get('telephone') || null,
                email: fd.get('email') || null,
              })
                .then((r) => {
                  onChangeEtab(etablissements.map((x) => (x.id === etab.id ? r.data : x)));
                  onAvertissements(r.warnings);
                })
                .catch(onErreur);
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" defaultValue={etab.nom} disabled={!peutModifier} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" name="adresse" defaultValue={etab.adresse} disabled={!peutModifier} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="complementAdresse">Complement d adresse</Label>
              <Input
                id="complementAdresse"
                name="complementAdresse"
                defaultValue={etab.complementAdresse ?? ''}
                disabled={!peutModifier}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville">Ville</Label>
              <Input id="ville" name="ville" defaultValue={etab.ville} disabled={!peutModifier} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pays">Pays</Label>
              <Input id="pays" name="pays" defaultValue={etab.pays} disabled={!peutModifier} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codePostal">Code postal</Label>
              <Input id="codePostal" name="codePostal" defaultValue={etab.codePostal ?? ''} disabled={!peutModifier} />
              {afficherFormatCodePostalMaroc(etab.pays) ? (
                <p className="text-muted-foreground text-xs">Format attendu : 5 chiffres (Maroc)</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ice">ICE</Label>
              <Input id="ice" name="ice" defaultValue={etab.ice ?? ''} disabled={!peutModifier} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxeProfessionnelle">Taxe professionnelle</Label>
              <Input
                id="taxeProfessionnelle"
                name="taxeProfessionnelle"
                defaultValue={etab.taxeProfessionnelle ?? ''}
                disabled={!peutModifier}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Telephone</Label>
              <Input id="telephone" name="telephone" defaultValue={etab.telephone ?? ''} disabled={!peutModifier} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={etab.email ?? ''} disabled={!peutModifier} />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              {peutModifier ? <Button type="submit">Enregistrer l etablissement</Button> : null}
              {possedePermission(etab.operations, 'etablissement.designer-principal') && !etab.estPrincipal ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    void designerPrincipal(etab.id).then((r) => {
                      onChangeEtab(
                        etablissements.map((x) => ({
                          ...x,
                          estPrincipal: x.id === r.data.id,
                        }))
                      );
                    })
                  }
                >
                  Designer principal
                </Button>
              ) : null}
              {possedePermission(etab.operations, 'etablissement.supprimer') && !etab.estPrincipal ? (
                <Button type="button" variant="destructive" onClick={() => onSupprimer(etab.id)}>
                  Supprimer
                </Button>
              ) : null}
            </div>
          </form>

          <Separator />

          <form onSubmit={(e) => void enregistrerParamEtab(e)} className="space-y-6" id={`param-etab-${etab.id}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dureeHebdomadaire">Duree hebdomadaire (h)</Label>
                <Input
                  id="dureeHebdomadaire"
                  name="dureeHebdomadaire"
                  defaultValue={param?.dureeHebdomadaire ?? '44'}
                  disabled={!peutModifier}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jourReposHebdomadaire">Repos hebdomadaire</Label>
                <Select
                  id="jourReposHebdomadaire"
                  name="jourReposHebdomadaire"
                  defaultValue={param?.jourReposHebdomadaire ?? 'DIMANCHE'}
                  disabled={!peutModifier}
                >
                  {(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as const).map(
                    (j) => (
                      <option key={j} value={j}>
                        {libelleJourSemaine(j)}
                      </option>
                    )
                  )}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teletravailAutorise">Teletravail autorise</Label>
                <Select
                  id="teletravailAutorise"
                  name="teletravailAutorise"
                  defaultValue={teletravailAffiche === null ? '' : teletravailAffiche ? 'true' : 'false'}
                  disabled={!peutModifier}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setTeletravailSaisi(v === '' ? null : v === 'true');
                  }}
                >
                  <option value="">Non renseigne</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </Select>
              </div>
              {afficherIndemniteTeletravailVersee(teletravailAffiche) ? (
                <div className="space-y-2">
                  <Label htmlFor="indemniteTeletravailVersee">Verse une indemnite</Label>
                  <Select
                    id="indemniteTeletravailVersee"
                    name="indemniteTeletravailVersee"
                    defaultValue={indemniteAffiche === null ? '' : indemniteAffiche ? 'true' : 'false'}
                    disabled={!peutModifier}
                    onChange={(ev) => {
                      const v = ev.target.value;
                      setIndemniteSaisie(v === '' ? null : v === 'true');
                    }}
                  >
                    <option value="">Non renseigne</option>
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </Select>
                </div>
              ) : null}
              {afficherMontantIndemniteTeletravail(teletravailAffiche, indemniteAffiche) ? (
                <div className="space-y-2">
                  <Label htmlFor="montantIndemniteTeletravail">Montant indemnite</Label>
                  <Input
                    id="montantIndemniteTeletravail"
                    name="montantIndemniteTeletravail"
                    defaultValue={param?.montantIndemniteTeletravail ?? ''}
                    disabled={!peutModifier}
                  />
                </div>
              ) : null}
            </div>

            <div>
              <h4 className="mb-2 font-medium">Grille horaire hebdomadaire</h4>
              <GrilleHoraireDefaut
                typesHeures={typesHeures}
                valeurs={grille}
                onChange={(cle, val) => setGrille((g) => ({ ...g, [cle]: val }))}
                lectureSeule={!peutModifier}
                dureeHebdomadaire={param?.dureeHebdomadaire}
              />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-medium">Heures mensuelles par type</h4>
                {peutModifier ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deductionEnCours}
                    onClick={() => {
                      const form = document.getElementById(`param-etab-${etab.id}`) as HTMLFormElement | null;
                      if (form) void deduireDepuisHebdo(form);
                    }}
                  >
                    {deductionEnCours ? 'Calcul en cours…' : 'Deduire depuis l hebdomadaire'}
                  </Button>
                ) : null}
              </div>
              <p className="text-muted-foreground mb-2 text-xs">
                Saisie directe ou valeurs deduites par l API a partir de l hebdomadaire (52/12).
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[...typesHeures].sort((a, b) => a.ordre - b.ordre).map((t) => (
                  <div key={t.id} className="space-y-1">
                    <Label htmlFor={`mensuel-${t.id}`}>{t.libelle}</Label>
                    <Input
                      id={`mensuel-${t.id}`}
                      value={mensuel[t.id] ?? ''}
                      disabled={!peutModifier}
                      onChange={(ev) => setMensuel((m) => ({ ...m, [t.id]: ev.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Jours feries travailles</h4>
              <JoursFeriesTravailles
                joursFeries={joursFeries}
                coches={jfCoches}
                onToggle={(id, c) =>
                  setJfCoches((s) => {
                    const n = new Set(s);
                    if (c) n.add(id);
                    else n.delete(id);
                    return n;
                  })
                }
                lectureSeule={!peutModifier}
              />
            </div>

            {peutModifier ? <Button type="submit">Enregistrer le parametrage</Button> : null}
          </form>
        </div>
      ) : null}

      {peutCreer ? (
        <>
          <Separator className="my-6" />
          <form onSubmit={(e) => void creerEtab(e)} className="grid gap-4 sm:grid-cols-2">
            <h4 className="font-medium sm:col-span-2">Nouvel etablissement</h4>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nom-new">Nom *</Label>
              <Input id="nom-new" name="nom" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="adresse-new">Adresse *</Label>
              <Input id="adresse-new" name="adresse" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville-new">Ville *</Label>
              <Input id="ville-new" name="ville" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pays-new">Pays</Label>
              <Input id="pays-new" name="pays" defaultValue="MA" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Creer l etablissement</Button>
            </div>
          </form>
        </>
      ) : null}
    </Rubrique>
  );
}
