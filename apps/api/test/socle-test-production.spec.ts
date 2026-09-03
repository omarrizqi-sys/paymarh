import { describe, expect, it, vi } from 'vitest';

describe('SocleTestModule — refus en production', () => {
  it('refuse le chargement si NODE_ENV vaut production', async () => {
    vi.resetModules();
    const precedent = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      await expect(import('../src/modules/salaries/test/socle-test.module.js')).rejects.toThrow(
        'SocleTestModule ne doit jamais etre charge en production : il expose des routes de test sur des donnees salarie.'
      );
    } finally {
      process.env.NODE_ENV = precedent;
      vi.resetModules();
    }
  }, 15_000);
});
