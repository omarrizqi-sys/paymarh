import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { API_VERSION } from '../../version.js';

// On instancie le controleur directement, sans conteneur d injection : le
// test reste rapide et ne depend d aucune infrastructure.
describe('GET /health', () => {
  const controller = new HealthController(new HealthService());

  it('repond status "ok"', () => {
    expect(controller.check().status).toBe('ok');
  });

  it('renvoie un horodatage ISO 8601 valide', () => {
    const { timestamp } = controller.check();

    expect(Number.isNaN(Date.parse(timestamp))).toBe(false);
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('renvoie la version de l API', () => {
    expect(controller.check().version).toBe(API_VERSION);
  });
});
