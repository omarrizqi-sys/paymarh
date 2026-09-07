'use client';

import { Fragment, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ColonneTableauRepetable<T> {
  readonly id: string;
  readonly libelle: string;
  readonly render: (ligne: T) => ReactNode;
}

export interface PropsEnveloppeTableauRepetable<T> {
  readonly colonnes: readonly ColonneTableauRepetable<T>[];
  readonly lignes: readonly T[];
  readonly getLigneId: (ligne: T) => string;
  readonly estInactive: (ligne: T) => boolean;
  readonly estNonEnregistree: (ligne: T) => boolean;
  readonly libelleEtatLigne: (ligne: T) => string | null;
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
  readonly suppressionEnCours: boolean;
  readonly peutModifier: boolean;
  readonly testId?: string;
}

export function EnveloppeTableauRepetable<T>({
  colonnes,
  lignes,
  getLigneId,
  estInactive,
  estNonEnregistree,
  libelleEtatLigne,
  ligneEnErreur,
  formulaireOuvertId,
  onOuvrirFormulaire,
  onValiderLigne,
  onAnnulerLigne,
  renderFormulaire,
  onAjouter,
  onSupprimer,
  suppressionEnCours,
  peutModifier,
  testId = 'enveloppe-tableau',
}: PropsEnveloppeTableauRepetable<T>) {
  return (
    <div className="space-y-3" data-testid={testId}>
      <Table>
        <TableHeader>
          <TableRow>
            {colonnes.map((colonne) => (
              <TableHead key={colonne.id}>{colonne.libelle}</TableHead>
            ))}
            <TableHead>État</TableHead>
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
                          : undefined
                  }
                  onClick={() => onOuvrirFormulaire(id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onOuvrirFormulaire(id);
                    }
                  }}
                >
                  {colonnes.map((colonne) => (
                    <TableCell key={colonne.id}>{colonne.render(ligne)}</TableCell>
                  ))}
                  <TableCell data-testid={`etat-ligne-${id}`}>
                    {etatLibelle ?? ''}
                    {enErreur ? (
                      <span data-testid={`marque-erreur-ligne-${id}`} className="text-destructive">
                        {etatLibelle ? ' — ' : ''}
                        en erreur
                      </span>
                    ) : null}
                  </TableCell>
                  {peutModifier ? (
                    <TableCell>
                      {!inactive ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          data-testid={`supprimer-${id}`}
                          disabled={suppressionEnCours}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSupprimer(ligne);
                          }}
                        >
                          Supprimer
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
                {ouvert ? (
                  <TableRow data-testid={`formulaire-${id}`}>
                    <TableCell colSpan={colonnes.length + (peutModifier ? 2 : 1)} className="p-4">
                      {renderFormulaire(ligne, {
                        lectureSeule: inactive,
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
        <Button type="button" variant="outline" data-testid="ajouter-ligne" onClick={onAjouter}>
          Ajouter
        </Button>
      ) : null}
    </div>
  );
}
