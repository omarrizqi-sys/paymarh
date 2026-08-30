import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from 'decimal.js';
import type {
  ApiResponse,
  Etablissement,
  ImpactSuppressionEtablissement,
  ListResponseAvecOperations,
  ResultatSuppression,
  RessourceAvecOperations,
  Uuid,
} from '@paymarh/shared-types';
import { AuditService } from '../../common/audit/audit.service.js';
import { relancerConflitUnicite } from '../../common/errors/conflit-unicite.js';
import { operationsEtablissement } from '../../common/permissions/operations-ressource.js';
import { assertPeutFaire } from '../../common/permissions/peut-faire.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { accountScope } from '../../common/tenancy/tenant-scope.js';
import { ok } from './api-response.js';
import type {
  CreerEtablissementDto,
  ModifierEtablissementDto,
  ParametrageEtablissementDto,
} from './dto/etablissement-compte.dto.js';
import { etablissementADesSalaries } from './gardes-metier.js';
import { resoudreLigneHistorique } from './historisation.js';
import { calculerJetonConfirmation, jetonsIdentiques } from './jeton-confirmation.js';
import { enrichirEtablissement } from './enrichir-operations.js';
import { toEtablissement } from './mappers.js';
import {
  assertChiffres,
  assertObligatoire,
  avertissementsIdentifiants,
  ValidationBloquanteError,
} from './validation-fiche.js';

function relancer(erreur: unknown): never {
  if (erreur instanceof ValidationBloquanteError) {
    throw new BadRequestException({
      code: erreur.code,
      message: erreur.message,
      champ: erreur.champ,
    });
  }
  throw erreur;
}

@Injectable()
export class EtablissementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly audit: AuditService
  ) {}

  async lister(
    societeId: Uuid
  ): Promise<ApiResponse<ListResponseAvecOperations<Etablissement>>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'etablissement.lire', { companyId: societeId });
    await this.assurerSocieteDuCompte(societeId);

    const ops = operationsEtablissement(context, societeId);
    const rows = await this.prisma.etablissement.findMany({
      where: { companyId: societeId, accountId: accountScope(context).accountId },
      orderBy: [{ estPrincipal: 'desc' }, { nom: 'asc' }],
    });
    return ok({
      items: rows.map((row) =>
        enrichirEtablissement(toEtablissement(row), operationsEtablissement(context, societeId))
      ),
      total: rows.length,
      operations: ops,
    });
  }

  async lire(id: Uuid): Promise<ApiResponse<RessourceAvecOperations<Etablissement>>> {
    const context = this.tenantContext.getOrThrow();
    const row = await this.trouverOu404(id);
    assertPeutFaire(context, 'etablissement.lire', { companyId: row.companyId });
    return ok(
      enrichirEtablissement(toEtablissement(row), operationsEtablissement(context, row.companyId))
    );
  }

  async creer(
    societeId: Uuid,
    dto: CreerEtablissementDto
  ): Promise<ApiResponse<Etablissement>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'etablissement.creer', { companyId: societeId });
    const societe = await this.assurerSocieteDuCompte(societeId);

    try {
      assertObligatoire(dto.nom, 'nom');
      assertObligatoire(dto.adresse, 'adresse');
      assertObligatoire(dto.ville, 'ville');
      assertChiffres(dto.ice, 'ice');
      assertChiffres(dto.codePostal, 'codePostal');
    } catch (erreur) {
      relancer(erreur);
    }

    const warnings = avertissementsIdentifiants({
      ice: dto.ice,
      codePostal: dto.codePostal,
      pays: dto.pays,
    });

    let cree;
    try {
      cree = await this.prisma.etablissement.create({
        data: {
          companyId: societeId,
          accountId: societe.accountId,
          nom: dto.nom,
          estPrincipal: false,
          adresse: dto.adresse,
          complementAdresse: dto.complementAdresse ?? null,
          codePostal: dto.codePostal ?? null,
          ville: dto.ville,
          pays: dto.pays ?? 'MA',
          ice: dto.ice ?? null,
          taxeProfessionnelle: dto.taxeProfessionnelle ?? null,
          telephone: dto.telephone ?? null,
          email: dto.email ?? null,
        },
      });
    } catch (erreur) {
      relancerConflitUnicite(erreur);
    }

    // E6 : les RIB existants restent sur l etablissement d origine — aucun rattachement auto.

    await this.audit.record({
      userId: context.userId,
      action: 'CREER_ETABLISSEMENT',
      targetType: 'Etablissement',
      targetId: cree.id,
    });

    return ok(toEtablissement(cree), warnings);
  }

  async modifier(
    id: Uuid,
    dto: ModifierEtablissementDto
  ): Promise<ApiResponse<Etablissement>> {
    const context = this.tenantContext.getOrThrow();
    const existant = await this.trouverOu404(id);
    assertPeutFaire(context, 'etablissement.modifier', { companyId: existant.companyId });

    try {
      if (dto.nom !== undefined) assertObligatoire(dto.nom, 'nom');
      if (dto.adresse !== undefined) assertObligatoire(dto.adresse, 'adresse');
      if (dto.ville !== undefined) assertObligatoire(dto.ville, 'ville');
      assertChiffres(dto.ice ?? undefined, 'ice');
    } catch (erreur) {
      relancer(erreur);
    }

    const warnings = avertissementsIdentifiants({
      ice: dto.ice,
      codePostal: dto.codePostal,
      pays: dto.pays ?? existant.pays,
    });

    let maj;
    try {
      maj = await this.prisma.etablissement.update({
        where: { id },
        data: {
          nom: dto.nom,
          adresse: dto.adresse,
          ville: dto.ville,
          complementAdresse: dto.complementAdresse,
          codePostal: dto.codePostal,
          pays: dto.pays,
          ice: dto.ice,
          taxeProfessionnelle: dto.taxeProfessionnelle,
          telephone: dto.telephone,
          email: dto.email,
        },
      });
    } catch (erreur) {
      relancerConflitUnicite(erreur);
    }

    await this.audit.record({
      userId: context.userId,
      action: 'MODIFIER_ETABLISSEMENT',
      targetType: 'Etablissement',
      targetId: id,
    });

    return ok(toEtablissement(maj), warnings);
  }

  async designerPrincipal(id: Uuid): Promise<ApiResponse<Etablissement>> {
    const context = this.tenantContext.getOrThrow();
    const cible = await this.trouverOu404(id);
    assertPeutFaire(context, 'etablissement.designer-principal', {
      companyId: cible.companyId,
    });

    if (cible.estPrincipal) {
      return ok(toEtablissement(cible));
    }

    const maj = await this.prisma.$transaction(async (tx) => {
      await tx.etablissement.updateMany({
        where: { companyId: cible.companyId, estPrincipal: true },
        data: { estPrincipal: false },
      });
      return tx.etablissement.update({
        where: { id },
        data: { estPrincipal: true },
      });
    });

    await this.audit.record({
      userId: context.userId,
      action: 'DESIGNER_ETABLISSEMENT_PRINCIPAL',
      targetType: 'Etablissement',
      targetId: id,
    });

    return ok(toEtablissement(maj));
  }

  async lireParametrage(id: Uuid, mois: string): Promise<ApiResponse<unknown>> {
    const context = this.tenantContext.getOrThrow();
    const etab = await this.trouverOu404(id);
    assertPeutFaire(context, 'etablissement.lire', { companyId: etab.companyId });

    const lignes = await this.prisma.etablissementParametrageHistorique.findMany({
      where: { etablissementId: id },
      include: {
        horaireDefautLignes: true,
        horaireMensuelLignes: true,
        joursFeriesTravailles: true,
      },
    });
    return ok(resoudreLigneHistorique(lignes, mois));
  }

  async ecrireParametrage(
    id: Uuid,
    dto: ParametrageEtablissementDto
  ): Promise<ApiResponse<unknown>> {
    const context = this.tenantContext.getOrThrow();
    const etab = await this.trouverOu404(id);
    assertPeutFaire(context, 'etablissement.modifier', { companyId: etab.companyId });

    if ('moisEffet' in dto && (dto as { moisEffet?: unknown }).moisEffet !== undefined) {
      throw new BadRequestException({
        code: 'CHAMP_INTERDIT',
        message: 'moisEffet ne doit pas etre fourni.',
        champ: 'moisEffet',
      });
    }

    const societe = await this.prisma.company.findFirstOrThrow({
      where: { id: etab.companyId },
    });
    const moisEffet = societe.moisEnCours;

    const ligne = await this.prisma.$transaction(async (tx) => {
      const param = await tx.etablissementParametrageHistorique.upsert({
        where: {
          etablissementId_moisEffet: { etablissementId: id, moisEffet },
        },
        create: {
          etablissementId: id,
          moisEffet,
          dureeHebdomadaire: dto.dureeHebdomadaire
            ? new Decimal(dto.dureeHebdomadaire)
            : new Decimal(44),
          jourReposHebdomadaire: dto.jourReposHebdomadaire ?? 'DIMANCHE',
          teletravailAutorise: dto.teletravailAutorise ?? null,
          indemniteTeletravailVersee: dto.indemniteTeletravailVersee ?? null,
          montantIndemniteTeletravail: dto.montantIndemniteTeletravail
            ? new Decimal(dto.montantIndemniteTeletravail)
            : null,
        },
        update: {
          dureeHebdomadaire: dto.dureeHebdomadaire
            ? new Decimal(dto.dureeHebdomadaire)
            : undefined,
          jourReposHebdomadaire: dto.jourReposHebdomadaire,
          teletravailAutorise: dto.teletravailAutorise,
          indemniteTeletravailVersee: dto.indemniteTeletravailVersee,
          montantIndemniteTeletravail:
            dto.montantIndemniteTeletravail === undefined
              ? undefined
              : dto.montantIndemniteTeletravail
                ? new Decimal(dto.montantIndemniteTeletravail)
                : null,
        },
      });

      if (dto.horaireDefautLignes) {
        await tx.horaireDefautLigne.deleteMany({
          where: { etablissementParametrageHistoriqueId: param.id },
        });
        for (const ligneH of dto.horaireDefautLignes) {
          await tx.horaireDefautLigne.create({
            data: {
              etablissementParametrageHistoriqueId: param.id,
              jourSemaine: ligneH.jourSemaine,
              typeHeureId: ligneH.typeHeureId,
              nombreHeures: new Decimal(ligneH.nombreHeures),
            },
          });
        }
      }

      if (dto.horaireMensuelLignes) {
        await tx.horaireMensuelLigne.deleteMany({
          where: { etablissementParametrageHistoriqueId: param.id },
        });
        for (const ligneM of dto.horaireMensuelLignes) {
          await tx.horaireMensuelLigne.create({
            data: {
              etablissementParametrageHistoriqueId: param.id,
              typeHeureId: ligneM.typeHeureId,
              nombreHeures: new Decimal(ligneM.nombreHeures),
            },
          });
        }
      }

      if (dto.joursFeriesTravaillesIds) {
        await tx.jourFerieTravaille.deleteMany({
          where: { etablissementParametrageHistoriqueId: param.id },
        });
        for (const jourFerieId of dto.joursFeriesTravaillesIds) {
          await tx.jourFerieTravaille.create({
            data: {
              etablissementParametrageHistoriqueId: param.id,
              jourFerieId,
            },
          });
        }
      }

      return tx.etablissementParametrageHistorique.findUniqueOrThrow({
        where: { id: param.id },
        include: {
          horaireDefautLignes: true,
          horaireMensuelLignes: true,
          joursFeriesTravailles: true,
        },
      });
    });

    return ok(ligne);
  }

  async impactSuppression(
    id: Uuid
  ): Promise<ApiResponse<ImpactSuppressionEtablissement>> {
    const context = this.tenantContext.getOrThrow();
    const etab = await this.trouverOu404(id);
    assertPeutFaire(context, 'etablissement.supprimer', { companyId: etab.companyId });
    return ok(await this.calculerImpact(id));
  }

  async supprimer(
    id: Uuid,
    confirmationJeton: string | undefined
  ): Promise<ApiResponse<ResultatSuppression>> {
    const context = this.tenantContext.getOrThrow();
    const etab = await this.trouverOu404(id);
    assertPeutFaire(context, 'etablissement.supprimer', { companyId: etab.companyId });

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

    if (impact.estPrincipal) {
      throw new ConflictException({
        code: 'SUPPRESSION_INTERDITE',
        message: 'L etablissement principal ne peut pas etre supprime.',
      });
    }

    if (etablissementADesSalaries(id)) {
      throw new ConflictException({
        code: 'SUPPRESSION_INTERDITE',
        message: 'Cet etablissement ne peut pas etre supprime.',
      });
    }

    const rattaches = impact.comptesBancairesRattaches.length;

    await this.prisma.$transaction(async (tx) => {
      await tx.compteBancaireEtablissement.deleteMany({
        where: { etablissementId: id },
      });
      await tx.etablissement.delete({ where: { id } });
    });

    await this.audit.record({
      userId: context.userId,
      action: 'SUPPRIMER_ETABLISSEMENT',
      targetType: 'Etablissement',
      targetId: id,
    });

    return ok({
      id,
      quantitesSupprimees: {
        etablissement: 1,
        liaisonsComptesBancairesDetachees: rattaches,
        parametragesHistoriques: impact.parametragesHistoriques,
      },
    });
  }

  private async calculerImpact(id: string): Promise<ImpactSuppressionEtablissement> {
    const etab = await this.prisma.etablissement.findFirstOrThrow({ where: { id } });
    const liaisons = await this.prisma.compteBancaireEtablissement.findMany({
      where: { etablissementId: id },
      include: { compteBancaire: { select: { id: true, libelle: true } } },
    });
    const parametragesHistoriques = await this.prisma.etablissementParametrageHistorique.count({
      where: { etablissementId: id },
    });

    const inventaire = {
      estPrincipal: etab.estPrincipal,
      comptesBancairesRattaches: liaisons.map((l) => ({
        id: l.compteBancaire.id,
        libelle: l.compteBancaire.libelle,
      })),
      parametragesHistoriques,
    };

    return {
      ...inventaire,
      jetonConfirmation: calculerJetonConfirmation(inventaire),
    };
  }

  private async trouverOu404(id: string) {
    const context = this.tenantContext.getOrThrow();
    const row = await this.prisma.etablissement.findFirst({
      where: { id, accountId: accountScope(context).accountId },
    });
    if (!row) {
      throw new NotFoundException(`Etablissement introuvable : ${id}`);
    }
    return row;
  }

  private async assurerSocieteDuCompte(societeId: string) {
    const context = this.tenantContext.getOrThrow();
    const societe = await this.prisma.company.findFirst({
      where: { ...accountScope(context), id: societeId },
    });
    if (!societe) {
      throw new NotFoundException(`Societe introuvable : ${societeId}`);
    }
    return societe;
  }
}
