import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ApiResponse,
  CompteBancaire,
  ImpactSuppressionCompteBancaire,
  ListResponseAvecOperations,
  ResultatSuppression,
  Uuid,
} from '@paymarh/shared-types';
import { AuditService } from '../../common/audit/audit.service.js';
import { operationsCompteBancaire } from '../../common/permissions/operations-ressource.js';
import { assertPeutFaire } from '../../common/permissions/peut-faire.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { accountScope } from '../../common/tenancy/tenant-scope.js';
import { ok } from './api-response.js';
import type {
  CreerCompteBancaireDto,
  ModifierCompteBancaireDto,
} from './dto/etablissement-compte.dto.js';
import { compteBancaireUtiliseParBulletin } from './gardes-metier.js';
import { calculerJetonConfirmation, jetonsIdentiques } from './jeton-confirmation.js';
import { enrichirCompteBancaire } from './enrichir-operations.js';
import { toCompteBancaire } from './mappers.js';
import {
  assertChiffres,
  avertissementAucunCompteSalaires,
  avertissementsIdentifiants,
} from './validation-fiche.js';

@Injectable()
export class ComptesBancairesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly audit: AuditService
  ) {}

  async lister(
    societeId: Uuid
  ): Promise<ApiResponse<ListResponseAvecOperations<CompteBancaire>>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'compte-bancaire.lire', { companyId: societeId });
    await this.assurerSociete(societeId);

    const ops = operationsCompteBancaire(context, societeId);
    const rows = await this.prisma.compteBancaire.findMany({
      where: { companyId: societeId },
      include: { etablissements: true },
      orderBy: { createdAt: 'asc' },
    });

    const warnings = [];
    if (!rows.some((r) => r.usageSalaires && r.etat === 'ACTIF')) {
      warnings.push(avertissementAucunCompteSalaires());
    }

    return ok(
      {
        items: rows.map((row) =>
          enrichirCompteBancaire(toCompteBancaire(row), operationsCompteBancaire(context, societeId))
        ),
        total: rows.length,
        operations: ops,
      },
      warnings
    );
  }

  async creer(
    societeId: Uuid,
    dto: CreerCompteBancaireDto
  ): Promise<ApiResponse<CompteBancaire>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'compte-bancaire.creer', { companyId: societeId });
    await this.assurerSociete(societeId);

    assertChiffres(dto.rib, 'rib');

    const warnings = avertissementsIdentifiants({
      rib: dto.rib,
      iban: dto.iban,
      bic: dto.bic,
    });

    const etablissementIds = await this.filtrerEtablissementsDuCompte(
      societeId,
      dto.etablissementIds ?? []
    );

    const cree = await this.prisma.compteBancaire.create({
      data: {
        companyId: societeId,
        libelle: dto.libelle ?? null,
        banqueId: dto.banqueId ?? null,
        banqueSaisieLibre: dto.banqueSaisieLibre ?? null,
        rib: dto.rib ?? null,
        iban: dto.iban ?? null,
        bic: dto.bic ?? null,
        nomPayeur: dto.nomPayeur ?? null,
        usageSalaires: dto.usageSalaires ?? false,
        usageCotisationsSociales: dto.usageCotisationsSociales ?? false,
        usageIR: dto.usageIR ?? false,
        etablissements: {
          create: etablissementIds.map((etablissementId) => ({ etablissementId })),
        },
      },
      include: { etablissements: true },
    });

    await this.audit.record({
      userId: context.userId,
      action: 'CREER_COMPTE_BANCAIRE',
      targetType: 'CompteBancaire',
      targetId: cree.id,
    });

    return ok(toCompteBancaire(cree), warnings);
  }

  async modifier(
    id: Uuid,
    dto: ModifierCompteBancaireDto
  ): Promise<ApiResponse<CompteBancaire>> {
    const context = this.tenantContext.getOrThrow();
    const existant = await this.trouverOu404(id);
    assertPeutFaire(context, 'compte-bancaire.modifier', {
      companyId: existant.companyId,
    });

    assertChiffres(dto.rib ?? undefined, 'rib');
    const warnings = avertissementsIdentifiants({
      rib: dto.rib,
      iban: dto.iban,
      bic: dto.bic,
    });

    const maj = await this.prisma.$transaction(async (tx) => {
      if (dto.etablissementIds) {
        const ids = await this.filtrerEtablissementsDuCompte(
          existant.companyId,
          dto.etablissementIds
        );
        await tx.compteBancaireEtablissement.deleteMany({
          where: { compteBancaireId: id },
        });
        await tx.compteBancaireEtablissement.createMany({
          data: ids.map((etablissementId) => ({
            compteBancaireId: id,
            etablissementId,
          })),
        });
      }

      return tx.compteBancaire.update({
        where: { id },
        data: {
          libelle: dto.libelle,
          banqueId: dto.banqueId,
          banqueSaisieLibre: dto.banqueSaisieLibre,
          rib: dto.rib,
          iban: dto.iban,
          bic: dto.bic,
          nomPayeur: dto.nomPayeur,
          usageSalaires: dto.usageSalaires,
          usageCotisationsSociales: dto.usageCotisationsSociales,
          usageIR: dto.usageIR,
        },
        include: { etablissements: true },
      });
    });

    await this.audit.record({
      userId: context.userId,
      action: 'MODIFIER_COMPTE_BANCAIRE',
      targetType: 'CompteBancaire',
      targetId: id,
    });

    return ok(toCompteBancaire(maj), warnings);
  }

  async cloturer(id: Uuid): Promise<ApiResponse<CompteBancaire>> {
    const context = this.tenantContext.getOrThrow();
    const existant = await this.trouverOu404(id);
    assertPeutFaire(context, 'compte-bancaire.cloturer', {
      companyId: existant.companyId,
    });

    const maj = await this.prisma.compteBancaire.update({
      where: { id },
      data: { etat: 'CLOTURE' },
      include: { etablissements: true },
    });

    await this.audit.record({
      userId: context.userId,
      action: 'CLOTURER_COMPTE_BANCAIRE',
      targetType: 'CompteBancaire',
      targetId: id,
    });

    return ok(toCompteBancaire(maj));
  }

  async impactSuppression(
    id: Uuid
  ): Promise<ApiResponse<ImpactSuppressionCompteBancaire>> {
    const context = this.tenantContext.getOrThrow();
    const compte = await this.trouverOu404(id);
    assertPeutFaire(context, 'compte-bancaire.supprimer', {
      companyId: compte.companyId,
    });
    return ok(await this.calculerImpact(id));
  }

  async supprimer(
    id: Uuid,
    confirmationJeton: string | undefined
  ): Promise<ApiResponse<ResultatSuppression>> {
    const context = this.tenantContext.getOrThrow();
    const compte = await this.trouverOu404(id);
    assertPeutFaire(context, 'compte-bancaire.supprimer', {
      companyId: compte.companyId,
    });

    if (!confirmationJeton) {
      throw new BadRequestException({
        code: 'CONFIRMATION_REQUISE',
        message: 'La suppression exige le jeton d impact-suppression.',
      });
    }

    const impact = await this.calculerImpact(id);
    if (!jetonsIdentiques(impact.jetonConfirmation, confirmationJeton)) {
      throw new ConflictException({
        code: 'CONFIRMATION_OBSOLETE',
        message:
          'L inventaire a change depuis l apercu. Relancez GET .../impact-suppression.',
        impact,
      });
    }

    if (impact.utiliseParBulletin) {
      throw new ConflictException({
        code: 'SUPPRESSION_INTERDITE',
        message: 'Ce compte a ete utilise par un bulletin : cloturez-le plutot.',
      });
    }

    await this.prisma.compteBancaire.delete({ where: { id } });

    await this.audit.record({
      userId: context.userId,
      action: 'SUPPRIMER_COMPTE_BANCAIRE',
      targetType: 'CompteBancaire',
      targetId: id,
    });

    return ok({
      id,
      quantitesSupprimees: {
        compteBancaire: 1,
        etablissementsRattaches: impact.etablissementsRattaches,
      },
    });
  }

  private async calculerImpact(id: string): Promise<ImpactSuppressionCompteBancaire> {
    const etablissementsRattaches = await this.prisma.compteBancaireEtablissement.count({
      where: { compteBancaireId: id },
    });
    const inventaire = {
      etablissementsRattaches,
      utiliseParBulletin: compteBancaireUtiliseParBulletin(id),
    };
    return {
      ...inventaire,
      jetonConfirmation: calculerJetonConfirmation(inventaire),
    };
  }

  private async trouverOu404(id: string) {
    const context = this.tenantContext.getOrThrow();
    const compte = await this.prisma.compteBancaire.findFirst({
      where: {
        id,
        company: accountScope(context),
      },
      include: { etablissements: true },
    });
    if (!compte) {
      throw new NotFoundException(`Compte bancaire introuvable : ${id}`);
    }
    return compte;
  }

  private async assurerSociete(societeId: string) {
    const context = this.tenantContext.getOrThrow();
    const societe = await this.prisma.company.findFirst({
      where: { ...accountScope(context), id: societeId },
    });
    if (!societe) {
      throw new NotFoundException(`Societe introuvable : ${societeId}`);
    }
    return societe;
  }

  private async filtrerEtablissementsDuCompte(
    societeId: string,
    ids: string[]
  ): Promise<string[]> {
    if (ids.length === 0) return [];
    const context = this.tenantContext.getOrThrow();
    const trouvés = await this.prisma.etablissement.findMany({
      where: {
        companyId: societeId,
        accountId: accountScope(context).accountId,
        id: { in: ids },
      },
      select: { id: true },
    });
    return trouvés.map((e) => e.id);
  }
}
