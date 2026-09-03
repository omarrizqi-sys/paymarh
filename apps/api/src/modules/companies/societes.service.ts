import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ApiResponse,
  ApiWarning,
  ImpactSuppressionSociete,
  ListResponseAvecOperations,
  ResultatSuppression,
  RessourceAvecOperations,
  Societe,
  SocieteListe,
  Uuid,
} from '@paymarh/shared-types';
import { AuditService } from '../../common/audit/audit.service.js';
import { relancerConflitUnicite } from '../../common/errors/conflit-unicite.js';
import {
  operationsListeSocietes,
  operationsSociete,
} from '../../common/permissions/operations-ressource.js';
import { assertPeutFaire } from '../../common/permissions/peut-faire.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { accountScope } from '../../common/tenancy/tenant-scope.js';
import { ok } from './api-response.js';
import type {
  ChangerEtatSocieteDto,
  CreerSocieteDto,
  ModifierSocieteDto,
  ParametrageSocieteDto,
} from './dto/societe.dto.js';
import {
  societeADesBulletins,
  societeADesSalaries,
} from './gardes-metier.js';
import { resoudreLigneHistorique } from './historisation.js';
import { calculerJetonConfirmation, jetonsIdentiques } from './jeton-confirmation.js';
import { enrichirSociete } from './enrichir-operations.js';
import { toSociete } from './mappers.js';
import { PropagationTahfizService } from '../salaries/tahfiz/propagation-tahfiz.service.js';
import {
  assertAlphabetique,
  assertChiffres,
  assertMoisAAAA_MM,
  assertObligatoire,
  assertPresent,
  assertChampObligatoire,
  avertissementRaisonSocialeDoublon,
  avertissementRetourMontage,
  avertissementsIdentifiants,
  controlerCoherenceDossier,
  controlerDatesSociete,
  controlerExonerationOuErreur,
  ValidationBloquanteError,
} from './validation-fiche.js';

function relancerValidation(erreur: unknown): never {
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
export class SocietesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly audit: AuditService,
    private readonly tahfiz: PropagationTahfizService
  ) {}

  async lister(): Promise<ApiResponse<ListResponseAvecOperations<SocieteListe>>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.lire');

    const rows = await this.prisma.company.findMany({
      where: accountScope(context),
      orderBy: { raisonSociale: 'asc' },
      include: {
        _count: { select: { etablissements: true } },
      },
    });

    return ok({
      items: rows.map((row) => ({
        ...enrichirSociete(toSociete(row), operationsSociete(context, row.id)),
        nombreEtablissements: row._count.etablissements,
      })),
      total: rows.length,
      operations: operationsListeSocietes(context),
    });
  }

  async lire(id: Uuid): Promise<ApiResponse<RessourceAvecOperations<Societe>>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.lire', { companyId: id });
    const row = await this.trouverOu404(id);
    return ok(enrichirSociete(toSociete(row), operationsSociete(context, id)));
  }

  async creer(dto: CreerSocieteDto): Promise<ApiResponse<Societe>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.creer');
    const accountId = accountScope(context).accountId;

    try {
      assertObligatoire(dto.codeDossier, 'codeDossier');
      assertObligatoire(dto.raisonSociale, 'raisonSociale');
      assertObligatoire(dto.formeJuridiqueId, 'formeJuridiqueId');
      assertObligatoire(dto.etablissementPrincipal?.adresse, 'etablissementPrincipal.adresse');
      assertObligatoire(dto.etablissementPrincipal?.ville, 'etablissementPrincipal.ville');
      assertMoisAAAA_MM(dto.moisDebutMontage, 'moisDebutMontage');
      assertMoisAAAA_MM(dto.moisDebutProduction, 'moisDebutProduction');
      assertAlphabetique(dto.signatairePrenom, 'signatairePrenom');
      assertAlphabetique(dto.signataireNom, 'signataireNom');
      assertChiffres(dto.identifiantFiscal, 'identifiantFiscal');
      assertChiffres(dto.registreCommerce, 'registreCommerce');
      assertChiffres(dto.etablissementPrincipal.ice, 'ice');
      assertChiffres(dto.etablissementPrincipal.codePostal, 'codePostal');
      assertChampObligatoire(dto.matriculeLongueur, 'matriculeLongueur');
      assertPresent(dto.calculAutoAbsencesEntreesSorties, 'calculAutoAbsencesEntreesSorties');

      controlerCoherenceDossier({
        etatDossier: dto.etatDossier,
        moisDebutMontage: dto.moisDebutMontage,
        moisDebutProduction: dto.moisDebutProduction,
        dateInactivite: dto.dateInactivite ?? null,
      });

      const dateCreation = dto.dateCreation ? new Date(dto.dateCreation) : null;
      const dateCessation = dto.dateCessationActivite
        ? new Date(dto.dateCessationActivite)
        : null;
      controlerDatesSociete(dateCreation, dateCessation);
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const warnings: ApiWarning[] = [
      ...avertissementsIdentifiants({
        ice: dto.etablissementPrincipal.ice,
        codePostal: dto.etablissementPrincipal.codePostal,
        pays: dto.etablissementPrincipal.pays,
      }),
    ];

    const doublonRaison = await this.prisma.company.findFirst({
      where: { accountId, raisonSociale: dto.raisonSociale },
      select: { id: true },
    });
    if (doublonRaison) {
      warnings.push(avertissementRaisonSocialeDoublon());
    }

    const nomPrincipal =
      dto.etablissementPrincipal.nom?.trim() ||
      dto.etablissementPrincipal.ville.trim() ||
      dto.raisonSociale;

    let creee;
    try {
      creee = await this.prisma.$transaction(async (tx) => {
        const societe = await tx.company.create({
          data: {
            accountId,
            codeDossier: dto.codeDossier,
            raisonSociale: dto.raisonSociale,
            nomCommercial: dto.nomCommercial ?? null,
            formeJuridiqueId: dto.formeJuridiqueId,
            activiteExercee: dto.activiteExercee ?? null,
            identifiantFiscal: dto.identifiantFiscal ?? null,
            registreCommerce: dto.registreCommerce ?? null,
            tribunalRegistreCommerce: dto.tribunalRegistreCommerce ?? null,
            dateCreation: dto.dateCreation ? new Date(dto.dateCreation) : null,
            dateCessationActivite: dto.dateCessationActivite
              ? new Date(dto.dateCessationActivite)
              : null,
            siteWeb: dto.siteWeb ?? null,
            etatDossier: dto.etatDossier,
            moisDebutMontage: dto.moisDebutMontage,
            moisDebutProduction: dto.moisDebutProduction,
            dateInactivite: dto.dateInactivite ?? null,
            moisEnCours: dto.moisDebutMontage,
            signataireCivilite: dto.signataireCivilite ?? null,
            signatairePrenom: dto.signatairePrenom ?? null,
            signataireNom: dto.signataireNom ?? null,
            signataireQualite: dto.signataireQualite ?? null,
            matriculePrefixe: dto.matriculePrefixe ?? null,
            matriculeLongueur: dto.matriculeLongueur,
            matriculeGenerationAuto: dto.matriculeGenerationAuto ?? true,
            calculAutoAbsencesEntreesSorties: dto.calculAutoAbsencesEntreesSorties,
          },
        });

        await tx.etablissement.create({
          data: {
            companyId: societe.id,
            accountId,
            nom: nomPrincipal,
            estPrincipal: true,
            adresse: dto.etablissementPrincipal.adresse,
            complementAdresse: dto.etablissementPrincipal.complementAdresse ?? null,
            codePostal: dto.etablissementPrincipal.codePostal ?? null,
            ville: dto.etablissementPrincipal.ville,
            pays: dto.etablissementPrincipal.pays ?? 'MA',
            ice: dto.etablissementPrincipal.ice ?? null,
            taxeProfessionnelle: dto.etablissementPrincipal.taxeProfessionnelle ?? null,
            telephone: dto.etablissementPrincipal.telephone ?? null,
            email: dto.etablissementPrincipal.email ?? null,
          },
        });

        await tx.companyParametrageHistorique.create({
          data: {
            companyId: societe.id,
            moisEffet: societe.moisEnCours,
            moisClotureConges: 12,
          },
        });

        return societe;
      });
    } catch (erreur) {
      relancerConflitUnicite(erreur);
    }

    await this.audit.record({
      userId: context.userId,
      action: 'CREER_SOCIETE',
      targetType: 'Company',
      targetId: creee.id,
    });

    return ok(toSociete(creee), warnings);
  }

  async modifier(id: Uuid, dto: ModifierSocieteDto): Promise<ApiResponse<Societe>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.modifier', { companyId: id });
    const existante = await this.trouverOu404(id);

    try {
      if (dto.moisDebutMontage) assertMoisAAAA_MM(dto.moisDebutMontage, 'moisDebutMontage');
      if (dto.moisDebutProduction) assertMoisAAAA_MM(dto.moisDebutProduction, 'moisDebutProduction');
      assertAlphabetique(dto.signatairePrenom ?? undefined, 'signatairePrenom');
      assertAlphabetique(dto.signataireNom ?? undefined, 'signataireNom');
      assertAlphabetique(dto.tribunalRegistreCommerce ?? undefined, 'tribunalRegistreCommerce');
      assertChiffres(dto.identifiantFiscal ?? undefined, 'identifiantFiscal');
      assertChiffres(dto.registreCommerce ?? undefined, 'registreCommerce');
      if (dto.matriculeLongueur !== undefined) {
        assertChampObligatoire(dto.matriculeLongueur, 'matriculeLongueur');
      }
      if (dto.calculAutoAbsencesEntreesSorties !== undefined) {
        assertPresent(dto.calculAutoAbsencesEntreesSorties, 'calculAutoAbsencesEntreesSorties');
      }
      if (dto.regimeDeBase !== undefined && dto.regimeDeBase !== existante.regimeDeBase) {
        if (societeADesSalaries(id)) {
          throw new ValidationBloquanteError(
            'REGIME_BLOQUE',
            'Le regime de base ne peut plus etre modifie : des salaries existent dans la societe.',
            'regimeDeBase'
          );
        }
      }
      controlerCoherenceDossier({
        etatDossier: existante.etatDossier,
        moisDebutMontage: dto.moisDebutMontage ?? existante.moisDebutMontage,
        moisDebutProduction: dto.moisDebutProduction ?? existante.moisDebutProduction,
        dateInactivite: existante.dateInactivite,
      });
      controlerDatesSociete(
        dto.dateCreation !== undefined
          ? dto.dateCreation
            ? new Date(dto.dateCreation)
            : null
          : existante.dateCreation,
        dto.dateCessationActivite !== undefined
          ? dto.dateCessationActivite
            ? new Date(dto.dateCessationActivite)
            : null
          : existante.dateCessationActivite
      );
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const warnings: ApiWarning[] = [];
    if (dto.raisonSociale && dto.raisonSociale !== existante.raisonSociale) {
      const doublon = await this.prisma.company.findFirst({
        where: {
          accountId: existante.accountId,
          raisonSociale: dto.raisonSociale,
          NOT: { id },
        },
        select: { id: true },
      });
      if (doublon) warnings.push(avertissementRaisonSocialeDoublon());
    }

    let maj;
    try {
      maj = await this.prisma.company.update({
        where: { id },
        data: {
          codeDossier: dto.codeDossier,
          raisonSociale: dto.raisonSociale,
          nomCommercial: dto.nomCommercial,
          formeJuridiqueId: dto.formeJuridiqueId,
          activiteExercee: dto.activiteExercee,
          identifiantFiscal: dto.identifiantFiscal,
          registreCommerce: dto.registreCommerce,
          tribunalRegistreCommerce: dto.tribunalRegistreCommerce,
          dateCreation:
            dto.dateCreation === undefined
              ? undefined
              : dto.dateCreation
                ? new Date(dto.dateCreation)
                : null,
          dateCessationActivite:
            dto.dateCessationActivite === undefined
              ? undefined
              : dto.dateCessationActivite
                ? new Date(dto.dateCessationActivite)
                : null,
          siteWeb: dto.siteWeb,
          moisDebutMontage: dto.moisDebutMontage,
          moisDebutProduction: dto.moisDebutProduction,
          regimeDeBase: dto.regimeDeBase,
          signataireCivilite: dto.signataireCivilite,
          signatairePrenom: dto.signatairePrenom,
          signataireNom: dto.signataireNom,
          signataireQualite: dto.signataireQualite,
          matriculePrefixe: dto.matriculePrefixe,
          matriculeLongueur: dto.matriculeLongueur,
          matriculeGenerationAuto: dto.matriculeGenerationAuto,
          calculAutoAbsencesEntreesSorties: dto.calculAutoAbsencesEntreesSorties,
        },
      });
    } catch (erreur) {
      relancerConflitUnicite(erreur);
    }

    await this.audit.record({
      userId: context.userId,
      action: 'MODIFIER_SOCIETE',
      targetType: 'Company',
      targetId: id,
    });

    return ok(toSociete(maj), warnings);
  }

  async changerEtat(
    id: Uuid,
    dto: ChangerEtatSocieteDto
  ): Promise<ApiResponse<Societe>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.changer-etat', { companyId: id });
    const existante = await this.trouverOu404(id);

    try {
      controlerCoherenceDossier({
        etatDossier: dto.etatDossier,
        moisDebutMontage: existante.moisDebutMontage,
        moisDebutProduction: existante.moisDebutProduction,
        dateInactivite: dto.dateInactivite ?? null,
      });
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const warnings: ApiWarning[] = [];
    if (existante.etatDossier === 'EN_PRODUCTION' && dto.etatDossier === 'EN_MONTAGE') {
      warnings.push(avertissementRetourMontage());
    }

    const maj = await this.prisma.company.update({
      where: { id },
      data: {
        etatDossier: dto.etatDossier,
        dateInactivite: dto.etatDossier === 'INACTIVE' ? dto.dateInactivite : null,
      },
    });

    await this.audit.record({
      userId: context.userId,
      action: 'CHANGER_ETAT_SOCIETE',
      targetType: 'Company',
      targetId: id,
    });

    return ok(toSociete(maj), warnings);
  }

  async lireParametrage(id: Uuid, mois: string): Promise<ApiResponse<unknown>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.lire', { companyId: id });
    await this.trouverOu404(id);
    try {
      assertMoisAAAA_MM(mois, 'mois');
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const lignes = await this.prisma.companyParametrageHistorique.findMany({
      where: { companyId: id },
    });
    const applicable = resoudreLigneHistorique(lignes, mois);
    return ok(applicable);
  }

  async ecrireParametrage(
    id: Uuid,
    dto: ParametrageSocieteDto
  ): Promise<ApiResponse<unknown>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.modifier', { companyId: id });
    const societe = await this.trouverOu404(id);

    if ('moisEffet' in dto && (dto as { moisEffet?: unknown }).moisEffet !== undefined) {
      throw new BadRequestException({
        code: 'CHAMP_INTERDIT',
        message: 'moisEffet ne doit pas etre fourni : il est deduit du mois en cours.',
        champ: 'moisEffet',
      });
    }

    try {
      controlerExonerationOuErreur({
        typeExonerationId: dto.typeExonerationId ?? null,
        exonerationDateDebut: dto.exonerationDateDebut ?? null,
        exonerationDateFin: dto.exonerationDateFin ?? null,
      });
      assertChampObligatoire(dto.moisClotureConges, 'moisClotureConges');
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const moisEffet = societe.moisEnCours;

    const ligne = await this.prisma.$transaction(async (tx) => {
      const enregistree = await tx.companyParametrageHistorique.upsert({
        where: {
          companyId_moisEffet: { companyId: id, moisEffet },
        },
        create: {
          companyId: id,
          moisEffet,
          moisClotureConges: dto.moisClotureConges,
          typeExonerationId: dto.typeExonerationId ?? null,
          exonerationDateDebut: dto.exonerationDateDebut ?? null,
          exonerationDateFin: dto.exonerationDateFin ?? null,
        },
        update: {
          moisClotureConges: dto.moisClotureConges,
          typeExonerationId: dto.typeExonerationId,
          exonerationDateDebut: dto.exonerationDateDebut,
          exonerationDateFin: dto.exonerationDateFin,
        },
      });

      await this.tahfiz.synchroniserDansTransaction(
        tx,
        id,
        {
          typeExonerationId: enregistree.typeExonerationId,
          exonerationDateDebut: enregistree.exonerationDateDebut,
          exonerationDateFin: enregistree.exonerationDateFin,
        },
        moisEffet
      );
      return enregistree;
    });

    return ok(ligne);
  }

  async impactSuppression(id: Uuid): Promise<ApiResponse<ImpactSuppressionSociete>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.supprimer', { companyId: id });
    await this.trouverOu404(id);
    return ok(await this.calculerImpactSociete(id));
  }

  async supprimer(
    id: Uuid,
    confirmationJeton: string | undefined
  ): Promise<ApiResponse<ResultatSuppression>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.supprimer', { companyId: id });
    await this.trouverOu404(id);

    if (!confirmationJeton) {
      throw new BadRequestException({
        code: 'CONFIRMATION_REQUISE',
        message:
          'La suppression exige le jeton renvoye par GET /societes/:id/impact-suppression.',
      });
    }

    if (societeADesBulletins(id)) {
      throw new ConflictException({
        code: 'SUPPRESSION_INTERDITE',
        message: 'Cette societe ne peut pas etre supprimee.',
      });
    }

    const impact = await this.calculerImpactSociete(id);
    if (!jetonsIdentiques(impact.jetonConfirmation, confirmationJeton)) {
      throw new ConflictException({
        code: 'CONFIRMATION_OBSOLETE',
        message:
          'L inventaire a change depuis l apercu. Relancez GET .../impact-suppression puis confirmez a nouveau.',
        impact,
      });
    }

    await this.prisma.company.delete({ where: { id } });

    await this.audit.record({
      userId: context.userId,
      action: 'SUPPRIMER_SOCIETE',
      targetType: 'Company',
      targetId: id,
    });

    return ok({
      id,
      quantitesSupprimees: {
        etablissements: impact.etablissements,
        comptesBancaires: impact.comptesBancaires,
        parametragesHistoriquesSociete: impact.parametragesHistoriquesSociete,
        parametragesHistoriquesEtablissement: impact.parametragesHistoriquesEtablissement,
      },
    });
  }

  private async calculerImpactSociete(id: string): Promise<ImpactSuppressionSociete> {
    const etablissements = await this.prisma.etablissement.findMany({
      where: { companyId: id },
      select: { id: true },
    });
    const etablissementIds = etablissements.map((e) => e.id);

    const [
      comptesBancaires,
      parametragesHistoriquesSociete,
      parametragesHistoriquesEtablissement,
    ] = await Promise.all([
      this.prisma.compteBancaire.count({ where: { companyId: id } }),
      this.prisma.companyParametrageHistorique.count({ where: { companyId: id } }),
      etablissementIds.length === 0
        ? Promise.resolve(0)
        : this.prisma.etablissementParametrageHistorique.count({
            where: { etablissementId: { in: etablissementIds } },
          }),
    ]);

    const inventaire = {
      etablissements: etablissements.length,
      comptesBancaires,
      parametragesHistoriquesSociete,
      parametragesHistoriquesEtablissement,
    };

    return {
      ...inventaire,
      jetonConfirmation: calculerJetonConfirmation(inventaire),
    };
  }

  private async trouverOu404(id: string) {
    const context = this.tenantContext.getOrThrow();
    const row = await this.prisma.company.findFirst({
      where: { ...accountScope(context), id },
    });
    if (!row) {
      throw new NotFoundException(`Societe introuvable : ${id}`);
    }
    return row;
  }
}
