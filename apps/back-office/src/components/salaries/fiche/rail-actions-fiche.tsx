'use client';

import type { Permission } from '@paymarh/shared-types';
import { possedePermission } from '@/lib/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  messageConfirmationAnnuler,
  messageConfirmationRechargement,
} from './avertissement-navigation';
import { useRegistreFiche } from './registre-fiche-provider';

interface Props {
  readonly operations: readonly Permission[];
  readonly modeCompact?: boolean;
}

export function RailActionsFiche({ operations, modeCompact = false }: Props) {
  const {
    nombreModifiees,
    enregistrementEnCours,
    enregistrer,
    annuler,
    conflitVersion,
    resultatsRecap,
    rechargementEnAttente,
    rechargerDepuisServeur,
    confirmerRechargementServeur,
    annulerRechargementServeur,
    rubriquesSommaire,
  } = useRegistreFiche();

  const libellesModifies = rubriquesSommaire.filter((r) => r.modifiee).map((r) => r.libelle);
  const peutSupprimer = possedePermission(operations, 'salarie.supprimer');

  const boutonEnregistrer = (
    <Button
      type="button"
      size={modeCompact ? 'icon' : 'default'}
      aria-label="Enregistrer"
      disabled={nombreModifiees === 0 || enregistrementEnCours}
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
      disabled={nombreModifiees === 0 || enregistrementEnCours}
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
            La fiche a ete modifiee entre-temps. Rechargez les valeurs du serveur pour continuer.
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
              {resultat.libelle} : {resultat.statut}
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
          disabled
          title="Supprimer"
        >
          {modeCompact ? '🗑' : 'Supprimer'}
        </Button>
      ) : null}
    </div>
  );
}
