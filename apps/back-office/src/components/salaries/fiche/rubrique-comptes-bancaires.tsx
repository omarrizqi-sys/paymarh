'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AlerteApi, Banque, CompteBancaireSalarie, Permission } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { MESSAGE_ERREUR_GENERIQUE } from '@/lib/messages-interface';
import {
  ChampBanque,
  ligneDepuisValeurChampBanque,
  valeurChampBanqueDepuisLigne,
} from '@/components/referentiels/champ-banque';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  MessagesAlerteChamp,
  RegistreAlertesSalarie,
} from '@/components/salaries/formulaire/messages-alerte-salarie';
import { AppelApiEchoue } from '@/lib/api/client';
import { remplacerComptesBancaires } from '@/lib/api/salaries';
import { estConflitVersion } from '@/lib/fiche/codes-conflit';
import {
  creerLigneCompteVide,
  depuisServeur,
  estModifieeContreReference,
  libelleBanque,
  libelleEtatLigneCompte,
  ordreAffichage,
  versCorpsEnvoi,
  type LigneCompteBancaireLocale,
} from '@/lib/fiche/comptes-bancaires-lignes';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
import { possedePermission } from '@/lib/permissions';
import { useFormulaireTableau } from './contexte-formulaire-tableau';
import { EnveloppeTableauRepetable } from './enveloppe-tableau-repetable';
import { useRegistreFiche } from './registre-fiche-provider';
import { TeteRubriqueFiche } from './tete-rubrique-fiche';
import { textesSuppressionDiffereeCompteBancaire } from './textes-suppression-tableau-historise';

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly comptesServeur: readonly CompteBancaireSalarie[];
  readonly banques: readonly Banque[];
  readonly operations: readonly Permission[];
  readonly onComptesChange: (comptes: readonly CompteBancaireSalarie[], version: number) => void;
}

function repartirAlertes(
  alertes: readonly AlerteApi[],
  idsEnvoi: readonly string[]
): {
  parLigne: Record<string, readonly AlerteApi[]>;
  rubrique: readonly AlerteApi[];
} {
  const parLigne: Record<string, AlerteApi[]> = {};
  const rubrique: AlerteApi[] = [];

  for (const alerte of alertes) {
    if (alerte.indexLigne !== undefined) {
      const id = idsEnvoi[alerte.indexLigne];
      if (id !== undefined) {
        parLigne[id] = [...(parLigne[id] ?? []), alerte];
      }
      continue;
    }
    if (!alerte.champ) {
      rubrique.push(alerte);
    }
  }

  return { parLigne, rubrique };
}

export function RubriqueComptesBancaires({
  companyId,
  salarieId,
  comptesServeur,
  banques,
  operations,
  onComptesChange,
}: Props) {
  const peutEcrire = possedePermission(operations, 'salarie.remuneration.ecrire');
  const { enregistrerRubrique, notifierSommaire, enregistrerAvantEnvoi, enregistrementEnCours } =
    useRegistreFiche();
  const { formulaireOuvertId, ouvrirFormulaire, fermerFormulaire } = useFormulaireTableau();

  const [reference, setReference] = useState(() => comptesServeur.map(depuisServeur));
  const [courant, setCourant] = useState(() => comptesServeur.map(depuisServeur));
  const [alertesRubrique, setAlertesRubrique] = useState<readonly AlerteApi[]>([]);
  const [alertesParLigne, setAlertesParLigne] = useState<Record<string, readonly AlerteApi[]>>({});
  const [erreurRubrique, setErreurRubrique] = useState<string | undefined>();

  const snapshotsRef = useRef<Map<string, LigneCompteBancaireLocale>>(new Map());
  const courantRef = useRef(courant);
  const referenceRef = useRef(reference);
  const comptesServeurRef = useRef(comptesServeur);
  courantRef.current = courant;
  referenceRef.current = reference;
  comptesServeurRef.current = comptesServeur;

  const reinitialiserRubrique = useCallback(() => {
    const suivant = comptesServeurRef.current.map(depuisServeur);
    setReference(suivant);
    setCourant(suivant);
    referenceRef.current = suivant;
    courantRef.current = suivant;
    setAlertesRubrique([]);
    setAlertesParLigne({});
    setErreurRubrique(undefined);
    snapshotsRef.current.clear();
    fermerFormulaire();
    notifierSommaire();
  }, [fermerFormulaire, notifierSommaire]);

  const lignesAffichees = useMemo(() => ordreAffichage(courant), [courant]);

  const effacerToutesAlertes = useCallback(() => {
    setAlertesRubrique([]);
    setAlertesParLigne({});
  }, []);

  const modifierLigne = useCallback(
    (id: string, patch: Partial<LigneCompteBancaireLocale>) => {
      setCourant((prev) => {
        const suivant = prev.map((l) => (l.id === id ? { ...l, ...patch } : l));
        courantRef.current = suivant;
        return suivant;
      });
      setAlertesParLigne((prev) => {
        const { [id]: _ignore, ...suivant } = prev;
        return suivant;
      });
      setErreurRubrique(undefined);
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

  const envoyerRubrique = useCallback(
    async (versionEnvoi: number): Promise<EnvoiRubriqueResultat> => {
      const ordreEnvoi = ordreAffichage(courantRef.current);
      const idsEnvoi = ordreEnvoi.map((l) => l.id);
      const corps = { comptes: versCorpsEnvoi(courantRef.current) };

      try {
        const reponse = await remplacerComptesBancaires(companyId, salarieId, versionEnvoi, corps);
        const comptes = reponse.donnees.comptesBancaires ?? [];
        const locales = comptes.map(depuisServeur);
        setCourant(locales);
        setReference(locales);
        courantRef.current = locales;
        referenceRef.current = locales;
        setErreurRubrique(undefined);

        const { parLigne, rubrique } = repartirAlertes(reponse.alertes, idsEnvoi);
        setAlertesParLigne(parLigne);
        setAlertesRubrique(rubrique);

        const premiereAvecAlerte = idsEnvoi.find((id) => (parLigne[id]?.length ?? 0) > 0);
        if (premiereAvecAlerte !== undefined) {
          ouvrirFormulaire(premiereAvecAlerte);
        } else {
          fermerFormulaire();
        }

        onComptesChange(comptes, reponse.donnees.version);
        notifierSommaire();
        return { version: reponse.donnees.version, alertes: reponse.alertes };
      } catch (erreur) {
        if (erreur instanceof AppelApiEchoue && estConflitVersion(erreur.erreur.code)) {
          throw erreur;
        }
        if (erreur instanceof AppelApiEchoue) {
          const { code, message, champ } = erreur.erreur;
          if (champ !== undefined && champ !== '') {
            const idCible = idsEnvoi[0];
            if (idCible !== undefined) {
              setAlertesParLigne((prev) => ({
                ...prev,
                [idCible]: [{ code, message, champ }],
              }));
              ouvrirFormulaire(idCible);
            }
          } else if (erreur.statut >= 500 || code === 'ERREUR') {
            setErreurRubrique(MESSAGE_ERREUR_GENERIQUE);
          } else {
            setErreurRubrique(message);
          }
          throw erreur;
        }
        throw erreur;
      }
    },
    [companyId, fermerFormulaire, notifierSommaire, onComptesChange, ouvrirFormulaire, salarieId]
  );

  useEffect(() => {
    if (!peutEcrire) return;
    const desenregistrer = enregistrerRubrique({
      id: 'comptes-bancaires',
      libelle: 'Comptes bancaires',
      estModifiee: () => estModifieeContreReference(courantRef.current, referenceRef.current),
      envoyer: envoyerRubrique,
      reinitialiser: reinitialiserRubrique,
    });
    return desenregistrer;
  }, [enregistrerRubrique, envoyerRubrique, peutEcrire, reinitialiserRubrique]);

  const colonnes = useMemo(
    () => [
      {
        id: 'banque',
        libelle: 'Banque',
        render: (l: LigneCompteBancaireLocale) => libelleBanque(l, banques),
      },
      { id: 'rib', libelle: 'RIB', render: (l: LigneCompteBancaireLocale) => l.rib },
      {
        id: 'titulaire',
        libelle: 'Titulaire du compte',
        render: (l: LigneCompteBancaireLocale) => l.titulaire,
      },
      {
        id: 'part',
        libelle: 'Part du virement',
        render: (l: LigneCompteBancaireLocale) => l.partVirement,
      },
    ],
    [banques]
  );

  const suppression = useMemo(
    () => ({
      preparer: async () => textesSuppressionDiffereeCompteBancaire(),
      confirmer: async (ligne: LigneCompteBancaireLocale) => {
        setCourant((prev) => {
          const suivant = prev.filter((item) => item.id !== ligne.id);
          courantRef.current = suivant;
          return suivant;
        });
        effacerToutesAlertes();
        notifierSommaire();
        return { type: 'termine' as const };
      },
    }),
    [effacerToutesAlertes, notifierSommaire]
  );

  return (
    <Rubrique id="comptes-bancaires" titre="Comptes bancaires">
      <TeteRubriqueFiche
        erreur={erreurRubrique}
        alertes={alertesRubrique}
        testidErreur="erreur-rubrique-comptes-bancaires"
        testidAlertes="alertes-tete-comptes-bancaires"
      />

      <EnveloppeTableauRepetable
        colonnes={colonnes}
        lignes={lignesAffichees}
        getLigneId={(l) => l.id}
        estInactive={() => false}
        estNonEnregistree={(l) => l.nonEnregistree}
        libelleEtatLigne={libelleEtatLigneCompte}
        idColonneMarque="rib"
        ligneEnErreur={(ligne) => (alertesParLigne[ligne.id]?.length ?? 0) > 0}
        formulaireOuvertId={formulaireOuvertId}
        onOuvrirFormulaire={ouvrirFormulaireLigne}
        onValiderLigne={validerLigne}
        onAnnulerLigne={annulerLigne}
        peutModifier={peutEcrire}
        verrouille={enregistrementEnCours}
        suppression={peutEcrire ? suppression : undefined}
        onAjouter={() => {
          if (enregistrementEnCours) return;
          const nouvelle = creerLigneCompteVide();
          setCourant((prev) => {
            const suivant = [...prev, nouvelle];
            courantRef.current = suivant;
            return suivant;
          });
          effacerToutesAlertes();
          ouvrirFormulaireLigne(nouvelle.id);
          notifierSommaire();
        }}
        onSupprimer={(ligne) => {
          if (ligne.nonEnregistree) {
            setCourant((prev) => {
              const suivant = prev.filter((item) => item.id !== ligne.id);
              courantRef.current = suivant;
              return suivant;
            });
            effacerToutesAlertes();
            notifierSommaire();
          }
        }}
        renderFormulaire={(ligne, actions) => (
          <FormulaireCompteBancaire
            ligne={ligne}
            banques={banques}
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

function FormulaireCompteBancaire({
  ligne,
  banques,
  alertes,
  lectureSeule,
  onChange,
  onValider,
  onAnnuler,
}: {
  readonly ligne: LigneCompteBancaireLocale;
  readonly banques: readonly Banque[];
  readonly alertes: readonly AlerteApi[];
  readonly lectureSeule: boolean;
  readonly onChange: (patch: Partial<LigneCompteBancaireLocale>) => void;
  readonly onValider: () => void;
  readonly onAnnuler: () => void;
}) {
  const valeurBanque = valeurChampBanqueDepuisLigne(
    ligne.banqueId,
    ligne.banqueLibreSaisie,
    banques
  );

  return (
    <div className="space-y-4">
      <RegistreAlertesSalarie alertes={alertes} />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`banque-${ligne.id}`}>Banque</Label>
          <ChampBanque
            id={`banque-${ligne.id}`}
            banques={banques}
            valeur={valeurBanque}
            disabled={lectureSeule}
            onChange={(valeur) => {
              const { banqueId, banqueLibreSaisie } = ligneDepuisValeurChampBanque(valeur, banques);
              onChange({ banqueId, banqueLibreSaisie });
            }}
          />
          <MessagesAlerteChamp alertes={alertes} champ="banqueId" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`rib-${ligne.id}`}>RIB</Label>
          <Input
            id={`rib-${ligne.id}`}
            value={ligne.rib}
            readOnly={lectureSeule}
            onChange={(event) => onChange({ rib: event.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="rib" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`iban-${ligne.id}`}>IBAN</Label>
          <Input
            id={`iban-${ligne.id}`}
            value={ligne.iban}
            readOnly={lectureSeule}
            onChange={(event) => onChange({ iban: event.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="iban" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`bic-${ligne.id}`}>BIC</Label>
          <Input
            id={`bic-${ligne.id}`}
            value={ligne.bic}
            readOnly={lectureSeule}
            onChange={(event) => onChange({ bic: event.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="bic" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`titulaire-${ligne.id}`}>Titulaire du compte</Label>
          <Input
            id={`titulaire-${ligne.id}`}
            value={ligne.titulaire}
            readOnly={lectureSeule}
            onChange={(event) => onChange({ titulaire: event.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="titulaire" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`part-${ligne.id}`}>Part du virement</Label>
          <Input
            id={`part-${ligne.id}`}
            value={ligne.partVirement}
            readOnly={lectureSeule}
            onChange={(event) => onChange({ partVirement: event.target.value })}
          />
          <p className="text-muted-foreground text-sm">
            Avec un seul compte, la totalité du virement y est versée. Renseignez ce champ
            uniquement si vous répartissez le salaire sur plusieurs comptes.
          </p>
          <MessagesAlerteChamp alertes={alertes} champ="partVirement" />
        </div>
        {!lectureSeule ? (
          <div className="flex gap-2">
            <Button type="button" onClick={onValider}>
              Valider la ligne
            </Button>
            <Button type="button" variant="outline" onClick={onAnnuler}>
              Annuler la ligne
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
