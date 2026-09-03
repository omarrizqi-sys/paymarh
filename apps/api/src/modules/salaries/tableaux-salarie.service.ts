import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AlerteApi } from '@paymarh/shared-types';
import { Decimal } from 'decimal.js';
import { calculerJetonConfirmation, jetonsIdentiques } from '../companies/jeton-confirmation.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { companyScope } from '../../common/tenancy/tenant-scope.js';
import { BULLETIN_PORT, type BulletinPort } from './bulletin/bulletin.port.js';
import type {
  CreerPersonneAChargeDto,
  CreerPretDto,
  CreerSaisieSurSalaireDto,
  ModifierPersonneAChargeDto,
  ModifierPretDto,
  ModifierSaisieSurSalaireDto,
  RemplacerComptesBancairesDto,
} from './dto/tableaux-salarie.dto.js';
import { EmploisService } from './emplois.service.js';
import { HistorisationLigneTemporelleService } from './historisation-ligne-temporelle.service.js';
import {
  INCLUDE_COLLECTIONS_SALARIE,
  mapperCollectionsSalarie,
} from './mappers/tableaux.mapper.js';
import { INCLUDE_FICHE_SALARIE, versFicheSalarie } from './mappers/salarie.mapper.js';
import { MoisEnCoursService } from './mois-en-cours/mois-en-cours.service.js';
import {
  REFERENTIEL_NATIONAL_PORT,
  type ReferentielNationalPort,
} from './referentiel-national/referentiel-national.port.js';
import { CODES_REPONSE } from './reponses/codes-reponse.js';
import { okEcriture } from './reponses/enveloppe-ecriture.js';
import {
  assertMontantMensuelSaisie,
  assertPartVirement,
  collecterAlerteBanqueIncoherente,
  collecterAlerteEnfantAge,
  collecterAlertePersonneDoublon,
  collecterAlertePretIncoherent,
  collecterAlerteRibDejaUtilise,
  collecterAlertesIdentifiantsBancaires,
  refuserChampMoisEffet,
  refuserSituationHandicapConjoint,
  resoudreBanqueDepuisRib,
  ValidationBloquanteTableauError,
  validerAlphabetiquePersonne,
  validerRibCompte,
} from './validation-tableaux-salarie.js';
import { VerrouillageOptimisteService } from './verrouillage/verrouillage-optimiste.service.js';

const MESSAGE_NEUTRE = 'Ressource introuvable.';

function versDate(valeur: string): Date {
  return new Date(valeur);
}

function relancerValidation(erreur: unknown): never {
  if (erreur instanceof ValidationBloquanteTableauError) {
    throw new BadRequestException({
      code: erreur.code,
      message: erreur.message,
      champ: erreur.champ,
    });
  }
  throw erreur;
}

@Injectable()
export class TableauxSalarieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly moisEnCours: MoisEnCoursService,
    private readonly verrouillage: VerrouillageOptimisteService,
    private readonly historisation: HistorisationLigneTemporelleService,
    private readonly emplois: EmploisService,
    @Inject(BULLETIN_PORT) private readonly bulletins: BulletinPort,
    @Inject(REFERENTIEL_NATIONAL_PORT) private readonly referentiel: ReferentielNationalPort
  ) {}

  async creerPersonneACharge(
    salarieId: string,
    dto: CreerPersonneAChargeDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffet(dto);
    refuserSituationHandicapConjoint(dto.lienParenteCode, dto.situationHandicap);
    validerAlphabetiquePersonne(dto.prenom, dto.nom);

    const salarie = await this.trouverSalarie(salarieId);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);
    const dateNaissance = versDate(dto.dateNaissance);
    const situationHandicap =
      dto.lienParenteCode === 'ENFANT' ? (dto.situationHandicap ?? false) : false;

    const alertes = await this.alertesPersonneACharge(salarie, salarieId, moisEnCours, {
      nom: dto.nom,
      prenom: dto.prenom,
      dateNaissance,
      lienParenteCode: dto.lienParenteCode,
      situationHandicap,
    });

    await this.prisma.personneACharge.create({
      data: {
        salarieId,
        lienParenteCode: dto.lienParenteCode,
        prenom: dto.prenom,
        nom: dto.nom,
        sexe: dto.sexe,
        dateNaissance,
        aCharge: dto.aCharge,
        situationHandicap,
        moisEffetDebut: moisEnCours,
        moisEffetFin: null,
      },
    });

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId, alertes);
  }

  async modifierPersonneACharge(
    salarieId: string,
    ligneId: string,
    dto: ModifierPersonneAChargeDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffet(dto);
    const existante = await this.trouverPersonneACharge(salarieId, ligneId);
    const lienParente = dto.lienParenteCode ?? existante.lienParenteCode;
    refuserSituationHandicapConjoint(lienParente, dto.situationHandicap);

    const fusion = {
      lienParenteCode: lienParente,
      prenom: dto.prenom ?? existante.prenom,
      nom: dto.nom ?? existante.nom,
      sexe: dto.sexe ?? existante.sexe,
      dateNaissance: dto.dateNaissance ? versDate(dto.dateNaissance) : existante.dateNaissance,
      aCharge: dto.aCharge ?? existante.aCharge,
      situationHandicap:
        lienParente === 'ENFANT' ? (dto.situationHandicap ?? existante.situationHandicap) : false,
    };

    validerAlphabetiquePersonne(fusion.prenom, fusion.nom);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);
    const salarie = await this.trouverSalarie(salarieId);

    const alertes = await this.alertesPersonneACharge(salarie, salarieId, moisEnCours, {
      ...fusion,
      id: ligneId,
    });

    const mode = await this.historisation.deciderModification(salarieId, moisEnCours);

    if (mode === 'ecraser') {
      await this.prisma.personneACharge.update({
        where: { id: ligneId },
        data: fusion,
      });
    } else {
      const moisFin = this.historisation.moisFinClotureLigneRemplacee(moisEnCours);
      await this.prisma.$transaction(async (tx) => {
        await tx.personneACharge.update({
          where: { id: ligneId },
          data: { moisEffetFin: moisFin },
        });
        await tx.personneACharge.create({
          data: {
            salarieId,
            ...fusion,
            moisEffetDebut: moisEnCours,
            moisEffetFin: null,
          },
        });
      });
    }

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId, alertes);
  }

  async impactSuppressionPersonneACharge(salarieId: string, ligneId: string) {
    const ligne = await this.trouverPersonneACharge(salarieId, ligneId);
    const mode = await this.historisation.deciderSuppression(salarieId, ligne);
    const inventaire = {
      salarieId,
      ligneId,
      mode,
      message:
        mode === 'inactiver'
          ? 'La ligne sera close et restera visible en etat inactive pour justifier les bulletins passes.'
          : 'La ligne sera supprimee definitivement.',
    };
    return {
      donnees: {
        ...inventaire,
        jetonConfirmation: calculerJetonConfirmation(inventaire),
      },
    };
  }

  async supprimerPersonneACharge(
    salarieId: string,
    ligneId: string,
    confirmationJeton: string | undefined,
    versionAttendue: number
  ) {
    const ligne = await this.trouverPersonneACharge(salarieId, ligneId);
    await this.exigerJetonSuppression(salarieId, ligneId, ligne, confirmationJeton);

    const mode = await this.historisation.deciderSuppression(salarieId, ligne);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);

    if (mode === 'supprimer') {
      await this.prisma.personneACharge.delete({ where: { id: ligneId } });
    } else {
      await this.prisma.personneACharge.update({
        where: { id: ligneId },
        data: { moisEffetFin: this.historisation.moisFinSuppressionLigneUtilisee(moisEnCours) },
      });
    }

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId);
  }

  async remplacerComptesBancaires(
    salarieId: string,
    dto: RemplacerComptesBancairesDto,
    versionAttendue: number
  ) {
    const salarie = await this.trouverSalarie(salarieId);
    try {
      assertPartVirement(dto.comptes);
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const alertes: AlerteApi[] = [];
    const donneesComptes: {
      id?: string;
      banqueId: string | null;
      banqueLibreSaisie: string | null;
      rib: string | null;
      iban: string | null;
      bic: string | null;
      titulaire: string | null;
      partVirement: Decimal | null;
    }[] = [];

    for (const compte of dto.comptes) {
      validerRibCompte(compte.rib);
      alertes.push(...collecterAlertesIdentifiantsBancaires(compte));
      const banqueId = await resoudreBanqueDepuisRib(this.prisma, compte.rib, compte.banqueId);
      const alerteBanque = await collecterAlerteBanqueIncoherente(
        this.prisma,
        banqueId,
        compte.rib
      );
      if (alerteBanque !== null) alertes.push(alerteBanque);
      const alerteRib = await collecterAlerteRibDejaUtilise(
        this.prisma,
        salarie.companyId,
        compte.rib,
        compte.id
      );
      if (alerteRib !== null) alertes.push(alerteRib);

      donneesComptes.push({
        id: compte.id,
        banqueId,
        banqueLibreSaisie: compte.banqueLibreSaisie ?? null,
        rib: compte.rib ?? null,
        iban: compte.iban ?? null,
        bic: compte.bic ?? null,
        titulaire: compte.titulaire ?? null,
        partVirement:
          dto.comptes.length === 1
            ? null
            : compte.partVirement !== null && compte.partVirement !== undefined
              ? new Decimal(compte.partVirement)
              : null,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      const idsConserves = donneesComptes
        .map((c) => c.id)
        .filter((id): id is string => id !== undefined);

      await tx.compteBancaireSalarie.deleteMany({
        where: {
          salarieId,
          ...(idsConserves.length > 0 ? { id: { notIn: idsConserves } } : {}),
        },
      });

      for (const compte of donneesComptes) {
        const payload = {
          banqueId: compte.banqueId,
          banqueLibreSaisie: compte.banqueLibreSaisie,
          rib: compte.rib,
          iban: compte.iban,
          bic: compte.bic,
          titulaire: compte.titulaire,
          partVirement: compte.partVirement,
        };
        if (compte.id !== undefined) {
          await tx.compteBancaireSalarie.update({
            where: { id: compte.id },
            data: payload,
          });
        } else {
          await tx.compteBancaireSalarie.create({
            data: { salarieId, ...payload },
          });
        }
      }
    });

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId, alertes);
  }

  async creerPret(salarieId: string, dto: CreerPretDto, versionAttendue: number) {
    refuserChampMoisEffet(dto);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);
    const montantTotal = new Decimal(dto.montantTotal);
    const mensualite = new Decimal(dto.mensualite);

    const alertes: AlerteApi[] = [];
    const alertePret = collecterAlertePretIncoherent(montantTotal, mensualite, dto.nombreEcheances);
    if (alertePret !== null) alertes.push(alertePret);

    await this.prisma.pret.create({
      data: {
        salarieId,
        libelleObjet: dto.libelleObjet,
        libelleBulletin: dto.libelleBulletin,
        montantTotal,
        moisDebut: dto.moisDebut,
        mensualite,
        nombreEcheances: dto.nombreEcheances,
        moisEffetDebut: moisEnCours,
        moisEffetFin: null,
      },
    });

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId, alertes);
  }

  async modifierPret(
    salarieId: string,
    ligneId: string,
    dto: ModifierPretDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffet(dto);
    const existant = await this.trouverPret(salarieId, ligneId);
    const montantTotal =
      dto.montantTotal !== undefined ? new Decimal(dto.montantTotal) : existant.montantTotal;
    const mensualite =
      dto.mensualite !== undefined ? new Decimal(dto.mensualite) : existant.mensualite;
    const nombreEcheances = dto.nombreEcheances ?? existant.nombreEcheances;

    const fusion = {
      libelleObjet: dto.libelleObjet ?? existant.libelleObjet,
      libelleBulletin: dto.libelleBulletin ?? existant.libelleBulletin,
      montantTotal,
      moisDebut: dto.moisDebut ?? existant.moisDebut,
      mensualite,
      nombreEcheances,
    };

    const alertes: AlerteApi[] = [];
    const alertePret = collecterAlertePretIncoherent(
      fusion.montantTotal,
      fusion.mensualite,
      fusion.nombreEcheances
    );
    if (alertePret !== null) alertes.push(alertePret);

    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);
    const mode = await this.historisation.deciderModification(salarieId, moisEnCours);

    if (mode === 'ecraser') {
      await this.prisma.pret.update({ where: { id: ligneId }, data: fusion });
    } else {
      const moisFin = this.historisation.moisFinClotureLigneRemplacee(moisEnCours);
      await this.prisma.$transaction(async (tx) => {
        await tx.pret.update({
          where: { id: ligneId },
          data: { moisEffetFin: moisFin },
        });
        await tx.pret.create({
          data: {
            salarieId,
            ...fusion,
            moisEffetDebut: moisEnCours,
            moisEffetFin: null,
          },
        });
      });
    }

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId, alertes);
  }

  async impactSuppressionPret(salarieId: string, ligneId: string) {
    const ligne = await this.trouverPret(salarieId, ligneId);
    return this.impactSuppressionTemporelle(salarieId, ligneId, ligne);
  }

  async supprimerPret(
    salarieId: string,
    ligneId: string,
    confirmationJeton: string | undefined,
    versionAttendue: number
  ) {
    const ligne = await this.trouverPret(salarieId, ligneId);
    await this.exigerJetonSuppression(salarieId, ligneId, ligne, confirmationJeton);

    const mode = await this.historisation.deciderSuppression(salarieId, ligne);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);

    if (mode === 'supprimer') {
      await this.prisma.pret.delete({ where: { id: ligneId } });
    } else {
      await this.prisma.pret.update({
        where: { id: ligneId },
        data: { moisEffetFin: this.historisation.moisFinSuppressionLigneUtilisee(moisEnCours) },
      });
    }

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId);
  }

  async creerSaisieSurSalaire(
    salarieId: string,
    dto: CreerSaisieSurSalaireDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffet(dto);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);
    const montantTotal = new Decimal(dto.montantTotal);
    const montantMensuel = new Decimal(dto.montantMensuel);

    try {
      assertMontantMensuelSaisie(montantMensuel, montantTotal);
    } catch (erreur) {
      relancerValidation(erreur);
    }

    await this.prisma.saisieSurSalaire.create({
      data: {
        salarieId,
        referenceDecision: dto.referenceDecision,
        creancier: dto.creancier,
        libelleBulletin: dto.libelleBulletin,
        montantTotal,
        montantMensuel,
        moisDebut: dto.moisDebut,
        moisEffetDebut: moisEnCours,
        moisEffetFin: null,
      },
    });

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId);
  }

  async modifierSaisieSurSalaire(
    salarieId: string,
    ligneId: string,
    dto: ModifierSaisieSurSalaireDto,
    versionAttendue: number
  ) {
    refuserChampMoisEffet(dto);
    const existant = await this.trouverSaisie(salarieId, ligneId);
    const montantTotal =
      dto.montantTotal !== undefined ? new Decimal(dto.montantTotal) : existant.montantTotal;
    const montantMensuel =
      dto.montantMensuel !== undefined ? new Decimal(dto.montantMensuel) : existant.montantMensuel;

    try {
      assertMontantMensuelSaisie(montantMensuel, montantTotal);
    } catch (erreur) {
      relancerValidation(erreur);
    }

    const fusion = {
      referenceDecision: dto.referenceDecision ?? existant.referenceDecision,
      creancier: dto.creancier ?? existant.creancier,
      libelleBulletin: dto.libelleBulletin ?? existant.libelleBulletin,
      montantTotal,
      montantMensuel,
      moisDebut: dto.moisDebut ?? existant.moisDebut,
    };

    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);
    const mode = await this.historisation.deciderModification(salarieId, moisEnCours);

    if (mode === 'ecraser') {
      await this.prisma.saisieSurSalaire.update({ where: { id: ligneId }, data: fusion });
    } else {
      const moisFin = this.historisation.moisFinClotureLigneRemplacee(moisEnCours);
      await this.prisma.$transaction(async (tx) => {
        await tx.saisieSurSalaire.update({
          where: { id: ligneId },
          data: { moisEffetFin: moisFin },
        });
        await tx.saisieSurSalaire.create({
          data: {
            salarieId,
            ...fusion,
            moisEffetDebut: moisEnCours,
            moisEffetFin: null,
          },
        });
      });
    }

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId);
  }

  async impactSuppressionSaisie(salarieId: string, ligneId: string) {
    const ligne = await this.trouverSaisie(salarieId, ligneId);
    return this.impactSuppressionTemporelle(salarieId, ligneId, ligne);
  }

  async supprimerSaisie(
    salarieId: string,
    ligneId: string,
    confirmationJeton: string | undefined,
    versionAttendue: number
  ) {
    const ligne = await this.trouverSaisie(salarieId, ligneId);
    await this.exigerJetonSuppression(salarieId, ligneId, ligne, confirmationJeton);

    const mode = await this.historisation.deciderSuppression(salarieId, ligne);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);

    if (mode === 'supprimer') {
      await this.prisma.saisieSurSalaire.delete({ where: { id: ligneId } });
    } else {
      await this.prisma.saisieSurSalaire.update({
        where: { id: ligneId },
        data: { moisEffetFin: this.historisation.moisFinSuppressionLigneUtilisee(moisEnCours) },
      });
    }

    await this.verrouillage.modifierSalarie({ id: salarieId, versionAttendue, donnees: {} });
    return this.reponseFiche(salarieId);
  }

  private async impactSuppressionTemporelle(
    salarieId: string,
    ligneId: string,
    ligne: { moisEffetDebut: string; moisEffetFin: string | null }
  ) {
    const mode = await this.historisation.deciderSuppression(salarieId, ligne);
    const inventaire = {
      salarieId,
      ligneId,
      mode,
      message:
        mode === 'inactiver'
          ? 'La ligne sera close et restera visible en etat inactive pour justifier les bulletins passes.'
          : 'La ligne sera supprimee definitivement.',
    };
    return {
      donnees: {
        ...inventaire,
        jetonConfirmation: calculerJetonConfirmation(inventaire),
      },
    };
  }

  private async exigerJetonSuppression(
    salarieId: string,
    ligneId: string,
    ligne: { moisEffetDebut: string; moisEffetFin: string | null },
    confirmationJeton: string | undefined
  ) {
    if (confirmationJeton === undefined || confirmationJeton.trim().length === 0) {
      throw new BadRequestException({
        code: CODES_REPONSE.CONFIRMATION_REQUISE.code,
        message: CODES_REPONSE.CONFIRMATION_REQUISE.message,
      });
    }

    const mode = await this.historisation.deciderSuppression(salarieId, ligne);
    const message =
      mode === 'inactiver'
        ? 'La ligne sera close et restera visible en etat inactive pour justifier les bulletins passes.'
        : 'La ligne sera supprimee definitivement.';
    const inventaire = { salarieId, ligneId, mode, message };
    const attendu = calculerJetonConfirmation(inventaire);

    if (!jetonsIdentiques(attendu, confirmationJeton)) {
      throw new ConflictException({
        code: CODES_REPONSE.CONFIRMATION_OBSOLETE.code,
        message: CODES_REPONSE.CONFIRMATION_OBSOLETE.message,
      });
    }
  }

  private async alertesPersonneACharge(
    salarie: { companyId: string },
    salarieId: string,
    moisEnCours: string,
    candidat: {
      id?: string;
      nom: string;
      prenom: string;
      dateNaissance: Date;
      lienParenteCode: string;
      situationHandicap: boolean;
    }
  ): Promise<AlerteApi[]> {
    const lignes = await this.prisma.personneACharge.findMany({
      where: { salarieId },
      select: { id: true, nom: true, prenom: true, dateNaissance: true },
    });

    const alertes: AlerteApi[] = [];
    const doublon = collecterAlertePersonneDoublon(lignes, candidat);
    if (doublon !== null) alertes.push(doublon);

    if (candidat.lienParenteCode === 'ENFANT') {
      const age = await collecterAlerteEnfantAge(
        this.referentiel,
        moisEnCours,
        candidat.dateNaissance,
        candidat.situationHandicap
      );
      if (age !== null) alertes.push(age);
    }

    void salarie;
    return alertes;
  }

  private async reponseFiche(salarieId: string, alertes: AlerteApi[] = []) {
    const salarie = await this.prisma.salarie.findUniqueOrThrow({
      where: { id: salarieId },
      include: { ...INCLUDE_FICHE_SALARIE, ...INCLUDE_COLLECTIONS_SALARIE },
    });
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarieId);
    const bulletins = await this.bulletins.listerBulletinsParSalarie(salarieId);
    const emplois = await this.emplois.listerEmploisPourFicheSalarie(salarieId, moisEnCours);
    const collections = mapperCollectionsSalarie(salarie, moisEnCours, bulletins);
    const fiche = {
      ...(await versFicheSalarie(this.prisma, salarie, moisEnCours, emplois)),
      ...collections,
    };
    return okEcriture(fiche, alertes);
  }

  private async trouverSalarie(id: string) {
    const { companyId, accountId } = companyScope(this.tenantContext.getOrThrow());
    const salarie = await this.prisma.salarie.findFirst({
      where: { id, companyId, company: { accountId } },
      select: { id: true, companyId: true },
    });
    if (salarie === null) throw new NotFoundException(MESSAGE_NEUTRE);
    return salarie;
  }

  private async trouverPersonneACharge(salarieId: string, ligneId: string) {
    const ligne = await this.prisma.personneACharge.findFirst({
      where: { id: ligneId, salarieId },
    });
    if (ligne === null) throw new NotFoundException(MESSAGE_NEUTRE);
    return ligne;
  }

  private async trouverPret(salarieId: string, ligneId: string) {
    const ligne = await this.prisma.pret.findFirst({
      where: { id: ligneId, salarieId },
    });
    if (ligne === null) throw new NotFoundException(MESSAGE_NEUTRE);
    return ligne;
  }

  private async trouverSaisie(salarieId: string, ligneId: string) {
    const ligne = await this.prisma.saisieSurSalaire.findFirst({
      where: { id: ligneId, salarieId },
    });
    if (ligne === null) throw new NotFoundException(MESSAGE_NEUTRE);
    return ligne;
  }
}
