'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type {
  ApiWarning,
  Banque,
  CompteBancaire,
  Etablissement,
  FormeJuridique,
  JourFerie,
  ParametrageEtablissement,
  ParametrageSociete,
  RessourceAvecOperations,
  Societe,
  TypeExoneration,
  TypeHeure,
} from '@paymarh/shared-types';
import {
  afficherDateInactivite,
  afficherDatesExoneration,
} from '@/lib/affichage/conditions';
import { formaterMoisAAAA_MM, libelleEtatDossier } from '@/lib/affichage/libelles';
import { AppelApiEchoue } from '@/lib/api/client';
import {
  impactSuppressionCompteBancaire,
  supprimerCompteBancaire,
} from '@/lib/api/comptes-bancaires';
import {
  impactSuppressionEtablissement,
  supprimerEtablissement,
} from '@/lib/api/etablissements';
import {
  changerEtatSociete,
  ecrireParametrageSociete,
  modifierSociete,
  supprimerSociete,
  impactSuppressionSociete,
} from '@/lib/api/societes';
import {
  inventaireImpactCompteBancaire,
  inventaireImpactEtablissement,
  inventaireImpactSociete,
} from '@/lib/impact/inventaire';
import { possedePermission } from '@/lib/permissions';
import { MessagesChamp, RegistreAvertissements } from '@/components/formulaire/messages-champ';
import { Rubrique } from '@/components/formulaire/rubrique';
import {
  DialogueImpactSuppression,
  type LigneImpact,
} from '@/components/impact-suppression/dialogue-impact-suppression';
import { SectionComptesBancaires } from '@/components/societes/section-comptes-bancaires';
import { SectionEtablissements } from '@/components/societes/section-etablissements';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export interface DonneesFicheSociete {
  readonly societe: RessourceAvecOperations<Societe>;
  readonly parametrageSociete: ParametrageSociete | null;
  readonly etablissements: readonly RessourceAvecOperations<Etablissement>[];
  readonly comptes: readonly RessourceAvecOperations<CompteBancaire>[];
  readonly parametragesEtablissements: Readonly<Record<string, ParametrageEtablissement | null>>;
  readonly formesJuridiques: readonly FormeJuridique[];
  readonly banques: readonly Banque[];
  readonly joursFeries: readonly JourFerie[];
  readonly typesHeures: readonly TypeHeure[];
  readonly typesExoneration: readonly TypeExoneration[];
}

export function FicheSocieteClient({ initial }: { readonly initial: DonneesFicheSociete }) {
  const router = useRouter();
  const [societe, setSociete] = useState(initial.societe);
  const [parametrage, setParametrage] = useState(initial.parametrageSociete);
  const [etablissements, setEtablissements] = useState(initial.etablissements);
  const [comptes, setComptes] = useState(initial.comptes);
  const [paramEtabs, setParamEtabs] = useState(initial.parametragesEtablissements);
  const [avertissements, setAvertissements] = useState<readonly ApiWarning[]>([]);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | undefined>();
  const [envoi, setEnvoi] = useState(false);
  const [etatCourant, setEtatCourant] = useState(societe.etatDossier);
  const [typeExoCourant, setTypeExoCourant] = useState(parametrage?.typeExonerationId ?? '');
  const [etabSelectionne, setEtabSelectionne] = useState(initial.etablissements[0]?.id ?? '');
  const [suppression, setSuppression] = useState<
    { type: 'societe' } | { type: 'etablissement'; id: string } | { type: 'compte'; id: string } | null
  >(null);

  const ops = societe.operations;
  const peutModifier = possedePermission(ops, 'societe.modifier');
  const peutChangerEtat = possedePermission(ops, 'societe.changer-etat');
  const peutSupprimerSociete = possedePermission(ops, 'societe.supprimer');

  function gererErreur(err: unknown): void {
    if (err instanceof AppelApiEchoue) {
      if (err.erreur.champ) setErreurs({ [err.erreur.champ]: err.erreur.message });
      else setErreurGlobale(err.erreur.message);
    } else setErreurGlobale('Une erreur est survenue.');
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-semibold">{societe.raisonSociale}</h1>
        <p className="text-muted-foreground text-sm">
          {societe.codeDossier} · {libelleEtatDossier(societe.etatDossier)} · Mois :{' '}
          {formaterMoisAAAA_MM(societe.moisEnCours)}
        </p>
      </header>

      <RegistreAvertissements avertissements={avertissements} />
      {erreurGlobale ? (
        <Alert variant="destructive">
          <AlertDescription>{erreurGlobale}</AlertDescription>
        </Alert>
      ) : null}

      <Rubrique titre="Etat du dossier" id="etat-dossier">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!peutChangerEtat) return;
            setEnvoi(true);
            setErreurs({});
            const fd = new FormData(e.currentTarget);
            void changerEtatSociete(societe.id, {
              etatDossier: fd.get('etatDossier'),
              dateInactivite: fd.get('dateInactivite') || null,
            })
              .then((r) => {
                setSociete(r.data);
                setEtatCourant(r.data.etatDossier);
                setAvertissements(r.warnings);
                router.refresh();
              })
              .catch(gererErreur)
              .finally(() => setEnvoi(false));
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="etatDossier">Etat</Label>
              <Select
                id="etatDossier"
                name="etatDossier"
                value={etatCourant}
                disabled={!peutChangerEtat}
                onChange={(e) => setEtatCourant(e.target.value as Societe['etatDossier'])}
              >
                <option value="EN_MONTAGE">En montage</option>
                <option value="EN_PRODUCTION">En production</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            {afficherDateInactivite(etatCourant) ? (
              <div className="space-y-2">
                <Label htmlFor="dateInactivite">Date d inactivite *</Label>
                <Input
                  id="dateInactivite"
                  name="dateInactivite"
                  placeholder="AAAA-MM"
                  defaultValue={societe.dateInactivite ?? ''}
                  disabled={!peutChangerEtat}
                  required
                />
                <MessagesChamp champ="dateInactivite" erreur={erreurs.dateInactivite} avertissements={avertissements} />
              </div>
            ) : null}
          </div>
          {peutChangerEtat ? (
            <Button type="submit" disabled={envoi}>
              Enregistrer l etat
            </Button>
          ) : null}
        </form>
      </Rubrique>

      <Rubrique titre="Identification" id="identification">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!peutModifier) return;
            setEnvoi(true);
            setErreurs({});
            const fd = new FormData(e.currentTarget);
            void modifierSociete(societe.id, Object.fromEntries(fd.entries()))
              .then((r) => {
                setSociete(r.data);
                setAvertissements(r.warnings);
                router.refresh();
              })
              .catch(gererErreur)
              .finally(() => setEnvoi(false));
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="codeDossier">Code dossier</Label>
            <Input id="codeDossier" name="codeDossier" defaultValue={societe.codeDossier} disabled={!peutModifier} required />
            <MessagesChamp champ="codeDossier" erreur={erreurs.codeDossier} avertissements={avertissements} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raisonSociale">Raison sociale</Label>
            <Input id="raisonSociale" name="raisonSociale" defaultValue={societe.raisonSociale} disabled={!peutModifier} required />
            <MessagesChamp champ="raisonSociale" erreur={erreurs.raisonSociale} avertissements={avertissements} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="formeJuridiqueId">Forme juridique</Label>
            <Select id="formeJuridiqueId" name="formeJuridiqueId" defaultValue={societe.formeJuridiqueId} disabled={!peutModifier}>
              {initial.formesJuridiques.map((f) => (
                <option key={f.id} value={f.id}>{f.libelle}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="identifiantFiscal">Identifiant fiscal</Label>
            <Input id="identifiantFiscal" name="identifiantFiscal" defaultValue={societe.identifiantFiscal ?? ''} disabled={!peutModifier} inputMode="numeric" />
            <MessagesChamp champ="identifiantFiscal" erreur={erreurs.identifiantFiscal} avertissements={avertissements} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moisDebutMontage">Mois debut montage</Label>
            <Input id="moisDebutMontage" name="moisDebutMontage" defaultValue={societe.moisDebutMontage} disabled={!peutModifier} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moisDebutProduction">Mois debut production</Label>
            <Input id="moisDebutProduction" name="moisDebutProduction" defaultValue={societe.moisDebutProduction} disabled={!peutModifier} />
          </div>
          {peutModifier ? (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={envoi}>Enregistrer</Button>
            </div>
          ) : null}
        </form>
      </Rubrique>

      <Rubrique titre="Employeur signataire" id="signataire">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!peutModifier) return;
            const fd = new FormData(e.currentTarget);
            void modifierSociete(societe.id, Object.fromEntries(fd.entries()))
              .then((r) => {
                setSociete(r.data);
                setAvertissements(r.warnings);
              })
              .catch(gererErreur);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="signatairePrenom">Prenom</Label>
            <Input id="signatairePrenom" name="signatairePrenom" defaultValue={societe.signatairePrenom ?? ''} disabled={!peutModifier} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signataireNom">Nom</Label>
            <Input id="signataireNom" name="signataireNom" defaultValue={societe.signataireNom ?? ''} disabled={!peutModifier} />
          </div>
          {peutModifier ? (
            <div className="sm:col-span-2">
              <Button type="submit">Enregistrer</Button>
            </div>
          ) : null}
        </form>
      </Rubrique>

      <Rubrique titre="Conges payes et exoneration" id="conges-exoneration" indiceHeritage="Valeur par defaut des futurs salaries (societe).">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!peutModifier) return;
            const fd = new FormData(e.currentTarget);
            void ecrireParametrageSociete(societe.id, {
              moisClotureConges: Number(fd.get('moisClotureConges')),
              typeExonerationId: typeExoCourant || null,
              exonerationDateDebut: fd.get('exonerationDateDebut') || null,
              exonerationDateFin: fd.get('exonerationDateFin') || null,
            })
              .then((r) => {
                setParametrage(r.data);
                setAvertissements(r.warnings);
              })
              .catch(gererErreur);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="moisClotureConges">Mois cloture conges</Label>
            <Select id="moisClotureConges" name="moisClotureConges" defaultValue={String(parametrage?.moisClotureConges ?? 12)} disabled={!peutModifier}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="typeExonerationId">Exoneration</Label>
            <Select
              id="typeExonerationId"
              name="typeExonerationId"
              value={typeExoCourant}
              disabled={!peutModifier}
              onChange={(e) => setTypeExoCourant(e.target.value)}
            >
              <option value="">Aucune</option>
              {initial.typesExoneration.map((t) => (
                <option key={t.id} value={t.id}>{t.libelle}</option>
              ))}
            </Select>
          </div>
          {afficherDatesExoneration(typeExoCourant) ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="exonerationDateDebut">Date debut *</Label>
                <Input id="exonerationDateDebut" name="exonerationDateDebut" defaultValue={parametrage?.exonerationDateDebut ?? ''} disabled={!peutModifier} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exonerationDateFin">Date fin</Label>
                <Input id="exonerationDateFin" name="exonerationDateFin" defaultValue={parametrage?.exonerationDateFin ?? ''} disabled={!peutModifier} />
              </div>
            </>
          ) : (
            <>
              <input type="hidden" name="exonerationDateDebut" value={parametrage?.exonerationDateDebut ?? ''} />
              <input type="hidden" name="exonerationDateFin" value={parametrage?.exonerationDateFin ?? ''} />
            </>
          )}
          {peutModifier ? (
            <div className="sm:col-span-2">
              <Button type="submit">Enregistrer</Button>
            </div>
          ) : null}
        </form>
      </Rubrique>

      <Rubrique titre="Parametrage technique" id="parametrage-technique" indiceHeritage="Matricules par defaut pour les salaries (societe).">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!peutModifier) return;
            const fd = new FormData(e.currentTarget);
            void modifierSociete(societe.id, {
              matriculePrefixe: fd.get('matriculePrefixe') || null,
              matriculeLongueur: Number(fd.get('matriculeLongueur')),
              matriculeGenerationAuto: fd.get('matriculeGenerationAuto') === 'on',
            })
              .then((r) => {
                setSociete(r.data);
                setAvertissements(r.warnings);
              })
              .catch(gererErreur);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="matriculePrefixe">Prefixe</Label>
            <Input id="matriculePrefixe" name="matriculePrefixe" defaultValue={societe.matriculePrefixe ?? ''} disabled={!peutModifier} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="matriculeLongueur">Longueur</Label>
            <Input id="matriculeLongueur" name="matriculeLongueur" type="number" defaultValue={societe.matriculeLongueur} disabled={!peutModifier} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="matriculeGenerationAuto" name="matriculeGenerationAuto" defaultChecked={societe.matriculeGenerationAuto} disabled={!peutModifier} />
            <Label htmlFor="matriculeGenerationAuto">Generation auto</Label>
          </div>
          {peutModifier ? (
            <div className="sm:col-span-2">
              <Button type="submit">Enregistrer</Button>
            </div>
          ) : null}
        </form>
      </Rubrique>

      <SectionComptesBancaires
        societeId={societe.id}
        comptes={comptes}
        etablissements={etablissements}
        banques={initial.banques}
        onChange={setComptes}
        onAvertissements={setAvertissements}
        onErreur={gererErreur}
        onSupprimer={(id) => setSuppression({ type: 'compte', id })}
      />

      <SectionEtablissements
        societeId={societe.id}
        etablissements={etablissements}
        paramEtabs={paramEtabs}
        typesHeures={initial.typesHeures}
        joursFeries={initial.joursFeries}
        etabSelectionne={etabSelectionne}
        onSelectEtab={setEtabSelectionne}
        onChangeEtab={setEtablissements}
        onChangeParam={setParamEtabs}
        onAvertissements={setAvertissements}
        onErreur={gererErreur}
        onSupprimer={(id) => setSuppression({ type: 'etablissement', id })}
      />

      {peutSupprimerSociete ? (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={() => setSuppression({ type: 'societe' })}>
            Supprimer la societe
          </Button>
        </div>
      ) : null}

      <DialogueImpactSuppression
        titre="Confirmer la suppression"
        ouvert={suppression !== null}
        onFermer={() => setSuppression(null)}
        onConfirme={() => {
          if (suppression?.type === 'societe') router.push('/societes');
          else router.refresh();
        }}
        chargerImpact={async () => {
          if (suppression?.type === 'societe') {
            const r = await impactSuppressionSociete(societe.id);
            return { inventaire: inventaireImpactSociete(r.data), jeton: r.data.jetonConfirmation };
          }
          if (suppression?.type === 'etablissement') {
            const r = await impactSuppressionEtablissement(suppression.id);
            return { inventaire: inventaireImpactEtablissement(r.data), jeton: r.data.jetonConfirmation };
          }
          if (suppression?.type === 'compte') {
            const r = await impactSuppressionCompteBancaire(suppression.id);
            return { inventaire: inventaireImpactCompteBancaire(r.data), jeton: r.data.jetonConfirmation };
          }
          return { inventaire: [] as readonly LigneImpact[], jeton: '' };
        }}
        supprimer={async (jeton) => {
          if (suppression?.type === 'societe') await supprimerSociete(societe.id, jeton);
          else if (suppression?.type === 'etablissement') await supprimerEtablissement(suppression.id, jeton);
          else if (suppression?.type === 'compte') await supprimerCompteBancaire(suppression.id, jeton);
        }}
      />
    </div>
  );
}
