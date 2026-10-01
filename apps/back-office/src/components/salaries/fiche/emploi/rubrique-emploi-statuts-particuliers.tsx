'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AlerteApi,
  EmploiFiche,
  Permission,
  StatutParticulier,
  StatutParticulierFiche,
} from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  MessagesAlerteChamp,
  RegistreAlertesSalarie,
} from '@/components/salaries/formulaire/messages-alerte-salarie';
import { AppelApiEchoue } from '@/lib/api/client';
import {
  creerStatutParticulier,
  impactSuppressionStatutParticulier,
  modifierStatutParticulier,
  supprimerStatutParticulier,
} from '@/lib/api/emplois';
import { libelleReferentielParCode } from '@/lib/affichage/libelles-emploi';
import { envoyerLignesTableau } from '@/lib/fiche/envoi-lignes-tableau';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
import {
  afficherDateStatutParticulier,
  creerLigneVide,
  depuisServeur,
  estModifieeContreReference,
  extraireLigneReponse,
  filtrerLignesStatutsParticuliersVisibles,
  libelleEtatLigne,
  lignesEgales,
  trierAffichage,
  versCorpsCreation,
  versCorpsModification,
  versServeur,
  type LigneStatutParticulierLocale,
} from '@/lib/fiche/statuts-particuliers-lignes';
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
  readonly lignesServeur: readonly StatutParticulierFiche[];
  readonly statutsReferentiel: readonly StatutParticulier[];
  readonly operations: readonly Permission[];
  readonly onEmploiChange: (maj: MiseAJourEmploiFiche) => void;
}

function libelleStatut(code: string, statuts: readonly StatutParticulier[]): string {
  return libelleReferentielParCode(statuts, code);
}

function lignesLocalesInitiales(lignesServeur: readonly StatutParticulierFiche[]) {
  return filtrerLignesStatutsParticuliersVisibles(lignesServeur).map(depuisServeur);
}

export function RubriqueEmploiStatutsParticuliers({
  companyId,
  emploi,
  lignesServeur,
  statutsReferentiel,
  operations,
  onEmploiChange,
}: Props) {
  const emploiId = emploi.id;
  const libellePoste = emploi.contrat.libellePoste;
  const peutModifier = possedePermission(operations, 'emploi.modifier');

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

  const [reference, setReference] = useState(() => lignesLocalesInitiales(lignesServeur));
  const [courant, setCourant] = useState(() => lignesLocalesInitiales(lignesServeur));
  const [alertes, setAlertes] = useState<readonly AlerteApi[]>([]);
  const [alertesParLigne, setAlertesParLigne] = useState<Record<string, readonly AlerteApi[]>>({});
  const [erreurRubrique, setErreurRubrique] = useState<string | undefined>();

  const jetonSuppressionRef = useRef('');
  const snapshotsRef = useRef<Map<string, LigneStatutParticulierLocale>>(new Map());
  const courantRef = useRef(courant);
  const referenceRef = useRef(reference);
  courantRef.current = courant;
  referenceRef.current = reference;

  const statutsParticuliersEnregistres = useCallback((): StatutParticulierFiche[] => {
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
        const propagees = emploiCourant.statutsParticuliers.filter(
          (ligne) => ligne.origine === 'PROPAGE_SOCIETE'
        );
        return {
          ...emploiCourant,
          version: nouvelleVersion,
          statutsParticuliers: [...propagees, ...statutsParticuliersEnregistres()],
        };
      });
    },
    [emploiId, onEmploiChange, statutsParticuliersEnregistres]
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
    (id: string, patch: Partial<LigneStatutParticulierLocale>) => {
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
    (ligneServeur: StatutParticulierFiche, nouvelleVersion: number) => {
      const locale = depuisServeur(ligneServeur);
      const prochainCourant = (prev: LigneStatutParticulierLocale[]) => {
        const ids = prev.map((l) => l.id);
        if (ids.includes(ligneServeur.id)) {
          return prev.map((l) => (l.id === ligneServeur.id ? locale : l));
        }
        const remplace = prev.findIndex(
          (l) =>
            l.etat === 'NON_ENREGISTREE' &&
            l.statutCode === locale.statutCode &&
            l.dateDebut === locale.dateDebut
        );
        if (remplace >= 0) {
          const copie = [...prev];
          copie[remplace] = locale;
          return copie;
        }
        return [...prev.filter((l) => l.id !== ligneServeur.id), locale];
      };
      const prochainReference = (prev: LigneStatutParticulierLocale[]) => {
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
          const reponse = await creerStatutParticulier(
            companyId,
            emploiId,
            version,
            corps as ReturnType<typeof versCorpsCreation>
          );
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.statutsParticuliers ?? [],
          };
        },
        modifier: async (id, version, corps) => {
          const reponse = await modifierStatutParticulier(companyId, emploiId, id, version, corps);
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.statutsParticuliers ?? [],
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
      id: idRubriqueEmploi(emploiId, 'statuts-particuliers'),
      libelle: libelleRubriqueEmploi('statuts-particuliers', libellePoste),
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
        id: 'statut',
        libelle: 'Statut',
        render: (l: LigneStatutParticulierLocale) =>
          libelleStatut(l.statutCode, statutsReferentiel),
      },
      {
        id: 'dateDebut',
        libelle: 'Date de début',
        render: (l: LigneStatutParticulierLocale) => afficherDateStatutParticulier(l.dateDebut),
      },
      {
        id: 'dateFin',
        libelle: 'Date de fin',
        render: (l: LigneStatutParticulierLocale) =>
          l.dateFin === null ? '' : afficherDateStatutParticulier(l.dateFin),
      },
    ],
    [statutsReferentiel]
  );

  const suppression = useMemo(
    () => ({
      preparer: async (ligne: LigneStatutParticulierLocale) => {
        const reponse = await impactSuppressionStatutParticulier(companyId, emploiId, ligne.id);
        jetonSuppressionRef.current = reponse.donnees.jetonConfirmation;
        return textesSuppressionHistorisee({
          titre: 'Supprimer ce statut particulier ?',
          messageServeur: reponse.donnees.message,
          rubriqueModifiee: estModifieeContreReference(courantRef.current, referenceRef.current),
        });
      },
      confirmer: async (ligne: LigneStatutParticulierLocale) => {
        const versionEmploi = lireVersion({ kind: 'emploi', emploiId });
        try {
          const reponse = await supprimerStatutParticulier(
            companyId,
            emploiId,
            ligne.id,
            versionEmploi,
            jetonSuppressionRef.current
          );
          const idsConnus = new Set(courantRef.current.map((l) => l.id));
          const ligneServeur = extraireLigneReponse(
            reponse.donnees.statutsParticuliers ?? [],
            ligne.id,
            idsConnus
          );
          if (ligneServeur !== undefined) {
            appliquerLigneServeur(ligneServeur, reponse.donnees.version);
            const locale = depuisServeur(ligneServeur);
            const prochain = (prev: LigneStatutParticulierLocale[]) => {
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

  const statutParDefaut = statutsReferentiel[0]?.code ?? '';

  return (
    <Rubrique
      id={idRubriqueEmploi(emploiId, 'statuts-particuliers')}
      titre={`Statuts particuliers — ${libellePoste}`}
    >
      <TeteRubriqueFiche
        erreur={erreurRubrique}
        alertes={alertes}
        testidErreur={`erreur-rubrique-${emploiId}-statuts-particuliers`}
        testidAlertes={`alertes-tete-${emploiId}-statuts-particuliers`}
      />

      <EnveloppeTableauRepetable
        colonnes={colonnes}
        lignes={lignesAffichees}
        getLigneId={(l) => l.id}
        estInactive={estLigneTableauCloturee}
        estNonEnregistree={(l) => l.etat === 'NON_ENREGISTREE'}
        libelleEtatLigne={libelleEtatLigne}
        idColonneMarque="statut"
        ligneEnErreur={(ligne) => (alertesParLigne[ligne.id]?.length ?? 0) > 0}
        formulaireOuvertId={formulaireOuvertId}
        onOuvrirFormulaire={ouvrirFormulaireLigne}
        onValiderLigne={validerLigne}
        onAnnulerLigne={annulerLigne}
        verrouille={enregistrementEnCours}
        suppression={suppression}
        onAttenteSuppressionChange={gererAttenteSuppression}
        peutModifier={peutModifier}
        testId={`statuts-particuliers-${emploiId}`}
        onAjouter={() => {
          if (enregistrementEnCours || !peutModifier) return;
          const nouvelle = creerLigneVide(statutParDefaut);
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
          <FormulaireStatutParticulier
            ligne={ligne}
            statuts={statutsReferentiel}
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

function FormulaireStatutParticulier({
  ligne,
  statuts,
  alertes,
  lectureSeule,
  onChange,
  onValider,
  onAnnuler,
}: {
  readonly ligne: LigneStatutParticulierLocale;
  readonly statuts: readonly StatutParticulier[];
  readonly alertes: readonly AlerteApi[];
  readonly lectureSeule: boolean;
  readonly onChange: (patch: Partial<LigneStatutParticulierLocale>) => void;
  readonly onValider: () => void;
  readonly onAnnuler: () => void;
}) {
  if (lectureSeule) {
    return (
      <div className="space-y-4" data-testid="formulaire-lecture-seule">
        <p>Statut : {libelleStatut(ligne.statutCode, statuts)}</p>
        <p>Date de début : {afficherDateStatutParticulier(ligne.dateDebut)}</p>
        <p>
          Date de fin : {ligne.dateFin === null ? '' : afficherDateStatutParticulier(ligne.dateFin)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RegistreAlertesSalarie alertes={alertes} />
      <div className="space-y-2">
        <Label htmlFor={`statut-${ligne.id}`}>Statut</Label>
        <Select
          id={`statut-${ligne.id}`}
          value={ligne.statutCode}
          onChange={(e) => onChange({ statutCode: e.target.value })}
        >
          {statuts.map((statut) => (
            <option key={statut.code} value={statut.code}>
              {statut.libelle}
            </option>
          ))}
        </Select>
        <MessagesAlerteChamp alertes={alertes} champ="statutCode" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`date-debut-${ligne.id}`}>Date de début</Label>
        <Input
          id={`date-debut-${ligne.id}`}
          type="date"
          value={ligne.dateDebut.slice(0, 10)}
          onChange={(e) => onChange({ dateDebut: e.target.value })}
        />
        <MessagesAlerteChamp alertes={alertes} champ="dateDebut" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`date-fin-${ligne.id}`}>Date de fin</Label>
        <Input
          id={`date-fin-${ligne.id}`}
          type="date"
          value={ligne.dateFin === null ? '' : ligne.dateFin.slice(0, 10)}
          onChange={(e) => onChange({ dateFin: e.target.value === '' ? null : e.target.value })}
        />
        <MessagesAlerteChamp alertes={alertes} champ="dateFin" />
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
