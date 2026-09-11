'use client';

import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DialogueConfirmationSuppressionTableau } from '@/components/navigation/dialogue-confirmation-suppression-tableau';
import type { TextesConfirmationSuppression } from '@/components/navigation/textes-suppression-tableau-historise';

export interface ColonneTableauRepetable<T> {
  readonly id: string;
  readonly libelle: string;
  readonly render: (ligne: T) => ReactNode;
}

export type ResultatConfirmationSuppression =
  { readonly type: 'termine' } | { readonly type: 'recommencer'; readonly preambule: string };

export interface SuppressionTableauRepetable<T> {
  readonly preparer: (ligne: T) => Promise<TextesConfirmationSuppression>;
  readonly confirmer: (ligne: T) => Promise<ResultatConfirmationSuppression>;
}

export interface PropsEnveloppeTableauRepetable<T> {
  readonly colonnes: readonly ColonneTableauRepetable<T>[];
  readonly lignes: readonly T[];
  readonly getLigneId: (ligne: T) => string;
  readonly estInactive: (ligne: T) => boolean;
  readonly estNonEnregistree: (ligne: T) => boolean;
  readonly libelleEtatLigne: (ligne: T) => string | null;
  /** Colonne métier qui porte « non enregistrée », « inactive depuis… » et « en erreur ». */
  readonly idColonneMarque: string;
  readonly ligneEnErreur?: (ligne: T) => boolean;
  readonly formulaireOuvertId: string | null;
  readonly onOuvrirFormulaire: (id: string) => void;
  readonly onValiderLigne: (id: string) => void;
  readonly onAnnulerLigne: (id: string) => void;
  readonly renderFormulaire: (
    ligne: T,
    actions: {
      readonly lectureSeule: boolean;
      readonly onValider: () => void;
      readonly onAnnuler: () => void;
    }
  ) => ReactNode;
  readonly onAjouter: () => void;
  readonly onSupprimer: (ligne: T) => void;
  readonly suppression?: SuppressionTableauRepetable<T>;
  readonly onAttenteSuppressionChange?: (enAttente: boolean) => void;
  readonly peutModifier: boolean;
  readonly verrouille?: boolean;
  readonly testId?: string;
}

export function EnveloppeTableauRepetable<T>({
  colonnes,
  lignes,
  getLigneId,
  estInactive,
  estNonEnregistree,
  libelleEtatLigne,
  idColonneMarque,
  ligneEnErreur,
  formulaireOuvertId,
  onOuvrirFormulaire,
  onValiderLigne,
  onAnnulerLigne,
  renderFormulaire,
  onAjouter,
  onSupprimer,
  suppression,
  onAttenteSuppressionChange,
  peutModifier,
  verrouille = false,
  testId = 'enveloppe-tableau',
}: PropsEnveloppeTableauRepetable<T>) {
  const [ligneDialogue, setLigneDialogue] = useState<T | null>(null);
  const [textesDialogue, setTextesDialogue] = useState<TextesConfirmationSuppression | null>(null);
  const [preambuleDialogue, setPreambuleDialogue] = useState<string | null>(null);
  const [chargementDialogue, setChargementDialogue] = useState(false);
  const [erreurDialogue, setErreurDialogue] = useState<string | undefined>();

  const fluxSuppressionActif = ligneDialogue !== null;

  const signalerAttente = useCallback(
    (enAttente: boolean) => {
      onAttenteSuppressionChange?.(enAttente);
    },
    [onAttenteSuppressionChange]
  );

  const fermerDialogue = useCallback(() => {
    setLigneDialogue(null);
    setTextesDialogue(null);
    setPreambuleDialogue(null);
    setChargementDialogue(false);
    setErreurDialogue(undefined);
    signalerAttente(false);
  }, [signalerAttente]);

  const chargerTextes = useCallback(
    async (ligne: T, preambule: string | null) => {
      if (suppression === undefined) return;
      setChargementDialogue(true);
      setErreurDialogue(undefined);
      setPreambuleDialogue(preambule);
      try {
        const textes = await suppression.preparer(ligne);
        setTextesDialogue(textes);
      } catch (erreur) {
        setErreurDialogue(
          erreur instanceof Error ? erreur.message : 'Impossible de préparer la suppression.'
        );
        signalerAttente(false);
      } finally {
        setChargementDialogue(false);
      }
    },
    [signalerAttente, suppression]
  );

  useEffect(() => {
    if (ligneDialogue === null || suppression === undefined) return;
    void chargerTextes(ligneDialogue, null);
  }, [chargerTextes, ligneDialogue, suppression]);

  async function confirmerSuppression(): Promise<void> {
    if (ligneDialogue === null || suppression === undefined) return;
    setChargementDialogue(true);
    setErreurDialogue(undefined);
    try {
      const resultat = await suppression.confirmer(ligneDialogue);
      if (resultat.type === 'termine') {
        fermerDialogue();
        return;
      }
      await chargerTextes(ligneDialogue, resultat.preambule);
    } catch (erreur) {
      setErreurDialogue(erreur instanceof Error ? erreur.message : 'La suppression a échoué.');
      signalerAttente(false);
    } finally {
      setChargementDialogue(false);
    }
  }

  function declencherSuppression(ligne: T, event: React.MouseEvent): void {
    event.stopPropagation();
    if (verrouille || fluxSuppressionActif) return;

    if (estNonEnregistree(ligne)) {
      onSupprimer(ligne);
      return;
    }

    if (suppression !== undefined) {
      signalerAttente(true);
      setLigneDialogue(ligne);
      return;
    }

    onSupprimer(ligne);
  }

  const saisieBloquee = verrouille || fluxSuppressionActif;

  return (
    <div className="space-y-3" data-testid={testId}>
      <Table>
        <TableHeader>
          <TableRow>
            {colonnes.map((colonne) => (
              <TableHead key={colonne.id}>{colonne.libelle}</TableHead>
            ))}
            {peutModifier ? <TableHead className="w-24" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((ligne) => {
            const id = getLigneId(ligne);
            const inactive = estInactive(ligne);
            const nonEnregistree = estNonEnregistree(ligne);
            const ouvert = formulaireOuvertId === id;
            const etatLibelle = libelleEtatLigne(ligne);
            const enErreur = ligneEnErreur?.(ligne) ?? false;
            const lectureSeule = inactive || saisieBloquee || !peutModifier;

            return (
              <Fragment key={id}>
                <TableRow
                  data-testid={`ligne-${id}`}
                  className={
                    inactive
                      ? 'text-muted-foreground opacity-60'
                      : enErreur
                        ? 'bg-destructive/5'
                        : nonEnregistree
                          ? 'italic'
                          : saisieBloquee
                            ? 'opacity-60'
                            : undefined
                  }
                  onClick={() => {
                    if (!saisieBloquee) onOuvrirFormulaire(id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (saisieBloquee) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onOuvrirFormulaire(id);
                    }
                  }}
                >
                  {colonnes.map((colonne) => (
                    <TableCell key={colonne.id}>
                      {colonne.render(ligne)}
                      {colonne.id === idColonneMarque && (etatLibelle !== null || enErreur) ? (
                        <div className="text-muted-foreground text-xs">
                          {etatLibelle !== null ? (
                            <span data-testid={`etat-ligne-${id}`}>{etatLibelle}</span>
                          ) : null}
                          {enErreur ? (
                            <span
                              data-testid={`marque-erreur-ligne-${id}`}
                              className="text-destructive"
                            >
                              {etatLibelle !== null ? ' — ' : ''}
                              en erreur
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </TableCell>
                  ))}
                  {peutModifier ? (
                    <TableCell>
                      {!inactive ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          data-testid={`supprimer-${id}`}
                          disabled={fluxSuppressionActif || saisieBloquee}
                          onClick={(event) => declencherSuppression(ligne, event)}
                        >
                          Supprimer
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
                {ouvert ? (
                  <TableRow data-testid={`formulaire-${id}`}>
                    <TableCell colSpan={colonnes.length + (peutModifier ? 1 : 0)} className="p-4">
                      {renderFormulaire(ligne, {
                        lectureSeule,
                        onValider: () => onValiderLigne(id),
                        onAnnuler: () => onAnnulerLigne(id),
                      })}
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      {peutModifier ? (
        <Button
          type="button"
          variant="outline"
          data-testid="ajouter-ligne"
          disabled={saisieBloquee}
          onClick={onAjouter}
        >
          Ajouter
        </Button>
      ) : null}

      <DialogueConfirmationSuppressionTableau
        textes={textesDialogue}
        preambule={preambuleDialogue}
        chargement={chargementDialogue}
        erreur={erreurDialogue}
        ouvert={ligneDialogue !== null}
        onFermer={fermerDialogue}
        onConfirmer={() => void confirmerSuppression()}
      />
    </div>
  );
}
