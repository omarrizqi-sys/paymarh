'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppelApiEchoue } from '@/lib/api/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface LigneImpact {
  readonly libelle: string;
  readonly quantite: number;
}

interface Props {
  readonly titre: string;
  readonly ouvert: boolean;
  readonly onFermer: () => void;
  readonly onConfirme: () => void;
  readonly chargerImpact: () => Promise<{ inventaire: readonly LigneImpact[]; jeton: string }>;
  readonly supprimer: (jeton: string) => Promise<void>;
}

/**
 * Composant reutilisable d apercu d impact avant suppression.
 * Relance l apercu si l API repond CONFIRMATION_OBSOLETE.
 */
export function DialogueImpactSuppression({
  titre,
  ouvert,
  onFermer,
  onConfirme,
  chargerImpact,
  supprimer,
}: Props) {
  const [inventaire, setInventaire] = useState<readonly LigneImpact[]>([]);
  const [jeton, setJeton] = useState('');
  const [accepte, setAccepte] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | undefined>();

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(undefined);
    setAccepte(false);
    try {
      const { inventaire: lignes, jeton: nouveauJeton } = await chargerImpact();
      setInventaire(lignes);
      setJeton(nouveauJeton);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Impossible de charger l apercu.');
    } finally {
      setChargement(false);
    }
  }, [chargerImpact]);

  useEffect(() => {
    if (ouvert) {
      void recharger();
    }
  }, [ouvert, recharger]);

  async function confirmer(): Promise<void> {
    if (!accepte || !jeton) return;
    setChargement(true);
    setErreur(undefined);
    try {
      await supprimer(jeton);
      onConfirme();
      onFermer();
    } catch (e) {
      if (e instanceof AppelApiEchoue && e.erreur.code === 'CONFIRMATION_OBSOLETE') {
        await recharger();
        setErreur('L inventaire a change : veuillez relire et confirmer a nouveau.');
        return;
      }
      setErreur(e instanceof AppelApiEchoue ? e.erreur.message : 'La suppression a echoue.');
    } finally {
      setChargement(false);
    }
  }

  if (!ouvert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-impact-titre"
    >
      <div className="bg-background max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-lg">
        <h2 id="dialogue-impact-titre" className="mb-4 text-lg font-semibold">
          {titre}
        </h2>

        {chargement && inventaire.length === 0 ? (
          <p className="text-muted-foreground text-sm">Chargement de l apercu...</p>
        ) : (
          <ul className="mb-4 space-y-2 text-sm">
            {inventaire.map((ligne) => (
              <li key={ligne.libelle} className="flex justify-between gap-4">
                <span>{ligne.libelle}</span>
                <span className="font-medium tabular-nums">{ligne.quantite}</span>
              </li>
            ))}
          </ul>
        )}

        {erreur ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{erreur}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mb-6 flex items-start gap-2">
          <Checkbox
            id="accepte-suppression"
            checked={accepte}
            onChange={(e) => setAccepte(e.target.checked)}
          />
          <Label htmlFor="accepte-suppression" className="cursor-pointer leading-snug">
            J ai lu l inventaire ci-dessus et j accepte la suppression irreversible de ces
            elements.
          </Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onFermer} disabled={chargement}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            disabled={!accepte || !jeton || chargement}
            onClick={() => void confirmer()}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}
