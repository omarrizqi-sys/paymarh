'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AlerteApi, LienParente, PersonneACharge } from '@paymarh/shared-types';
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
  creerPersonneACharge,
  impactSuppressionPersonneACharge,
  modifierPersonneACharge,
  supprimerPersonneACharge,
} from '@/lib/api/salaries';
import { estConflitVersion } from '@/lib/fiche/codes-conflit';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
import {
  creerLigneVide,
  depuisServeur,
  estModifieeContreReference,
  extraireLigneReponse,
  libelleEtatLigne,
  trierAffichage,
  versCorpsCreation,
  versCorpsModification,
  type LignePersonneAChargeLocale,
} from '@/lib/fiche/personnes-a-charge-lignes';
import { useFormulaireTableau } from './contexte-formulaire-tableau';
import { DialogueSuppressionLigneTableau } from './dialogue-suppression-ligne-tableau';
import { EnveloppeTableauRepetable } from './enveloppe-tableau-repetable';
import { useRegistreFiche } from './registre-fiche-provider';
import { TeteRubriqueFiche } from './tete-rubrique-fiche';

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly lignesServeur: readonly PersonneACharge[];
  readonly liensParente: readonly LienParente[];
  readonly onVersionChange: (version: number) => void;
}

function libelleLien(code: string, liens: readonly LienParente[]): string {
  return liens.find((l) => l.code === code)?.libelle ?? code;
}

export function RubriquePersonnesACharge({
  companyId,
  salarieId,
  lignesServeur,
  liensParente,
  onVersionChange,
}: Props) {
  const {
    enregistrerRubrique,
    notifierSommaire,
    signalerVersionApresEcritureHorsSequence,
    enregistrerAvantEnvoi,
    version,
  } = useRegistreFiche();
  const { formulaireOuvertId, ouvrirFormulaire, fermerFormulaire } = useFormulaireTableau();

  const [reference, setReference] = useState(() => lignesServeur.map(depuisServeur));
  const [courant, setCourant] = useState(() => lignesServeur.map(depuisServeur));
  const [alertes, setAlertes] = useState<readonly AlerteApi[]>([]);
  const [alertesParLigne, setAlertesParLigne] = useState<Record<string, readonly AlerteApi[]>>({});
  const [erreurRubrique, setErreurRubrique] = useState<string | undefined>();
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [dialogueSuppression, setDialogueSuppression] = useState<LignePersonneAChargeLocale | null>(
    null
  );

  const snapshotsRef = useRef<Map<string, LignePersonneAChargeLocale>>(new Map());
  const courantRef = useRef(courant);
  const referenceRef = useRef(reference);
  const lignesServeurRef = useRef(lignesServeur);
  courantRef.current = courant;
  referenceRef.current = reference;
  lignesServeurRef.current = lignesServeur;

  const reinitialiserRubrique = useCallback(() => {
    const suivant = lignesServeurRef.current.map(depuisServeur);
    setReference(suivant);
    setCourant(suivant);
    referenceRef.current = suivant;
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
    (id: string, patch: Partial<LignePersonneAChargeLocale>) => {
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
      const ligne = courantRef.current.find((l) => l.id === id);
      if (ligne !== undefined && !snapshotsRef.current.has(id)) {
        snapshotsRef.current.set(id, { ...ligne });
      }
      ouvrirFormulaire(id);
    },
    [fermerFormulaire, ouvrirFormulaire]
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
    (ligneServeur: PersonneACharge, nouvelleVersion: number) => {
      const locale = depuisServeur(ligneServeur);
      setCourant((prev) => {
        const ids = prev.map((l) => l.id);
        if (ids.includes(ligneServeur.id)) {
          return prev.map((l) => (l.id === ligneServeur.id ? locale : l));
        }
        const remplace = prev.findIndex(
          (l) => l.etat === 'NON_ENREGISTREE' && l.prenom === locale.prenom && l.nom === locale.nom
        );
        if (remplace >= 0) {
          const copie = [...prev];
          copie[remplace] = locale;
          return copie;
        }
        return [...prev.filter((l) => l.id !== ligneServeur.id), locale];
      });
      setReference((prev) => {
        const existe = prev.some((l) => l.id === locale.id);
        if (existe) {
          return prev.map((l) => (l.id === locale.id ? locale : l));
        }
        return [...prev, locale];
      });
      signalerVersionApresEcritureHorsSequence(nouvelleVersion);
      onVersionChange(nouvelleVersion);
    },
    [onVersionChange, signalerVersionApresEcritureHorsSequence]
  );

  const envoyerRubrique = useCallback(
    async (versionEnvoi: number): Promise<EnvoiRubriqueResultat> => {
      let versionCourante = versionEnvoi;
      const alertesRecues: AlerteApi[] = [];
      const idsConnus = new Set(referenceRef.current.map((l) => l.id));
      let formulaireErreurOuvert = false;

      const ordre = trierAffichage(courantRef.current);
      const modifications = ordre.filter(
        (l) =>
          l.etat !== 'NON_ENREGISTREE' &&
          estModifieeContreReference(
            [l],
            referenceRef.current.filter((r) => r.id === l.id)
          )
      );
      const ajouts = ordre.filter((l) => l.etat === 'NON_ENREGISTREE');

      for (const ligne of modifications) {
        const ref = referenceRef.current.find((r) => r.id === ligne.id);
        if (ref === undefined) continue;
        const corps = versCorpsModification(ligne, ref);
        if (Object.keys(corps).length === 0) continue;

        try {
          const reponse = await modifierPersonneACharge(
            companyId,
            salarieId,
            ligne.id,
            versionCourante,
            corps
          );
          versionCourante = reponse.donnees.version;
          alertesRecues.push(...reponse.alertes);
          const ligneServeur = extraireLigneReponse(
            reponse.donnees.personnesACharge,
            ligne.id,
            idsConnus
          );
          if (ligneServeur !== undefined) {
            const locale = depuisServeur(ligneServeur);
            idsConnus.add(ligneServeur.id);
            setCourant((prev) => prev.map((l) => (l.id === ligne.id ? locale : l)));
            setReference((prev) => prev.map((l) => (l.id === ligne.id ? locale : l)));
          }
        } catch (erreur) {
          if (erreur instanceof AppelApiEchoue && estConflitVersion(erreur.erreur.code)) {
            throw erreur;
          }
          if (erreur instanceof AppelApiEchoue) {
            setAlertesParLigne((prev) => ({
              ...prev,
              [ligne.id]: [
                {
                  code: erreur.erreur.code,
                  message: erreur.erreur.message,
                  champ: erreur.erreur.champ,
                },
              ],
            }));
            if (!formulaireErreurOuvert) {
              ouvrirFormulaire(ligne.id);
              formulaireErreurOuvert = true;
            }
            continue;
          }
          throw erreur;
        }
      }

      for (const ligne of ajouts) {
        try {
          const reponse = await creerPersonneACharge(
            companyId,
            salarieId,
            versionCourante,
            versCorpsCreation(ligne)
          );
          versionCourante = reponse.donnees.version;
          alertesRecues.push(...reponse.alertes);
          const ligneServeur = extraireLigneReponse(
            reponse.donnees.personnesACharge,
            ligne.id,
            idsConnus
          );
          if (ligneServeur !== undefined) {
            const locale = depuisServeur(ligneServeur);
            idsConnus.add(ligneServeur.id);
            setCourant((prev) => prev.map((l) => (l.id === ligne.id ? locale : l)));
            setReference((prev) => [...prev.filter((l) => l.id !== ligne.id), locale]);
          }
        } catch (erreur) {
          if (erreur instanceof AppelApiEchoue && estConflitVersion(erreur.erreur.code)) {
            throw erreur;
          }
          if (erreur instanceof AppelApiEchoue) {
            setAlertesParLigne((prev) => ({
              ...prev,
              [ligne.id]: [
                {
                  code: erreur.erreur.code,
                  message: erreur.erreur.message,
                  champ: erreur.erreur.champ,
                },
              ],
            }));
            if (!formulaireErreurOuvert) {
              ouvrirFormulaire(ligne.id);
              formulaireErreurOuvert = true;
            }
            continue;
          }
          throw erreur;
        }
      }

      setAlertes(alertesRecues);
      onVersionChange(versionCourante);
      return { version: versionCourante, alertes: alertesRecues };
    },
    [companyId, onVersionChange, ouvrirFormulaire, salarieId]
  );

  useEffect(() => {
    const desenregistrer = enregistrerRubrique({
      id: 'personnes-a-charge',
      libelle: 'Personnes à charge',
      estModifiee: () => estModifieeContreReference(courantRef.current, referenceRef.current),
      envoyer: envoyerRubrique,
      reinitialiser: reinitialiserRubrique,
    });
    return desenregistrer;
  }, [enregistrerRubrique, envoyerRubrique, reinitialiserRubrique]);

  const colonnes = useMemo(
    () => [
      {
        id: 'lien',
        libelle: 'Lien de parenté',
        render: (l: LignePersonneAChargeLocale) => libelleLien(l.lienParenteCode, liensParente),
      },
      { id: 'prenom', libelle: 'Prénom', render: (l: LignePersonneAChargeLocale) => l.prenom },
      { id: 'nom', libelle: 'Nom', render: (l: LignePersonneAChargeLocale) => l.nom },
      {
        id: 'naissance',
        libelle: 'Date de naissance',
        render: (l: LignePersonneAChargeLocale) => l.dateNaissance,
      },
      {
        id: 'aCharge',
        libelle: 'À charge',
        render: (l: LignePersonneAChargeLocale) => (l.aCharge ? 'Oui' : 'Non'),
      },
    ],
    [liensParente]
  );

  return (
    <Rubrique id="personnes-a-charge" titre="Personnes à charge">
      <TeteRubriqueFiche
        erreur={erreurRubrique}
        alertes={alertes}
        testidErreur="erreur-rubrique-personnes-a-charge"
        testidAlertes="alertes-tete-personnes-a-charge"
      />

      <EnveloppeTableauRepetable
        colonnes={colonnes}
        lignes={lignesAffichees}
        getLigneId={(l) => l.id}
        estInactive={(l) => l.etat === 'INACTIVE'}
        estNonEnregistree={(l) => l.etat === 'NON_ENREGISTREE'}
        libelleEtatLigne={libelleEtatLigne}
        idColonneMarque="prenom"
        ligneEnErreur={(ligne) => (alertesParLigne[ligne.id]?.length ?? 0) > 0}
        formulaireOuvertId={formulaireOuvertId}
        onOuvrirFormulaire={ouvrirFormulaireLigne}
        onValiderLigne={validerLigne}
        onAnnulerLigne={annulerLigne}
        suppressionEnCours={suppressionEnCours}
        peutModifier
        onAjouter={() => {
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
            return;
          }
          setDialogueSuppression(ligne);
        }}
        renderFormulaire={(ligne, actions) => (
          <FormulairePersonneACharge
            ligne={ligne}
            liensParente={liensParente}
            alertes={alertesParLigne[ligne.id] ?? []}
            lectureSeule={actions.lectureSeule}
            onChange={(patch) => modifierLigne(ligne.id, patch)}
            onValider={actions.onValider}
            onAnnuler={actions.onAnnuler}
          />
        )}
      />

      <DialogueSuppressionLigneTableau
        titre="Supprimer cette personne à charge ?"
        ouvert={dialogueSuppression !== null}
        rubriqueModifiee={estModifieeContreReference(courant, reference)}
        onFermer={() => setDialogueSuppression(null)}
        onConfirme={() => {
          notifierSommaire();
        }}
        chargerApercu={async () => {
          if (dialogueSuppression === null) {
            throw new Error('Aucune ligne');
          }
          const reponse = await impactSuppressionPersonneACharge(
            companyId,
            salarieId,
            dialogueSuppression.id
          );
          return reponse.donnees;
        }}
        supprimer={async (jeton) => {
          if (dialogueSuppression === null) return;
          setSuppressionEnCours(true);
          try {
            const reponse = await supprimerPersonneACharge(
              companyId,
              salarieId,
              dialogueSuppression.id,
              version,
              jeton
            );
            const idsConnus = new Set(courantRef.current.map((l) => l.id));
            const ligneServeur = extraireLigneReponse(
              reponse.donnees.personnesACharge,
              dialogueSuppression.id,
              idsConnus
            );
            if (ligneServeur !== undefined) {
              appliquerLigneServeur(ligneServeur, reponse.donnees.version);
              setCourant((prev) => {
                const locale = depuisServeur(ligneServeur);
                const sans = prev.filter((l) => l.id !== dialogueSuppression.id);
                if (sans.some((l) => l.id === locale.id)) {
                  return sans.map((l) => (l.id === locale.id ? locale : l));
                }
                return [...sans, locale];
              });
              setReference((prev) => {
                const locale = depuisServeur(ligneServeur);
                const filtre = prev.filter((l) => l.id !== dialogueSuppression.id);
                if (filtre.some((l) => l.id === locale.id)) {
                  return filtre.map((l) => (l.id === locale.id ? locale : l));
                }
                return [...filtre, locale];
              });
            } else {
              setCourant((prev) => prev.filter((l) => l.id !== dialogueSuppression.id));
              setReference((prev) => prev.filter((l) => l.id !== dialogueSuppression.id));
              signalerVersionApresEcritureHorsSequence(reponse.donnees.version);
              onVersionChange(reponse.donnees.version);
            }
          } finally {
            setSuppressionEnCours(false);
          }
        }}
      />
    </Rubrique>
  );
}

function FormulairePersonneACharge({
  ligne,
  liensParente,
  alertes,
  lectureSeule,
  onChange,
  onValider,
  onAnnuler,
}: {
  readonly ligne: LignePersonneAChargeLocale;
  readonly liensParente: readonly LienParente[];
  readonly alertes: readonly AlerteApi[];
  readonly lectureSeule: boolean;
  readonly onChange: (patch: Partial<LignePersonneAChargeLocale>) => void;
  readonly onValider: () => void;
  readonly onAnnuler: () => void;
}) {
  if (lectureSeule) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" data-testid="formulaire-lecture-seule">
        <p>Lien de parenté : {libelleLien(ligne.lienParenteCode, liensParente)}</p>
        <p>Prénom : {ligne.prenom}</p>
        <p>Nom : {ligne.nom}</p>
        <p>Sexe : {ligne.sexe === 'HOMME' ? 'Homme' : 'Femme'}</p>
        <p>Date de naissance : {ligne.dateNaissance}</p>
        {ligne.lienParenteCode === 'ENFANT' ? (
          <p>Situation de handicap : {ligne.situationHandicap ? 'Oui' : 'Non'}</p>
        ) : null}
        <p>À charge : {ligne.aCharge ? 'Oui' : 'Non'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RegistreAlertesSalarie alertes={alertes} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`lien-${ligne.id}`}>Lien de parenté</Label>
          <Select
            id={`lien-${ligne.id}`}
            value={ligne.lienParenteCode}
            onChange={(e) => onChange({ lienParenteCode: e.target.value })}
          >
            {liensParente.map((lien) => (
              <option key={lien.code} value={lien.code}>
                {lien.libelle}
              </option>
            ))}
          </Select>
          <MessagesAlerteChamp alertes={alertes} champ="lienParenteCode" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`prenom-${ligne.id}`}>Prénom</Label>
          <Input
            id={`prenom-${ligne.id}`}
            value={ligne.prenom}
            onChange={(e) => onChange({ prenom: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="prenom" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`nom-${ligne.id}`}>Nom</Label>
          <Input
            id={`nom-${ligne.id}`}
            value={ligne.nom}
            onChange={(e) => onChange({ nom: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="nom" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`sexe-${ligne.id}`}>Sexe</Label>
          <Select
            id={`sexe-${ligne.id}`}
            value={ligne.sexe}
            onChange={(e) =>
              onChange({ sexe: e.target.value as LignePersonneAChargeLocale['sexe'] })
            }
          >
            <option value="HOMME">Homme</option>
            <option value="FEMME">Femme</option>
          </Select>
          <MessagesAlerteChamp alertes={alertes} champ="sexe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`dateNaissance-${ligne.id}`}>Date de naissance</Label>
          <Input
            id={`dateNaissance-${ligne.id}`}
            type="date"
            value={ligne.dateNaissance}
            onChange={(e) => onChange({ dateNaissance: e.target.value })}
          />
          <MessagesAlerteChamp alertes={alertes} champ="dateNaissance" />
        </div>
        {ligne.lienParenteCode === 'ENFANT' ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`handicap-${ligne.id}`}
              checked={ligne.situationHandicap}
              onChange={(e) => onChange({ situationHandicap: e.target.checked })}
            />
            <Label htmlFor={`handicap-${ligne.id}`}>Situation de handicap</Label>
            <MessagesAlerteChamp alertes={alertes} champ="situationHandicap" />
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Checkbox
            id={`aCharge-${ligne.id}`}
            checked={ligne.aCharge}
            onChange={(e) => onChange({ aCharge: e.target.checked })}
          />
          <Label htmlFor={`aCharge-${ligne.id}`}>À charge</Label>
          <MessagesAlerteChamp alertes={alertes} champ="aCharge" />
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
