'use client';

import { Fragment, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DialogueSuppressionDiffereeTableau } from './dialogue-suppression-differee-tableau';

export interface ColonneTableauRepetable<T> {
  readonly id: string;
  readonly libelle: string;
  readonly render: (ligne: T) => ReactNode;
}

export interface ConfirmationSuppressionLigne<T> {
  readonly titre: string;
  readonly corps: string;
  readonly libelleConfirmer: string;
  readonly libelleAnnuler: string;
  readonly onConfirmer: (ligne: T) => void;
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
  readonly strategieSuppression?: ConfirmationSuppressionLigne<T>;
  readonly suppressionEnCours: boolean;
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
  strategieSuppression,
  suppressionEnCours,
  peutModifier,
  verrouille = false,
  testId = 'enveloppe-tableau',
}: PropsEnveloppeTableauRepetable<T>) {
  const [ligneDialogue, setLigneDialogue] = useState<T | null>(null);

  function declencherSuppression(ligne: T, event: React.MouseEvent): void {
    event.stopPropagation();
    if (verrouille) return;

    if (estNonEnregistree(ligne)) {
      onSupprimer(ligne);
      return;
    }

    if (strategieSuppression !== undefined) {
      setLigneDialogue(ligne);
      return;
    }

    onSupprimer(ligne);
  }

  const saisieBloquee = verrouille;

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
                          disabled={suppressionEnCours || saisieBloquee}
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

      {strategieSuppression !== undefined && ligneDialogue !== null ? (
        <DialogueSuppressionDiffereeTableau
          titre={strategieSuppression.titre}
          corps={strategieSuppression.corps}
          libelleConfirmer={strategieSuppression.libelleConfirmer}
          libelleAnnuler={strategieSuppression.libelleAnnuler}
          ouvert
          onFermer={() => setLigneDialogue(null)}
          onConfirmer={() => {
            strategieSuppression.onConfirmer(ligneDialogue);
            setLigneDialogue(null);
          }}
        />
      ) : null}
    </div>
  );
}
