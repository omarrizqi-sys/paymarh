// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppelApiEchoue } from '@/lib/api/client';
import { DialogueImpactSuppression } from '@/components/impact-suppression/dialogue-impact-suppression';

describe('DialogueImpactSuppression', () => {
  it('relance l apercu quand le jeton est obsolete au lieu d insister', async () => {
    let appelsImpact = 0;
    const chargerImpact = vi.fn(async () => {
      appelsImpact += 1;
      return {
        inventaire: [{ libelle: 'Etablissements', quantite: appelsImpact }],
        jeton: `jeton-${appelsImpact}`,
      };
    });
    const supprimer = vi.fn(async () => {
      throw new AppelApiEchoue(409, {
        code: 'CONFIRMATION_OBSOLETE',
        message: 'Jeton obsolete',
      });
    });
    const onConfirme = vi.fn();
    const onFermer = vi.fn();

    render(
      createElement(DialogueImpactSuppression, {
        titre: 'Confirmer la suppression',
        ouvert: true,
        onFermer,
        onConfirme,
        chargerImpact,
        supprimer,
      })
    );

    await waitFor(() => expect(chargerImpact).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('Etablissements')).toBeTruthy());

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }));

    await waitFor(() => expect(supprimer).toHaveBeenCalledWith('jeton-1'));
    await waitFor(() => expect(chargerImpact).toHaveBeenCalledTimes(2));
    expect(onConfirme).not.toHaveBeenCalled();
    expect(onFermer).not.toHaveBeenCalled();
    expect(screen.getByText(/inventaire a change/i)).toBeTruthy();
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });
});
