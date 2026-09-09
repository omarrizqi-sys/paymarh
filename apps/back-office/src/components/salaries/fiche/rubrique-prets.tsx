'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AlerteApi, PretSalarie } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  MessagesAlerteChamp,
  RegistreAlertesSalarie,
} from '@/components/salaries/formulaire/messages-alerte-salarie';
import { AppelApiEchoue } from '@/lib/api/client';
import { creerPret, impactSuppressionPret, modifierPret, supprimerPret } from '@/lib/api/salaries';
import { envoyerLignesTableau } from '@/lib/fiche/envoi-lignes-tableau';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
import {
  afficherSoldeRestant,
  creerLigneVide,
  depuisServeur,
  estLigneEnregistree,
  estModifieeContreReference,
  extraireLigneReponse,
  libelleEtatLigne,
  lignesEgales,
  trierAffichage,
  versCorpsCreation,
  versCorpsModification,
  type LignePretLocale,
} from '@/lib/fiche/prets-lignes';
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
  readonly lignesServeur: readonly PretSalarie[];
  readonly onVersionChange: (version: number) => void;
}

export function RubriquePrets({ companyId, salarieId, lignesServeur, onVersionChange }: Props) {
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

  const jetonSuppressionRef = useRef('');
  const snapshotsRef = useRef<Map<string, LignePretLocale>>(new Map());
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
    snapshotsRef.current.clear();
    fermerFormulaire();
    notifierSommaire();
  }, [fermerFormulaire, notifierSommaire]);

  const lignesAffichees = useMemo(() => trierAffichage(courant), [courant]);

  const modifierLigne = useCallback(
    (id: string, patch: Partial<LignePretLocale>) => {
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
    (ligneServeur: PretSalarie, nouvelleVersion: number) => {
      const locale = depuisServeur(ligneServeur);
      const prochainCourant = (prev: LignePretLocale[]) => {
        const ids = prev.map((l) => l.id);
        if (ids.includes(ligneServeur.id)) {
          return prev.map((l) => (l.id === ligneServeur.id ? locale : l));
        }
        const remplace = prev.findIndex(
          (l) =>
            l.etat === 'NON_ENREGISTREE' &&
            l.libelleObjet === locale.libelleObjet &&
            l.moisDebut === locale.moisDebut
        );
        if (remplace >= 0) {
          const copie = [...prev];
          copie[remplace] = locale;
          return copie;
        }
        return [...prev.filter((l) => l.id !== ligneServeur.id), locale];
      };
      const prochainReference = (prev: LignePretLocale[]) => {
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
          const reponse = await creerPret(
            companyId,
            salarieId,
            version,
            corps as ReturnType<typeof versCorpsCreation>
          );
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.prets,
          };
        },
        modifier: async (id, version, corps) => {
          const reponse = await modifierPret(companyId, salarieId, id, version, corps);
          return {
            version: reponse.donnees.version,
            alertes: reponse.alertes,
            lignesTableau: reponse.donnees.prets,
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
      onVersionChange(resultat.version);
      return resultat;
    },
    [companyId, onVersionChange, ouvrirFormulaire, salarieId]
  );

  useEffect(() => {
    const desenregistrer = enregistrerRubrique({
      id: 'prets',
      libelle: 'Prêts',
      estModifiee: () => estModifieeContreReference(courantRef.current, referenceRef.current),
      envoyer: envoyerRubrique,
      reinitialiser: reinitialiserRubrique,
    });
    return desenregistrer;
  }, [enregistrerRubrique, envoyerRubrique, reinitialiserRubrique]);

  const colonnes = useMemo(
    () => [
      {
        id: 'libelleObjet',
        libelle: 'Libellé / objet',
        render: (l: LignePretLocale) => l.libelleObjet,
      },
      { id: 'moisDebut', libelle: 'Mois de début', render: (l: LignePretLocale) => l.moisDebut },
      { id: 'mensualite', libelle: 'Mensualité', render: (l: LignePretLocale) => l.mensualite },
      {
        id: 'nombreEcheances',
        libelle: 'Nombre d\u2019échéances',
        render: (l: LignePretLocale) => String(l.nombreEcheances),
      },
      {
        id: 'soldeRestant',
        libelle: 'Solde restant',
        render: (l: LignePretLocale) => {
          const ref = referenceRef.current.find((r) => r.id === l.id);
          return afficherSoldeRestant(l, ref);
        },
      },
    ],
    []
  );

  const suppression = useMemo(
    () => ({
      preparer: async (ligne: LignePretLocale) => {
        const reponse = await impactSuppressionPret(companyId, salarieId, ligne.id);
        jetonSuppressionRef.current = reponse.donnees.jetonConfirmation;
        return textesSuppressionHistorisee({
          titre: 'Supprimer ce prêt ?',
          messageServeur: reponse.donnees.message,
          rubriqueModifiee: estModifieeContreReference(courantRef.current, referenceRef.current),
        });
      },
      confirmer: async (ligne: LignePretLocale) => {
        try {
          const reponse = await supprimerPret(
            companyId,
            salarieId,
            ligne.id,
            version,
            jetonSuppressionRef.current
          );
          const idsConnus = new Set(courantRef.current.map((l) => l.id));
          const ligneServeur = extraireLigneReponse(reponse.donnees.prets, ligne.id, idsConnus);
          if (ligneServeur !== undefined) {
            appliquerLigneServeur(ligneServeur, reponse.donnees.version);
            const locale = depuisServeur(ligneServeur);
            const prochain = (prev: LignePretLocale[]) => {
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
    <Rubrique id="prets" titre="Prêts">
      <TeteRubriqueFiche alertes={alertes} testidAlertes="alertes-tete-prets" />

      <EnveloppeTableauRepetable
        colonnes={colonnes}
        lignes={lignesAffichees}
        getLigneId={(l) => l.id}
        estInactive={estLigneTableauCloturee}
        estNonEnregistree={(l) => l.etat === 'NON_ENREGISTREE'}
        libelleEtatLigne={libelleEtatLigne}
        idColonneMarque="libelleObjet"
        ligneEnErreur={(ligne) => (alertesParLigne[ligne.id]?.length ?? 0) > 0}
        formulaireOuvertId={formulaireOuvertId}
        onOuvrirFormulaire={ouvrirFormulaireLigne}
        onValiderLigne={validerLigne}
        onAnnulerLigne={annulerLigne}
        verrouille={enregistrementEnCours}
        suppression={suppression}
        onAttenteSuppressionChange={gererAttenteSuppression}
        peutModifier
        testId="enveloppe-prets"
        onAjouter={() => {
          if (enregistrementEnCours) return;
          const nouvelle = creerLigneVide();
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
          <FormulairePret
            ligne={ligne}
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

function FormulairePret({
  ligne,
  alertes,
  lectureSeule,
  onChange,
  onValider,
  onAnnuler,
}: {
  readonly ligne: LignePretLocale;
  readonly alertes: readonly AlerteApi[];
  readonly lectureSeule: boolean;
  readonly onChange: (patch: Partial<LignePretLocale>) => void;
  readonly onValider: () => void;
  readonly onAnnuler: () => void;
}) {
  if (lectureSeule) {
    return (
      <div className="space-y-2" data-testid="formulaire-lecture-seule">
        <p>Libellé / objet : {ligne.libelleObjet}</p>
        <p>Libellé bulletin : {ligne.libelleBulletin}</p>
        <p>Montant total : {ligne.montantTotal}</p>
        <p>Mois de début : {ligne.moisDebut}</p>
        <p>Mensualité : {ligne.mensualite}</p>
        <p>Nombre d&apos;échéances : {ligne.nombreEcheances}</p>
        {estLigneEnregistree(ligne) ? <p>Solde restant : {ligne.soldeRestant}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RegistreAlertesSalarie alertes={alertes} />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`libelleObjet-${ligne.id}`}>Libellé / objet</Label>
          <Input
            id={`libelleObjet-${ligne.id}`}
            value={ligne.libelleObjet}
            onChange={(e) => onChange({ libelleObjet: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="libelleObjet" />
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
          <Label htmlFor={`montantTotal-${ligne.id}`}>Montant total</Label>
          <Input
            id={`montantTotal-${ligne.id}`}
            value={ligne.montantTotal}
            onChange={(e) => onChange({ montantTotal: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="montantTotal" />
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
        <div className="space-y-2">
          <Label htmlFor={`mensualite-${ligne.id}`}>Mensualité</Label>
          <Input
            id={`mensualite-${ligne.id}`}
            value={ligne.mensualite}
            onChange={(e) => onChange({ mensualite: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="mensualite" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`nombreEcheances-${ligne.id}`}>Nombre d&apos;échéances</Label>
          <Input
            id={`nombreEcheances-${ligne.id}`}
            type="number"
            min={1}
            step={1}
            value={ligne.nombreEcheances}
            onChange={(e) => onChange({ nombreEcheances: Number(e.target.value) })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="nombreEcheances" />
        </div>
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
