'use client';

import { useCallback, useRef, useState } from 'react';
import type { Permission } from '@paymarh/shared-types';
import { libelleStatutEnregistrement } from '@/lib/affichage/libelles';
import { AppelApiEchoue } from '@/lib/api/client';
import { impactSuppressionSalarie, supprimerSalarie } from '@/lib/api/salaries';
import { estConflitVersion } from '@/lib/fiche/codes-conflit';
import { MESSAGE_ERREUR_GENERIQUE } from '@/lib/messages-interface';
import { possedePermission } from '@/lib/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  messageConfirmationAnnuler,
  messageConfirmationRechargement,
} from './avertissement-navigation';
import { DialogueConfirmationSuppressionTableau } from '@/components/navigation/dialogue-confirmation-suppression-tableau';
import { useRegistreFiche } from './registre-fiche-provider';
import {
  textesSuppressionFiche,
  type TextesConfirmationSuppression,
} from '@/components/navigation/textes-suppression-tableau-historise';
import { useNavigationGardee } from '@/components/navigation/navigation-gardee';

interface Props {
  readonly operations: readonly Permission[];
  readonly companyId: string;
  readonly salarieId: string;
  readonly modeCompact?: boolean;
}

export function RailActionsFiche({ operations, companyId, salarieId, modeCompact = false }: Props) {
  const { push } = useNavigationGardee();
  const {
    version,
    nombreModifiees,
    enregistrementEnCours,
    ecritureHorsSequenceEnCours,
    enregistrer,
    annuler,
    conflitVersion,
    resultatsRecap,
    rechargementEnAttente,
    rechargerDepuisServeur,
    confirmerRechargementServeur,
    annulerRechargementServeur,
    rubriquesSommaire,
    signalerDebutEcritureHorsSequence,
    signalerFinEcritureHorsSequence,
    signalerConflitVersion,
  } = useRegistreFiche();

  const [dialogueSuppressionOuvert, setDialogueSuppressionOuvert] = useState(false);
  const [textesDialogue, setTextesDialogue] = useState<TextesConfirmationSuppression | null>(null);
  const [chargementDialogue, setChargementDialogue] = useState(false);
  const [erreurDialogue, setErreurDialogue] = useState<string | undefined>();
  const jetonSuppressionRef = useRef('');

  const libellesModifies = rubriquesSommaire.filter((r) => r.modifiee).map((r) => r.libelle);
  const peutSupprimer = possedePermission(operations, 'salarie.supprimer');
  const saisieBloquee = enregistrementEnCours || ecritureHorsSequenceEnCours;

  const terminerAttenteSuppression = useCallback(() => {
    signalerFinEcritureHorsSequence();
  }, [signalerFinEcritureHorsSequence]);

  const fermerDialogueSuppression = useCallback(() => {
    setDialogueSuppressionOuvert(false);
    setTextesDialogue(null);
    setChargementDialogue(false);
    setErreurDialogue(undefined);
    terminerAttenteSuppression();
  }, [terminerAttenteSuppression]);

  const declencherSuppression = useCallback(async () => {
    if (saisieBloquee) return;
    signalerDebutEcritureHorsSequence();
    setChargementDialogue(true);
    setErreurDialogue(undefined);
    try {
      const reponse = await impactSuppressionSalarie(companyId, salarieId);
      jetonSuppressionRef.current = reponse.donnees.jetonConfirmation;
      setTextesDialogue(
        textesSuppressionFiche({
          messageServeur: reponse.donnees.message,
          modificationsNonEnregistrees: nombreModifiees > 0,
        })
      );
      setDialogueSuppressionOuvert(true);
    } catch {
      terminerAttenteSuppression();
    } finally {
      setChargementDialogue(false);
    }
  }, [
    companyId,
    nombreModifiees,
    salarieId,
    saisieBloquee,
    signalerDebutEcritureHorsSequence,
    terminerAttenteSuppression,
  ]);

  const confirmerSuppression = useCallback(async () => {
    setChargementDialogue(true);
    setErreurDialogue(undefined);
    try {
      await supprimerSalarie(companyId, salarieId, version, jetonSuppressionRef.current);
      setDialogueSuppressionOuvert(false);
      setTextesDialogue(null);
      setChargementDialogue(false);
      setErreurDialogue(undefined);
      terminerAttenteSuppression();
      annuler();
      push(`/societes/${companyId}/salaries`);
    } catch (erreur) {
      if (erreur instanceof AppelApiEchoue && estConflitVersion(erreur.erreur.code)) {
        setDialogueSuppressionOuvert(false);
        setTextesDialogue(null);
        setChargementDialogue(false);
        setErreurDialogue(undefined);
        signalerConflitVersion();
        terminerAttenteSuppression();
        return;
      }
      if (erreur instanceof AppelApiEchoue) {
        if (erreur.statut >= 500 || erreur.erreur.code === 'ERREUR') {
          setErreurDialogue(MESSAGE_ERREUR_GENERIQUE);
        } else {
          setErreurDialogue(erreur.erreur.message);
        }
      } else {
        setErreurDialogue(MESSAGE_ERREUR_GENERIQUE);
      }
      terminerAttenteSuppression();
    } finally {
      setChargementDialogue(false);
    }
  }, [
    annuler,
    companyId,
    push,
    salarieId,
    signalerConflitVersion,
    terminerAttenteSuppression,
    version,
  ]);

  const boutonEnregistrer = (
    <Button
      type="button"
      size={modeCompact ? 'icon' : 'default'}
      aria-label="Enregistrer"
      disabled={nombreModifiees === 0 || saisieBloquee}
      onClick={() => void enregistrer()}
      title={nombreModifiees > 0 ? `Enregistrer (${nombreModifiees})` : 'Enregistrer'}
    >
      {modeCompact
        ? '💾'
        : nombreModifiees > 0
          ? `Enregistrer (${nombreModifiees})`
          : 'Enregistrer'}
    </Button>
  );

  const boutonAnnuler = (
    <Button
      type="button"
      variant="outline"
      size={modeCompact ? 'icon' : 'default'}
      aria-label="Annuler"
      disabled={nombreModifiees === 0 || saisieBloquee}
      title="Annuler"
      onClick={() => {
        if (!window.confirm(messageConfirmationAnnuler(libellesModifies))) return;
        void annuler();
      }}
    >
      {modeCompact ? '↩' : 'Annuler'}
    </Button>
  );

  return (
    <div className="space-y-3" data-testid={modeCompact ? 'rail-compact' : 'rail-etendu'}>
      <div className="flex flex-col gap-2">
        {boutonEnregistrer}
        {boutonAnnuler}
      </div>

      {conflitVersion ? (
        <Alert variant="destructive" data-testid="bandeau-conflit-version">
          <AlertDescription>
            La fiche a été modifiée entre-temps. Rechargez les valeurs du serveur pour continuer.
          </AlertDescription>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            data-testid="recharger-valeurs-serveur"
            onClick={rechargerDepuisServeur}
          >
            Recharger les valeurs du serveur
          </Button>
        </Alert>
      ) : null}

      {rechargementEnAttente ? (
        <Alert data-testid="dialogue-rechargement">
          <AlertDescription>
            {messageConfirmationRechargement(
              libellesModifies.length > 0 ? libellesModifies : ['toutes les rubriques']
            )}
          </AlertDescription>
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" onClick={() => void confirmerRechargementServeur()}>
              Confirmer
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={annulerRechargementServeur}>
              Garder ma saisie
            </Button>
          </div>
        </Alert>
      ) : null}

      {resultatsRecap.length > 0 ? (
        <ul className="text-muted-foreground space-y-1 text-xs" data-testid="recap-enregistrement">
          {resultatsRecap.map((resultat) => (
            <li key={resultat.id}>
              {resultat.libelle} : {libelleStatutEnregistrement(resultat.statut)}
              {resultat.message ? ` — ${resultat.message}` : ''}
            </li>
          ))}
        </ul>
      ) : null}

      {peutSupprimer ? (
        <Button
          type="button"
          variant="destructive"
          size={modeCompact ? 'icon' : 'default'}
          disabled={saisieBloquee}
          title="Supprimer"
          onClick={() => void declencherSuppression()}
        >
          {modeCompact ? '🗑' : 'Supprimer'}
        </Button>
      ) : null}

      <DialogueConfirmationSuppressionTableau
        textes={textesDialogue}
        preambule={null}
        chargement={chargementDialogue}
        erreur={erreurDialogue}
        ouvert={dialogueSuppressionOuvert}
        onFermer={fermerDialogueSuppression}
        onConfirmer={() => void confirmerSuppression()}
      />
    </div>
  );
}
