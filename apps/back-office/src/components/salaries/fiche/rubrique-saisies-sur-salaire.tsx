'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AlerteApi, SaisieSurSalaire, TypeSaisieSurSalaire } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessagesAlerteChamp,
  RegistreAlertesSalarie,
} from '@/components/salaries/formulaire/messages-alerte-salarie';
import { AppelApiEchoue } from '@/lib/api/client';
import {
  creerSaisieSurSalaire,
  impactSuppressionSaisieSurSalaire,
  modifierSaisieSurSalaire,
  supprimerSaisieSurSalaire,
} from '@/lib/api/salaries';
import { envoyerLignesTableau } from '@/lib/fiche/envoi-lignes-tableau';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
import {
  avertissementChangementType,
  creerLigneVide,
  depuisServeur,
  estModifieeContreReference,
  estPensionAlimentaire,
  estSaisieTiersDetenteur,
  extraireLigneReponse,
  libelleEtatLigne,
  lignesEgales,
  trierAffichage,
  versCorpsCreation,
  versCorpsModification,
  type LigneSaisieSurSalaireLocale,
} from '@/lib/fiche/saisies-sur-salaire-lignes';
import { estLigneTableauCloturee } from '@/lib/fiche/lignes-tableau-historise-commun';
import { useFormulaireTableau } from './contexte-formulaire-tableau';
import { EnveloppeTableauRepetable } from './enveloppe-tableau-repetable';
import { useRegistreFiche } from './registre-fiche-provider';
import { TeteRubriqueFiche } from './tete-rubrique-fiche';
import {
  PREAMBULE_SITUATION_CHANGEE,
  textesSuppressionHistorisee,
} from './textes-suppression-tableau-historise';

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly lignesServeur: readonly SaisieSurSalaire[];
  readonly typesSaisie: readonly TypeSaisieSurSalaire[];
  readonly onVersionChange: (version: number) => void;
}

function libelleType(code: string, types: readonly TypeSaisieSurSalaire[]): string {
  return types.find((t) => t.code === code)?.libelle ?? code;
}

export function RubriqueSaisiesSurSalaire({
  companyId,
  salarieId,
  lignesServeur,
  typesSaisie,
  onVersionChange,
}: Props) {
  const typeParDefaut = typesSaisie[0]?.code ?? '';
  const {
    enregistrerRubrique,
    notifierSommaire,
    signalerVersionApresEcritureHorsSequence,
    signalerDebutEcritureHorsSequence,
    signalerFinEcritureHorsSequence,
    enregistrerAvantEnvoi,
    enregistrementEnCours,
    version,
  } = useRegistreFiche();
  const { formulaireOuvertId, ouvrirFormulaire, fermerFormulaire } = useFormulaireTableau();

  const [reference, setReference] = useState(() => lignesServeur.map(depuisServeur));
  const [courant, setCourant] = useState(() => lignesServeur.map(depuisServeur));
  const [alertes, setAlertes] = useState<readonly AlerteApi[]>([]);
  const [alertesParLigne, setAlertesParLigne] = useState<Record<string, readonly AlerteApi[]>>({});
  const [avertissementsType, setAvertissementsType] = useState<Record<string, string>>({});

  const jetonSuppressionRef = useRef('');
  const snapshotsRef = useRef<Map<string, LigneSaisieSurSalaireLocale>>(new Map());
  const courantRef = useRef(courant);
  const referenceRef = useRef(reference);
  courantRef.current = courant;
  referenceRef.current = reference;

  const reinitialiserRubrique = useCallback(() => {
    const suivant = referenceRef.current.map((l) => ({ ...l }));
    setCourant(suivant);
    courantRef.current = suivant;
    setAlertes([]);
    setAlertesParLigne({});
    setAvertissementsType({});
    snapshotsRef.current.clear();
    fermerFormulaire();
    notifierSommaire();
  }, [fermerFormulaire, notifierSommaire]);

  const lignesAffichees = useMemo(() => trierAffichage(courant), [courant]);

  const modifierLigne = useCallback(
    (id: string, patch: Partial<LigneSaisieSurSalaireLocale>) => {
      setCourant((prev) => {
        const suivant = prev.map((l) => (l.id === id ? { ...l, ...patch } : l));
        courantRef.current = suivant;
        return suivant;
      });
      setAlertes([]);
      setAlertesParLigne((prev) => {
        const { [id]: _ignore, ...suivant } = prev;
        return suivant;
      });
      notifierSommaire();
    },
    [notifierSommaire]
  );

  const changerTypeSaisie = useCallback(
    (id: string, nouveauType: string) => {
      const ligne = courantRef.current.find((l) => l.id === id);
      if (ligne === undefined) return;
      const avertissement = avertissementChangementType(ligne, nouveauType);
      setAvertissementsType((prev) => {
        if (avertissement === null) {
          const { [id]: _ignore, ...reste } = prev;
          return reste;
        }
        return { ...prev, [id]: avertissement };
      });
      modifierLigne(id, { typeSaisieCode: nouveauType });
    },
    [modifierLigne]
  );

  const ouvrirFormulaireLigne = useCallback(
    (id: string) => {
      if (id === '') {
        fermerFormulaire();
        return;
      }
      if (enregistrementEnCours) return;
      const ligne = courantRef.current.find((l) => l.id === id);
      if (ligne !== undefined && !snapshotsRef.current.has(id)) {
        snapshotsRef.current.set(id, { ...ligne });
      }
      ouvrirFormulaire(id);
    },
    [enregistrementEnCours, fermerFormulaire, ouvrirFormulaire]
  );

  const validerLigne = useCallback(
    (id: string) => {
      snapshotsRef.current.delete(id);
      fermerFormulaire();
      void id;
    },
    [fermerFormulaire]
  );

  const annulerLigne = useCallback(
    (id: string) => {
      const snapshot = snapshotsRef.current.get(id);
      if (snapshot !== undefined) {
        setCourant((prev) => prev.map((l) => (l.id === id ? snapshot : l)));
        snapshotsRef.current.delete(id);
      }
      setAvertissementsType((prev) => {
        const { [id]: _ignore, ...reste } = prev;
        return reste;
      });
      fermerFormulaire();
    },
    [fermerFormulaire]
  );

  useEffect(() => {
    return enregistrerAvantEnvoi(() => {
      if (formulaireOuvertId !== null) {
        fermerFormulaire();
      }
    });
  }, [enregistrerAvantEnvoi, fermerFormulaire, formulaireOuvertId]);

  const appliquerLigneServeur = useCallback(
    (ligneServeur: SaisieSurSalaire, nouvelleVersion: number) => {
      const locale = depuisServeur(ligneServeur);
      const prochainCourant = (prev: LigneSaisieSurSalaireLocale[]) => {
        const ids = prev.map((l) => l.id);
        if (ids.includes(ligneServeur.id)) {
          return prev.map((l) => (l.id === ligneServeur.id ? locale : l));
        }
        const remplace = prev.findIndex(
          (l) =>
            l.etat === 'NON_ENREGISTREE' &&
            l.referenceDecision === locale.referenceDecision &&
            l.moisDebut === locale.moisDebut
        );
        if (remplace >= 0) {
          const copie = [...prev];
          copie[remplace] = locale;
          return copie;
        }
        return [...prev.filter((l) => l.id !== ligneServeur.id), locale];
      };
      const prochainReference = (prev: LigneSaisieSurSalaireLocale[]) => {
        if (prev.some((l) => l.id === locale.id)) {
          return prev.map((l) => (l.id === locale.id ? locale : l));
        }
        return [...prev, locale];
      };
      const suivantCourant = prochainCourant(courantRef.current);
      courantRef.current = suivantCourant;
      setCourant((prev) => {
        const suivant = prochainCourant(prev);
        courantRef.current = suivant;
        return suivant;
      });
      const suivantReference = prochainReference(referenceRef.current);
      referenceRef.current = suivantReference;
      setReference((prev) => {
        const suivant = prochainReference(prev);
        referenceRef.current = suivant;
        return suivant;
      });
      signalerVersionApresEcritureHorsSequence(nouvelleVersion);
      onVersionChange(nouvelleVersion);
    },
    [onVersionChange, signalerVersionApresEcritureHorsSequence]
  );

  const envoyerRubrique = useCallback(
    async (versionEnvoi: number): Promise<EnvoiRubriqueResultat> => {
      const resultat = await envoyerLignesTableau({
        versionInitiale: versionEnvoi,
        courant: courantRef.current,
        reference: referenceRef.current,
        trierAffichage,
        getId: (l) => l.id,
        estNonEnregistree: (l) => l.etat === 'NON_ENREGISTREE',
        estModifiee: (l, ref) => !lignesEgales(l, ref),
        versCorpsCreation,
        versCorpsModification,
        creer: async (version, corps) => {
          const reponse = await creerSaisieSurSalaire(
            companyId,
            salarieId,
            version,
            corps as ReturnType<typeof versCorpsCreation>
          );
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.saisiesSurSalaire,
          };
        },
        modifier: async (id, version, corps) => {
          const reponse = await modifierSaisieSurSalaire(companyId, salarieId, id, version, corps);
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.saisiesSurSalaire,
          };
        },
        extraireLigneReponse,
        depuisServeur,
        ouvrirFormulaire,
        onMajCourant: (updater) => {
          setCourant((prev) => {
            const suivant = updater(prev);
            courantRef.current = suivant;
            return suivant;
          });
        },
        onMajReference: (updater) => {
          setReference((prev) => {
            const suivant = updater(prev);
            referenceRef.current = suivant;
            return suivant;
          });
        },
        onAlertesParLigne: setAlertesParLigne,
      });

      setAlertes(resultat.alertes);
      setAvertissementsType({});
      onVersionChange(resultat.version);
      return resultat;
    },
    [companyId, onVersionChange, ouvrirFormulaire, salarieId]
  );

  useEffect(() => {
    const desenregistrer = enregistrerRubrique({
      id: 'saisies-sur-salaire',
      libelle: 'Saisies sur salaire',
      estModifiee: () => estModifieeContreReference(courantRef.current, referenceRef.current),
      envoyer: envoyerRubrique,
      reinitialiser: reinitialiserRubrique,
    });
    return desenregistrer;
  }, [enregistrerRubrique, envoyerRubrique, reinitialiserRubrique]);

  const colonnes = useMemo(
    () => [
      {
        id: 'referenceDecision',
        libelle: 'Référence de la décision',
        render: (l: LigneSaisieSurSalaireLocale) => l.referenceDecision,
      },
      {
        id: 'creancier',
        libelle: 'Créancier demandeur',
        render: (l: LigneSaisieSurSalaireLocale) => l.creancier,
      },
      {
        id: 'typeSaisie',
        libelle: 'Type de saisie',
        render: (l: LigneSaisieSurSalaireLocale) => libelleType(l.typeSaisieCode, typesSaisie),
      },
      {
        id: 'moisDebut',
        libelle: 'Mois de début',
        render: (l: LigneSaisieSurSalaireLocale) => l.moisDebut,
      },
    ],
    [typesSaisie]
  );

  const suppression = useMemo(
    () => ({
      preparer: async (ligne: LigneSaisieSurSalaireLocale) => {
        const reponse = await impactSuppressionSaisieSurSalaire(companyId, salarieId, ligne.id);
        jetonSuppressionRef.current = reponse.donnees.jetonConfirmation;
        return textesSuppressionHistorisee({
          titre: 'Supprimer cette saisie ?',
          messageServeur: reponse.donnees.message,
          rubriqueModifiee: estModifieeContreReference(courantRef.current, referenceRef.current),
        });
      },
      confirmer: async (ligne: LigneSaisieSurSalaireLocale) => {
        try {
          const reponse = await supprimerSaisieSurSalaire(
            companyId,
            salarieId,
            ligne.id,
            version,
            jetonSuppressionRef.current
          );
          const idsConnus = new Set(courantRef.current.map((l) => l.id));
          const ligneServeur = extraireLigneReponse(
            reponse.donnees.saisiesSurSalaire,
            ligne.id,
            idsConnus
          );
          if (ligneServeur !== undefined) {
            appliquerLigneServeur(ligneServeur, reponse.donnees.version);
            const locale = depuisServeur(ligneServeur);
            const prochain = (prev: LigneSaisieSurSalaireLocale[]) => {
              const sans = prev.filter((l) => l.id !== ligne.id);
              if (sans.some((l) => l.id === locale.id)) {
                return sans.map((l) => (l.id === locale.id ? locale : l));
              }
              return [...sans, locale];
            };
            const suivantCourant = prochain(courantRef.current);
            courantRef.current = suivantCourant;
            setCourant((prev) => {
              const suivant = prochain(prev);
              courantRef.current = suivant;
              return suivant;
            });
            const suivantReference = prochain(referenceRef.current);
            referenceRef.current = suivantReference;
            setReference((prev) => {
              const suivant = prochain(prev);
              referenceRef.current = suivant;
              return suivant;
            });
          } else {
            const suivantCourant = courantRef.current.filter((l) => l.id !== ligne.id);
            const suivantReference = referenceRef.current.filter((l) => l.id !== ligne.id);
            courantRef.current = suivantCourant;
            referenceRef.current = suivantReference;
            setCourant((prev) => {
              const suivant = prev.filter((l) => l.id !== ligne.id);
              courantRef.current = suivant;
              return suivant;
            });
            setReference((prev) => {
              const suivant = prev.filter((l) => l.id !== ligne.id);
              referenceRef.current = suivant;
              return suivant;
            });
            signalerVersionApresEcritureHorsSequence(reponse.donnees.version);
            onVersionChange(reponse.donnees.version);
          }
          notifierSommaire();
          return { type: 'termine' as const };
        } catch (erreur) {
          if (erreur instanceof AppelApiEchoue && erreur.erreur.code === 'CONFIRMATION_OBSOLETE') {
            return { type: 'recommencer' as const, preambule: PREAMBULE_SITUATION_CHANGEE };
          }
          throw erreur;
        }
      },
    }),
    [
      appliquerLigneServeur,
      companyId,
      notifierSommaire,
      onVersionChange,
      salarieId,
      signalerVersionApresEcritureHorsSequence,
      version,
    ]
  );

  const gererAttenteSuppression = useCallback(
    (enAttente: boolean) => {
      if (enAttente) {
        signalerDebutEcritureHorsSequence();
      } else {
        signalerFinEcritureHorsSequence();
      }
    },
    [signalerDebutEcritureHorsSequence, signalerFinEcritureHorsSequence]
  );

  return (
    <Rubrique id="saisies-sur-salaire" titre="Saisies sur salaire">
      <TeteRubriqueFiche alertes={alertes} testidAlertes="alertes-tete-saisies-sur-salaire" />

      <EnveloppeTableauRepetable
        colonnes={colonnes}
        lignes={lignesAffichees}
        getLigneId={(l) => l.id}
        estInactive={estLigneTableauCloturee}
        estNonEnregistree={(l) => l.etat === 'NON_ENREGISTREE'}
        libelleEtatLigne={libelleEtatLigne}
        idColonneMarque="referenceDecision"
        ligneEnErreur={(ligne) => (alertesParLigne[ligne.id]?.length ?? 0) > 0}
        formulaireOuvertId={formulaireOuvertId}
        onOuvrirFormulaire={ouvrirFormulaireLigne}
        onValiderLigne={validerLigne}
        onAnnulerLigne={annulerLigne}
        verrouille={enregistrementEnCours}
        suppression={suppression}
        onAttenteSuppressionChange={gererAttenteSuppression}
        peutModifier
        testId="enveloppe-saisies-sur-salaire"
        onAjouter={() => {
          if (enregistrementEnCours) return;
          const nouvelle = creerLigneVide(typeParDefaut);
          setCourant((prev) => {
            const suivant = [...prev, nouvelle];
            courantRef.current = suivant;
            return suivant;
          });
          ouvrirFormulaireLigne(nouvelle.id);
          notifierSommaire();
        }}
        onSupprimer={(ligne) => {
          if (ligne.etat === 'NON_ENREGISTREE') {
            setCourant((prev) => {
              const suivant = prev.filter((item) => item.id !== ligne.id);
              courantRef.current = suivant;
              return suivant;
            });
            notifierSommaire();
          }
        }}
        renderFormulaire={(ligne, actions) => (
          <FormulaireSaisieSurSalaire
            ligne={ligne}
            typesSaisie={typesSaisie}
            alertes={alertesParLigne[ligne.id] ?? []}
            avertissementType={avertissementsType[ligne.id]}
            lectureSeule={actions.lectureSeule}
            onChange={(patch) => modifierLigne(ligne.id, patch)}
            onChangerType={(type) => changerTypeSaisie(ligne.id, type)}
            onValider={actions.onValider}
            onAnnuler={actions.onAnnuler}
          />
        )}
      />
    </Rubrique>
  );
}

function FormulaireSaisieSurSalaire({
  ligne,
  typesSaisie,
  alertes,
  avertissementType,
  lectureSeule,
  onChange,
  onChangerType,
  onValider,
  onAnnuler,
}: {
  readonly ligne: LigneSaisieSurSalaireLocale;
  readonly typesSaisie: readonly TypeSaisieSurSalaire[];
  readonly alertes: readonly AlerteApi[];
  readonly avertissementType?: string;
  readonly lectureSeule: boolean;
  readonly onChange: (patch: Partial<LigneSaisieSurSalaireLocale>) => void;
  readonly onChangerType: (type: string) => void;
  readonly onValider: () => void;
  readonly onAnnuler: () => void;
}) {
  const pension = estPensionAlimentaire(ligne.typeSaisieCode);
  const tiers = estSaisieTiersDetenteur(ligne.typeSaisieCode);

  if (lectureSeule) {
    return (
      <div className="space-y-2" data-testid="formulaire-lecture-seule">
        <p>Type de saisie : {libelleType(ligne.typeSaisieCode, typesSaisie)}</p>
        <p>Référence de la décision : {ligne.referenceDecision}</p>
        <p>Créancier demandeur : {ligne.creancier}</p>
        <p>Libellé bulletin : {ligne.libelleBulletin}</p>
        <p>Mois de début : {ligne.moisDebut}</p>
        {pension ? (
          <>
            <p>Montant mensuel : {ligne.montantMensuel}</p>
            <p>Mois de fin : {ligne.moisFin}</p>
          </>
        ) : null}
        {tiers ? <p>Montant total : {ligne.montantTotal}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RegistreAlertesSalarie alertes={alertes} />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`typeSaisie-${ligne.id}`}>Type de saisie</Label>
          <Select
            id={`typeSaisie-${ligne.id}`}
            value={ligne.typeSaisieCode}
            onChange={(e) => onChangerType(e.target.value)}
          >
            {typesSaisie.map((type) => (
              <option key={type.code} value={type.code}>
                {type.libelle}
              </option>
            ))}
          </Select>
          {avertissementType !== undefined ? (
            <Alert variant="warning" data-testid="avertissement-changement-type">
              <AlertDescription>{avertissementType}</AlertDescription>
            </Alert>
          ) : null}
          <MessagesAlerteChamp alertes={alertes} champ="typeSaisieCode" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`referenceDecision-${ligne.id}`}>Référence de la décision</Label>
          <Input
            id={`referenceDecision-${ligne.id}`}
            value={ligne.referenceDecision}
            onChange={(e) => onChange({ referenceDecision: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="referenceDecision" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`creancier-${ligne.id}`}>Créancier demandeur</Label>
          <Input
            id={`creancier-${ligne.id}`}
            value={ligne.creancier}
            onChange={(e) => onChange({ creancier: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="creancier" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`libelleBulletin-${ligne.id}`}>Libellé bulletin</Label>
          <Input
            id={`libelleBulletin-${ligne.id}`}
            value={ligne.libelleBulletin}
            onChange={(e) => onChange({ libelleBulletin: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="libelleBulletin" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`moisDebut-${ligne.id}`}>Mois de début</Label>
          <Input
            id={`moisDebut-${ligne.id}`}
            type="month"
            value={ligne.moisDebut}
            onChange={(e) => onChange({ moisDebut: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="moisDebut" />
        </div>
        {pension ? (
          <>
            <div className="space-y-2">
              <Label htmlFor={`montantMensuel-${ligne.id}`}>Montant mensuel</Label>
              <Input
                id={`montantMensuel-${ligne.id}`}
                value={ligne.montantMensuel}
                onChange={(e) => onChange({ montantMensuel: e.target.value })}
              />
              <MessagesAlerteChamp alertes={alertes} champ="montantMensuel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`moisFin-${ligne.id}`}>Mois de fin</Label>
              <Input
                id={`moisFin-${ligne.id}`}
                type="month"
                value={ligne.moisFin}
                onChange={(e) => onChange({ moisFin: e.target.value })}
              />
              <p className="text-muted-foreground text-sm">
                Laissez vide si la pension est due sans terme fixé.
              </p>
              <MessagesAlerteChamp alertes={alertes} champ="moisFin" />
            </div>
          </>
        ) : null}
        {tiers ? (
          <div className="space-y-2">
            <Label htmlFor={`montantTotal-${ligne.id}`}>Montant total</Label>
            <Input
              id={`montantTotal-${ligne.id}`}
              value={ligne.montantTotal}
              onChange={(e) => onChange({ montantTotal: e.target.value })}
            />
            <MessagesAlerteChamp alertes={alertes} champ="montantTotal" />
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button type="button" data-testid="valider-ligne" onClick={onValider}>
          Valider la ligne
        </Button>
        <Button type="button" variant="outline" data-testid="annuler-ligne" onClick={onAnnuler}>
          Annuler la ligne
        </Button>
      </div>
    </div>
  );
}
