import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JournaliserEcriture } from '../../../common/audit/journaliser-ecriture.decorator.js';
import { ExigeIfMatch } from '../../../common/conformite-routes/exige-if-match.decorator.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  PerimetreSalarie,
  RequiertPermission,
} from '../../../common/permissions/requiert-permission.decorator.js';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service.js';
import { TenantGuard } from '../../../common/tenancy/tenant.guard.js';
import { accountScope } from '../../../common/tenancy/tenant-scope.js';
import { MoisEnCoursService } from '../mois-en-cours/mois-en-cours.service.js';
import { okEcriture } from '../reponses/enveloppe-ecriture.js';
import {
  EN_TETE_IF_MATCH,
  VerrouillageOptimisteService,
} from '../verrouillage/verrouillage-optimiste.service.js';

/**
 * Controleur interne pour tester le socle 2.1.b — branche uniquement dans les tests HTTP.
 */
@Controller('socle-test/salaries')
@UseGuards(TenantGuard)
export class SocleSalarieTestController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly moisEnCours: MoisEnCoursService,
    private readonly verrouillage: VerrouillageOptimisteService
  ) {}

  @Get(':id')
  @RequiertPermission('salarie.lire')
  @PerimetreSalarie('id')
  async lire(@Param('id', ParseUUIDPipe) id: string) {
    const ctx = this.tenantContext.getOrThrow();
    const salarie = await this.prisma.salarie.findFirst({
      where: { id, company: accountScope(ctx) },
    });

    if (salarie === null) {
      throw new NotFoundException('Ressource introuvable.');
    }

    const moisEnCours = await this.moisEnCours.calculerPourSalarie(id);

    return {
      donnees: {
        id: salarie.id,
        nom: salarie.nom,
        prenom: salarie.prenom,
        version: salarie.version,
        moisEnCours,
        remuneration: { montant: '12000.00' },
        paiement: { mode: 'VIREMENT' },
        primesContractuelles: [{ libelle: 'Transport' }],
        avantagesEnNature: [{ type: 'VEHICULE' }],
        comptesBancaires: [{ rib: '007810000105050003212345' }],
      },
    };
  }

  @Patch(':id')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'MODIFIER_SALARIE_TEST' })
  @ExigeIfMatch()
  async modifier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { nom?: string; remuneration?: unknown },
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined,
    @Req() request: Request
  ) {
    void request;
    const version = this.verrouillage.exigerVersion(ifMatch);
    const donnees: Record<string, unknown> = {};
    if (body.nom !== undefined) {
      donnees.nom = body.nom;
    }

    const salarie = await this.verrouillage.modifierSalarie({
      id,
      versionAttendue: version,
      donnees,
    });

    return okEcriture({
      id: salarie.id,
      nom: salarie.nom,
      version: salarie.version,
    });
  }
}
