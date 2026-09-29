'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AlerteApi,
  AvantageEnNatureFiche,
  EmploiFiche,
  NatureAvantageEnNature,
  Permission,
} from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  MessagesAlerteChamp,
  RegistreAlertesSalarie,
} from '@/components/salaries/formulaire/messages-alerte-salarie';
import { AppelApiEchoue } from '@/lib/api/client';
import {
  creerAvantageEnNature,
  impactSuppressionAvantageEnNature,
  modifierAvantageEnNature,
  supprimerAvantageEnNature,
} from '@/lib/api/emplois';
import { afficherMontant } from '@/lib/affichage/montants';
import { libelleReferentielParCode } from '@/lib/affichage/libelles-emploi';
import { envoyerLignesTableau } from '@/lib/fiche/envoi-lignes-tableau';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
import {
  afficherMoisApplication,
  creerLigneVide,
  depuisServeur,
  estModifieeContreReference,
  extraireLigneReponse,
  libelleEtatLigne,
  lignesEgales,
  MOIS_APPLICATION,
  trierAffichage,
  versCorpsCreation,
  versCorpsModification,
  versServeur,
  type LigneAvantageEnNatureLocale,
} from '@/lib/fiche/avantages-en-nature-lignes';
import { estLigneTableauCloturee } from '@/lib/fiche/lignes-tableau-historise-commun';
import { idRubriqueEmploi, libelleRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import type { MiseAJourEmploiFiche } from '@/lib/fiche/valeurs-emploi';
import { possedePermission } from '@/lib/permissions';
import { useFormulaireTableau } from '../contexte-formulaire-tableau';
import { EnveloppeTableauRepetable } from '../enveloppe-tableau-repetable';
import { useRegistreFiche } from '../registre-fiche-provider';
import { TeteRubriqueFiche } from '../tete-rubrique-fiche';
import {
  PREAMBULE_SITUATION_CHANGEE,
  textesSuppressionHistorisee,
} from '@/components/navigation/textes-suppression-tableau-historise';

interface Props {
  readonly companyId: string;
  readonly emploi: EmploiFiche;
  readonly lignesServeur: readonly AvantageEnNatureFiche[];
  readonly natures: readonly NatureAvantageEnNature[];
  readonly operations: readonly Permission[];
  readonly onEmploiChange: (maj: MiseAJourEmploiFiche) => void;
}

function libelleNature(code: string, natures: readonly NatureAvantageEnNature[]): string {
  return libelleReferentielParCode(natures, code);
}

export function RubriqueEmploiAvantagesEnNature({
  companyId,
  emploi,
  lignesServeur,
  natures,
  operations,
  onEmploiChange,
}: Props) {
  const emploiId = emploi.id;
  const libellePoste = emploi.contrat.libellePoste;
  const peutEcrire = possedePermission(operations, 'salarie.remuneration.ecrire');

  const {
    enregistrerRubrique,
    notifierSommaire,
    signalerDebutEcritureHorsSequence,
    signalerFinEcritureHorsSequence,
    enregistrerAvantEnvoi,
    enregistrementEnCours,
    lireVersion,
  } = useRegistreFiche();
  const { formulaireOuvertId, ouvrirFormulaire, fermerFormulaire } = useFormulaireTableau();

  const [reference, setReference] = useState(() => lignesServeur.map(depuisServeur));
  const [courant, setCourant] = useState(() => lignesServeur.map(depuisServeur));
  const [alertes, setAlertes] = useState<readonly AlerteApi[]>([]);
  const [alertesParLigne, setAlertesParLigne] = useState<Record<string, readonly AlerteApi[]>>({});
  const [erreurRubrique, setErreurRubrique] = useState<string | undefined>();

  const jetonSuppressionRef = useRef('');
  const snapshotsRef = useRef<Map<string, LigneAvantageEnNatureLocale>>(new Map());
  const courantRef = useRef(courant);
  const referenceRef = useRef(reference);
  courantRef.current = courant;
  referenceRef.current = reference;

  const avantagesEnNatureEnregistres = useCallback((): AvantageEnNatureFiche[] => {
    return referenceRef.current
      .filter((ligne) => ligne.etat !== 'NON_ENREGISTREE')
      .map(versServeur);
  }, []);

  const propagerEmploiApresEcriture = useCallback(
    (nouvelleVersion: number) => {
      onEmploiChange((emploiCourant) => {
        if (emploiCourant.id !== emploiId) {
          return emploiCourant;
        }
        return {
          ...emploiCourant,
          version: nouvelleVersion,
          avantagesEnNature: avantagesEnNatureEnregistres(),
        };
      });
    },
    [avantagesEnNatureEnregistres, emploiId, onEmploiChange]
  );

  const reinitialiserRubrique = useCallback(() => {
    const suivant = referenceRef.current.map((l) => ({ ...l }));
    setCourant(suivant);
    courantRef.current = suivant;
    setAlertes([]);
    setAlertesParLigne({});
    setErreurRubrique(undefined);
    snapshotsRef.current.clear();
    fermerFormulaire();
    notifierSommaire();
  }, [fermerFormulaire, notifierSommaire]);

  const lignesAffichees = useMemo(() => trierAffichage(courant), [courant]);

  const modifierLigne = useCallback(
    (id: string, patch: Partial<LigneAvantageEnNatureLocale>) => {
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
      notifierSommaire();
      void id;
    },
    [fermerFormulaire, notifierSommaire]
  );

  const annulerLigne = useCallback(
    (id: string) => {
      const snapshot = snapshotsRef.current.get(id);
      if (snapshot !== undefined) {
        setCourant((prev) => prev.map((l) => (l.id === id ? snapshot : l)));
        snapshotsRef.current.delete(id);
      }
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
    (ligneServeur: AvantageEnNatureFiche, nouvelleVersion: number) => {
      const locale = depuisServeur(ligneServeur);
      const prochainCourant = (prev: LigneAvantageEnNatureLocale[]) => {
        const ids = prev.map((l) => l.id);
        if (ids.includes(ligneServeur.id)) {
          return prev.map((l) => (l.id === ligneServeur.id ? locale : l));
        }
        const remplace = prev.findIndex(
          (l) =>
            l.etat === 'NON_ENREGISTREE' &&
            l.natureRef === locale.natureRef &&
            l.montant === locale.montant
        );
        if (remplace >= 0) {
          const copie = [...prev];
          copie[remplace] = locale;
          return copie;
        }
        return [...prev.filter((l) => l.id !== ligneServeur.id), locale];
      };
      const prochainReference = (prev: LigneAvantageEnNatureLocale[]) => {
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
      propagerEmploiApresEcriture(nouvelleVersion);
    },
    [propagerEmploiApresEcriture]
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
          const reponse = await creerAvantageEnNature(
            companyId,
            emploiId,
            version,
            corps as ReturnType<typeof versCorpsCreation>
          );
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.avantagesEnNature ?? [],
          };
        },
        modifier: async (id, version, corps) => {
          const reponse = await modifierAvantageEnNature(companyId, emploiId, id, version, corps);
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.avantagesEnNature ?? [],
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
      propagerEmploiApresEcriture(resultat.version);
      return resultat;
    },
    [companyId, emploiId, ouvrirFormulaire, propagerEmploiApresEcriture]
  );

  useEffect(() => {
    const desenregistrer = enregistrerRubrique({
      id: idRubriqueEmploi(emploiId, 'avantages-en-nature'),
      libelle: libelleRubriqueEmploi('avantages-en-nature', libellePoste),
      entite: { kind: 'emploi', emploiId },
      estModifiee: () => estModifieeContreReference(courantRef.current, referenceRef.current),
      envoyer: envoyerRubrique,
      reinitialiser: reinitialiserRubrique,
    });
    return desenregistrer;
  }, [emploiId, enregistrerRubrique, envoyerRubrique, libellePoste, reinitialiserRubrique]);

  const colonnes = useMemo(
    () => [
      {
        id: 'nature',
        libelle: 'Nature',
        render: (l: LigneAvantageEnNatureLocale) => libelleNature(l.natureRef, natures),
      },
      {
        id: 'montant',
        libelle: 'Montant',
        render: (l: LigneAvantageEnNatureLocale) => afficherMontant(l.montant),
      },
      {
        id: 'moisApplication',
        libelle: 'Mois d’application',
        render: (l: LigneAvantageEnNatureLocale) => afficherMoisApplication(l.moisApplication),
      },
    ],
    [natures]
  );

  const suppression = useMemo(
    () => ({
      preparer: async (ligne: LigneAvantageEnNatureLocale) => {
        const reponse = await impactSuppressionAvantageEnNature(companyId, emploiId, ligne.id);
        jetonSuppressionRef.current = reponse.donnees.jetonConfirmation;
        return textesSuppressionHistorisee({
          titre: 'Supprimer cet avantage en nature ?',
          messageServeur: reponse.donnees.message,
          rubriqueModifiee: estModifieeContreReference(courantRef.current, referenceRef.current),
        });
      },
      confirmer: async (ligne: LigneAvantageEnNatureLocale) => {
        const versionEmploi = lireVersion({ kind: 'emploi', emploiId });
        try {
          const reponse = await supprimerAvantageEnNature(
            companyId,
            emploiId,
            ligne.id,
            versionEmploi,
            jetonSuppressionRef.current
          );
          const idsConnus = new Set(courantRef.current.map((l) => l.id));
          const ligneServeur = extraireLigneReponse(
            reponse.donnees.avantagesEnNature ?? [],
            ligne.id,
            idsConnus
          );
          if (ligneServeur !== undefined) {
            appliquerLigneServeur(ligneServeur, reponse.donnees.version);
            const locale = depuisServeur(ligneServeur);
            const prochain = (prev: LigneAvantageEnNatureLocale[]) => {
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
            propagerEmploiApresEcriture(reponse.donnees.version);
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
      emploiId,
      lireVersion,
      notifierSommaire,
      propagerEmploiApresEcriture,
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

  const natureParDefaut = natures[0]?.code ?? '';

  return (
    <Rubrique
      id={idRubriqueEmploi(emploiId, 'avantages-en-nature')}
      titre={`Avantages en nature — ${libellePoste}`}
    >
      <TeteRubriqueFiche
        erreur={erreurRubrique}
        alertes={alertes}
        testidErreur={`erreur-rubrique-${emploiId}-avantages-en-nature`}
        testidAlertes={`alertes-tete-${emploiId}-avantages-en-nature`}
      />

      <EnveloppeTableauRepetable
        colonnes={colonnes}
        lignes={lignesAffichees}
        getLigneId={(l) => l.id}
        estInactive={estLigneTableauCloturee}
        estNonEnregistree={(l) => l.etat === 'NON_ENREGISTREE'}
        libelleEtatLigne={libelleEtatLigne}
        idColonneMarque="nature"
        ligneEnErreur={(ligne) => (alertesParLigne[ligne.id]?.length ?? 0) > 0}
        formulaireOuvertId={formulaireOuvertId}
        onOuvrirFormulaire={ouvrirFormulaireLigne}
        onValiderLigne={validerLigne}
        onAnnulerLigne={annulerLigne}
        verrouille={enregistrementEnCours}
        suppression={suppression}
        onAttenteSuppressionChange={gererAttenteSuppression}
        peutModifier={peutEcrire}
        testId={`avantages-en-nature-${emploiId}`}
        onAjouter={() => {
          if (enregistrementEnCours || !peutEcrire) return;
          const nouvelle = creerLigneVide(natureParDefaut);
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
          <FormulaireAvantageEnNature
            ligne={ligne}
            natures={natures}
            alertes={alertesParLigne[ligne.id] ?? []}
            lectureSeule={actions.lectureSeule}
            onChange={(patch) => modifierLigne(ligne.id, patch)}
            onValider={actions.onValider}
            onAnnuler={actions.onAnnuler}
          />
        )}
      />
    </Rubrique>
  );
}

function FormulaireAvantageEnNature({
  ligne,
  natures,
  alertes,
  lectureSeule,
  onChange,
  onValider,
  onAnnuler,
}: {
  readonly ligne: LigneAvantageEnNatureLocale;
  readonly natures: readonly NatureAvantageEnNature[];
  readonly alertes: readonly AlerteApi[];
  readonly lectureSeule: boolean;
  readonly onChange: (patch: Partial<LigneAvantageEnNatureLocale>) => void;
  readonly onValider: () => void;
  readonly onAnnuler: () => void;
}) {
  const tousLesMoisCoches = ligne.moisApplication.length === 12;

  const basculerMois = (mois: number, coche: boolean) => {
    const courants = new Set(ligne.moisApplication);
    if (coche) {
      courants.add(mois);
    } else {
      courants.delete(mois);
    }
    onChange({ moisApplication: [...courants].sort((a, b) => a - b) });
  };

  const basculerTousLesMois = (coche: boolean) => {
    onChange({ moisApplication: coche ? [...MOIS_APPLICATION] : [] });
  };

  if (lectureSeule) {
    return (
      <div className="space-y-4" data-testid="formulaire-lecture-seule">
        <p>Nature : {libelleNature(ligne.natureRef, natures)}</p>
        <p>Montant : {afficherMontant(ligne.montant)}</p>
        <p>Mois d’application : {afficherMoisApplication(ligne.moisApplication)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RegistreAlertesSalarie alertes={alertes} />
      <div className="space-y-2">
        <Label htmlFor={`nature-${ligne.id}`}>Nature</Label>
        <Select
          id={`nature-${ligne.id}`}
          value={ligne.natureRef}
          onChange={(e) => onChange({ natureRef: e.target.value })}
        >
          {natures.map((nature) => (
            <option key={nature.code} value={nature.code}>
              {nature.libelle}
            </option>
          ))}
        </Select>
        <MessagesAlerteChamp alertes={alertes} champ="natureRef" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`montant-${ligne.id}`}>Montant</Label>
        <Input
          id={`montant-${ligne.id}`}
          value={ligne.montant}
          onChange={(e) => onChange({ montant: e.target.value })}
        />
        <MessagesAlerteChamp alertes={alertes} champ="montant" />
      </div>
      <div className="space-y-2">
        <Label>Mois d’application</Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`tous-les-mois-${ligne.id}`}
            checked={tousLesMoisCoches}
            onChange={(e) => basculerTousLesMois(e.target.checked)}
          />
          <Label htmlFor={`tous-les-mois-${ligne.id}`}>Tous les mois</Label>
        </div>
        <div className="flex flex-wrap gap-3">
          {MOIS_APPLICATION.map((mois) => (
            <div key={mois} className="flex items-center gap-2">
              <Checkbox
                id={`mois-${ligne.id}-${mois}`}
                checked={ligne.moisApplication.includes(mois)}
                onChange={(e) => basculerMois(mois, e.target.checked)}
              />
              <Label htmlFor={`mois-${ligne.id}-${mois}`}>{MOIS_ABREGE_FORMULAIRE[mois - 1]}</Label>
            </div>
          ))}
        </div>
        <MessagesAlerteChamp alertes={alertes} champ="moisApplication" />
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

const MOIS_ABREGE_FORMULAIRE = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;
