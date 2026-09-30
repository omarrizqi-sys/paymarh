'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AlerteApi,
  EmploiFiche,
  Permission,
  PrimeContractuelleFiche,
  PrimeReferentiel,
} from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  MessagesAlerteChamp,
  RegistreAlertesSalarie,
} from '@/components/salaries/formulaire/messages-alerte-salarie';
import {
  creerPrimeContractuelle,
  modifierPrimeContractuelle,
  supprimerPrimeContractuelle,
} from '@/lib/api/emplois';
import { libelleReferentielParCode } from '@/lib/affichage/libelles-emploi';
import { afficherMoisApplication } from '@/lib/fiche/mois-application-commun';
import { envoyerLignesTableau } from '@/lib/fiche/envoi-lignes-tableau';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
import {
  creerLigneVide,
  depuisServeur,
  estModifieeContreReference,
  extraireLigneReponse,
  lignesEgales,
  trierAffichage,
  versCorpsCreation,
  versCorpsModification,
  versServeur,
  type LignePrimeContractuelleLocale,
} from '@/lib/fiche/primes-contractuelles-lignes';
import { idRubriqueEmploi, libelleRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import type { MiseAJourEmploiFiche } from '@/lib/fiche/valeurs-emploi';
import { possedePermission } from '@/lib/permissions';
import type { TextesConfirmationSuppression } from '@/components/navigation/textes-suppression-tableau-historise';
import { SaisieMoisApplication } from '@/components/salaries/fiche/saisie-mois-application';
import { useFormulaireTableau } from '../contexte-formulaire-tableau';
import { EnveloppeTableauRepetable } from '../enveloppe-tableau-repetable';
import { useRegistreFiche } from '../registre-fiche-provider';
import { TeteRubriqueFiche } from '../tete-rubrique-fiche';

const MESSAGE_SUPPRESSION_PRIME = (libellePrime: string): TextesConfirmationSuppression => ({
  variante: 'differee',
  titre: `Supprimer la prime « ${libellePrime} » ? La suppression est immédiate et définitive.`,
  libelleConfirmer: 'Supprimer',
  libelleAnnuler: 'Annuler',
});

interface Props {
  readonly companyId: string;
  readonly emploi: EmploiFiche;
  readonly lignesServeur: readonly PrimeContractuelleFiche[];
  readonly primes: readonly PrimeReferentiel[];
  readonly operations: readonly Permission[];
  readonly onEmploiChange: (maj: MiseAJourEmploiFiche) => void;
}

function libellePrime(code: string, primes: readonly PrimeReferentiel[]): string {
  return libelleReferentielParCode(primes, code);
}

function estInactive(_ligne: LignePrimeContractuelleLocale): boolean {
  return false;
}

function libelleEtatLigne(_ligne: LignePrimeContractuelleLocale): string | null {
  return null;
}

export function RubriqueEmploiPrimesContractuelles({
  companyId,
  emploi,
  lignesServeur,
  primes,
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

  const snapshotsRef = useRef<Map<string, LignePrimeContractuelleLocale>>(new Map());
  const courantRef = useRef(courant);
  const referenceRef = useRef(reference);
  courantRef.current = courant;
  referenceRef.current = reference;

  const primesContractuellesEnregistrees = useCallback((): PrimeContractuelleFiche[] => {
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
          primesContractuelles: primesContractuellesEnregistrees(),
        };
      });
    },
    [emploiId, onEmploiChange, primesContractuellesEnregistrees]
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
    (id: string, patch: Partial<LignePrimeContractuelleLocale>) => {
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
          const reponse = await creerPrimeContractuelle(
            companyId,
            emploiId,
            version,
            corps as ReturnType<typeof versCorpsCreation>
          );
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.primesContractuelles ?? [],
          };
        },
        modifier: async (id, version, corps) => {
          const reponse = await modifierPrimeContractuelle(companyId, emploiId, id, version, corps);
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.primesContractuelles ?? [],
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
      id: idRubriqueEmploi(emploiId, 'primes-contractuelles'),
      libelle: libelleRubriqueEmploi('primes-contractuelles', libellePoste),
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
        id: 'prime',
        libelle: 'Prime',
        render: (l: LignePrimeContractuelleLocale) => libellePrime(l.primeRef, primes),
      },
      {
        id: 'moisApplication',
        libelle: 'Mois d’application',
        render: (l: LignePrimeContractuelleLocale) => afficherMoisApplication(l.moisApplication),
      },
    ],
    [primes]
  );

  const suppression = useMemo(
    () => ({
      preparer: async (ligne: LignePrimeContractuelleLocale) => {
        return MESSAGE_SUPPRESSION_PRIME(libellePrime(ligne.primeRef, primes));
      },
      confirmer: async (ligne: LignePrimeContractuelleLocale) => {
        const versionEmploi = lireVersion({ kind: 'emploi', emploiId });
        const reponse = await supprimerPrimeContractuelle(
          companyId,
          emploiId,
          ligne.id,
          versionEmploi
        );
        const suivantCourant = courantRef.current.filter((l) => l.id !== ligne.id);
        const suivantReference = referenceRef.current.filter((l) => l.id !== ligne.id);
        courantRef.current = suivantCourant;
        referenceRef.current = suivantReference;
        setCourant(suivantCourant);
        setReference(suivantReference);
        propagerEmploiApresEcriture(reponse.donnees.version);
        notifierSommaire();
        return { type: 'termine' as const };
      },
    }),
    [companyId, emploiId, lireVersion, notifierSommaire, primes, propagerEmploiApresEcriture]
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

  const primeParDefaut = primes[0]?.code ?? '';

  return (
    <Rubrique
      id={idRubriqueEmploi(emploiId, 'primes-contractuelles')}
      titre={`Primes contractuelles — ${libellePoste}`}
    >
      <TeteRubriqueFiche
        erreur={erreurRubrique}
        alertes={alertes}
        testidErreur={`erreur-rubrique-${emploiId}-primes-contractuelles`}
        testidAlertes={`alertes-tete-${emploiId}-primes-contractuelles`}
      />

      <EnveloppeTableauRepetable
        colonnes={colonnes}
        lignes={lignesAffichees}
        getLigneId={(l) => l.id}
        estInactive={estInactive}
        estNonEnregistree={(l) => l.etat === 'NON_ENREGISTREE'}
        libelleEtatLigne={libelleEtatLigne}
        idColonneMarque="prime"
        ligneEnErreur={(ligne) => (alertesParLigne[ligne.id]?.length ?? 0) > 0}
        formulaireOuvertId={formulaireOuvertId}
        onOuvrirFormulaire={ouvrirFormulaireLigne}
        onValiderLigne={validerLigne}
        onAnnulerLigne={annulerLigne}
        verrouille={enregistrementEnCours}
        suppression={suppression}
        onAttenteSuppressionChange={gererAttenteSuppression}
        peutModifier={peutEcrire}
        testId={`primes-contractuelles-${emploiId}`}
        onAjouter={() => {
          if (enregistrementEnCours || !peutEcrire) return;
          const nouvelle = creerLigneVide(primeParDefaut);
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
          <FormulairePrimeContractuelle
            ligne={ligne}
            primes={primes}
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

function FormulairePrimeContractuelle({
  ligne,
  primes,
  alertes,
  lectureSeule,
  onChange,
  onValider,
  onAnnuler,
}: {
  readonly ligne: LignePrimeContractuelleLocale;
  readonly primes: readonly PrimeReferentiel[];
  readonly alertes: readonly AlerteApi[];
  readonly lectureSeule: boolean;
  readonly onChange: (patch: Partial<LignePrimeContractuelleLocale>) => void;
  readonly onValider: () => void;
  readonly onAnnuler: () => void;
}) {
  if (lectureSeule) {
    return (
      <div className="space-y-4" data-testid="formulaire-lecture-seule">
        <p>Prime : {libellePrime(ligne.primeRef, primes)}</p>
        <p>Mois d’application : {afficherMoisApplication(ligne.moisApplication)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RegistreAlertesSalarie alertes={alertes} />
      <div className="space-y-2">
        <Label htmlFor={`prime-${ligne.id}`}>Prime</Label>
        <Select
          id={`prime-${ligne.id}`}
          value={ligne.primeRef}
          onChange={(e) => onChange({ primeRef: e.target.value })}
        >
          {primes.map((prime) => (
            <option key={prime.code} value={prime.code}>
              {prime.libelle}
            </option>
          ))}
        </Select>
        <MessagesAlerteChamp alertes={alertes} champ="primeRef" />
      </div>
      <SaisieMoisApplication
        idPrefix={ligne.id}
        moisApplication={ligne.moisApplication}
        onChange={(moisApplication) => onChange({ moisApplication })}
      />
      <MessagesAlerteChamp alertes={alertes} champ="moisApplication" />
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
