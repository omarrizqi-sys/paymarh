// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { RubriqueRemunerationPlaceholder } from './rubrique-remuneration-placeholder';

describe('RubriqueRemunerationPlaceholder', () => {
  it('sans droit salarie.remuneration.lire la rubrique est absente du DOM', () => {
    const { container } = render(
      createElement(RubriqueRemunerationPlaceholder, {
        operations: ['salarie.lire', 'salarie.modifier'],
      })
    );

    expect(container.querySelector('#remuneration')).toBeNull();
    expect(screen.queryByText('Remuneration')).toBeNull();
  });

  it('avec droit salarie.remuneration.lire la rubrique est presente', () => {
    render(
      createElement(RubriqueRemunerationPlaceholder, {
        operations: ['salarie.remuneration.lire'],
      })
    );

    expect(document.getElementById('remuneration')).toBeTruthy();
  });
});
