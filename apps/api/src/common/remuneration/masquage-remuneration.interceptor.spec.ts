import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { PermissionServiceProvisoire } from '../permissions/permission.service.provisoire.js';
import { PermissionsRefuseesContext } from '../permissions/permissions-refusees.context.js';
import { TenantContextService } from '../tenancy/tenant-context.service.js';
import { MasquageRemunerationInterceptor } from './masquage-remuneration.interceptor.js';

describe('MasquageRemunerationInterceptor', () => {
  it('sans contexte de tenant, ne rend aucune donnee de remuneration', async () => {
    const interceptor = new MasquageRemunerationInterceptor(
      new PermissionServiceProvisoire(new PermissionsRefuseesContext()),
      new TenantContextService()
    );

    const donnees = {
      nom: 'Alami',
      remuneration: { montant: '10000' },
      paiement: { mode: 'VIREMENT' },
      comptesBancaires: [{ rib: '007' }],
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', headers: {}, body: undefined }),
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () => of(donnees),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ nom: 'Alami' });
    expect(result).not.toHaveProperty('remuneration');
    expect(result).not.toHaveProperty('paiement');
    expect(result).not.toHaveProperty('comptesBancaires');
  });
});
