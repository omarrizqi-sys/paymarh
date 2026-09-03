import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AlerteApi } from '@paymarh/shared-types';
import { estConflitUnicite } from '../../common/errors/conflit-unicite.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { companyScope } from '../../common/tenancy/tenant-scope.js';
import { calculerJetonConfirmation, jetonsIdentiques } from '../companies/jeton-confirmation.js';
import { BULLETIN_PORT, type BulletinPort } from './bulletin/bulletin.port.js';
import { creerSalarieMatriculeAuto, marquerMatriculeConsomme } from './compteurs-salarie.js';
import { deduireEtatSalarie, emploiEstOuvert } from './deductions-salarie.js';
import { EmploisService } from './emplois.service.js';
import type {
  CreerSalarieDto,
  ListerSalariesQueryDto,
  ModifierCoordonneesSalarieDto,
  ModifierDatesSalarieDto,
  ModifierIdentifiantsLegauxSalarieDto,
  ModifierIdentiteSalarieDto,
  VerifierSalarieDto,
} from './dto/salarie.dto.js';
import {
  INCLUDE_FICHE_SALARIE,
  versFicheSalarie,
  versLigneListeSalarie,
} from './mappers/salarie.mapper.js';
import { INCLUDE_COLLECTIONS_SALARIE } from './mappers/tableaux.mapper.js';
import { MoisEnCoursService } from './mois-en-cours/mois-en-cours.service.js';
import { calculerAlertesRapprochement } from './rapprochement-salarie.js';
import { CODES_REPONSE } from './reponses/codes-reponse.js';
import { okEcriture } from './reponses/enveloppe-ecriture.js';
import {
  assertAlphabetiqueSalarie,
  assertChiffresSalarie,
  collecterAlertesSalarie,
  erreurValeurIndisponible,
  ValidationBloquanteSalarieError,
} from './validation-salarie.js';
import { VerrouillageOptimisteService } from './verrouillage/verrouillage-optimiste.service.js';

const MESSAGE_NEUTRE = 'Ressource introuvable.';
const LIMITE_DEFAUT = 50;
const LIMITE_MAX = 100;

interface CurseurListe {
  readonly nom: string;
  readonly prenom: string;
  readonly id: string;
}

function encoderCurseur(curseur: CurseurListe): string {
  return Buffer.from(JSON.stringify(curseur), 'utf8').toString('base64url');
}

function decoderCurseur(valeur: string): CurseurListe | null {
  try {
    const decode = Buffer.from(valeur, 'base64url').toString('utf8');
    const parsed = JSON.parse(decode) as CurseurListe;
    if (
      typeof parsed.nom === 'string' &&
      typeof parsed.prenom === 'string' &&
      typeof parsed.id === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function versDate(valeur: string): Date {
  return new Date(valeur);
}

/** Champs legaux optionnels : chaine vide equivaut a absent (pas de controle d unicite). */
function identifiantLegalSaisi(valeur: string | null | undefined): string | null {
  if (valeur === null || valeur === undefined) return null;
  const trim = valeur.trim();
  return trim.length === 0 ? null : trim;
}

function relancerValidation(erreur: unknown): never {
  if (erreur instanceof ValidationBloquanteSalarieError) {
    throw new BadRequestException({
      code: erreur.code,
      message: erreur.message,
      champ: erreur.champ,
    });
  }
  throw erreur;
}

@Injectable()
export class SalariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly moisEnCours: MoisEnCoursService,
    private readonly verrouillage: VerrouillageOptimisteService,
    private readonly emplois: EmploisService,
    @Inject(BULLETIN_PORT) private readonly bulletins: BulletinPort
  ) {}

  async lire(id: string) {
    const salarie = await this.trouverSalarieSociete(id);
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(id);
    const bulletins = await this.bulletins.listerBulletinsParSalarie(id);
    const emplois = await this.emplois.listerEmploisPourFicheSalarie(id, moisEnCours);
    return {
      donnees: await versFicheSalarie(this.prisma, salarie, moisEnCours, emplois, bulletins),
    };
  }

  private async versFicheComplete(salarie: Awaited<ReturnType<typeof this.trouverSalarieSociete>>) {
    const moisEnCours = await this.moisEnCours.calculerPourSalarie(salarie.id);
    const bulletins = await this.bulletins.listerBulletinsParSalarie(salarie.id);
    const emplois = await this.emplois.listerEmploisPourFicheSalarie(salarie.id, moisEnCours);
    return versFicheSalarie(this.prisma, salarie, moisEnCours, emplois, bulletins);
  }

  async lister(query: ListerSalariesQueryDto) {
    const { companyId } = companyScope(this.tenantContext.getOrThrow());
    const limite = Math.min(Math.max(query.limite ?? LIMITE_DEFAUT, 1), LIMITE_MAX);

    let idsEtablissement: string[] | undefined;
    if (query.etablissementId !== undefined) {
      idsEtablissement = await this.idsSalariesParEtablissementActif(
        companyId,
        query.etablissementId
      );
      if (idsEtablissement.length === 0) {
        return { donnees: { items: [], prochainCurseur: null } };
      }
    }

    const curseur = query.curseur !== undefined ? decoderCurseur(query.curseur) : null;
    const recherche = query.recherche?.trim();

    const filtreRecherche =
      recherche !== undefined && recherche.length > 0
        ? {
            OR: [
              { nom: { contains: recherche, mode: 'insensitive' as const } },
              { prenom: { contains: recherche, mode: 'insensitive' as const } },
              { matricule: { contains: recherche, mode: 'insensitive' as const } },
            ],
          }
        : null;

    const filtreCurseur =
      curseur !== null
        ? {
            OR: [
              { nom: { gt: curseur.nom } },
              { nom: curseur.nom, prenom: { gt: curseur.prenom } },
              {
                nom: curseur.nom,
                prenom: curseur.prenom,
                id: { gt: curseur.id },
              },
            ],
          }
        : null;

    const filtresCombinés = [filtreRecherche, filtreCurseur].filter(
      (filtre): filtre is NonNullable<typeof filtre> => filtre !== null
    );

    const candidats = await this.prisma.salarie.findMany({
      where: {
        companyId,
        ...(idsEtablissement !== undefined ? { id: { in: idsEtablissement } } : {}),
        ...(filtresCombinés.length > 0 ? { AND: filtresCombinés } : {}),
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }, { id: 'asc' }],
      take: limite + 1,
      select: { id: true, matricule: true, nom: true, prenom: true },
    });

    let page = candidats;
    if (query.etat !== undefined) {
      const filtres: typeof candidats = [];
      for (const salarie of candidats) {
        const etat = await deduireEtatSalarie(this.prisma, salarie.id);
        if (etat === query.etat) {
          filtres.push(salarie);
        }
        if (filtres.length > limite) break;
      }
      page = filtres;
    }

    const aPlus = page.length > limite;
    const itemsBruts = aPlus ? page.slice(0, limite) : page;

    const items = await Promise.all(
      itemsBruts.map(async (salarie) =>
        versLigneListeSalarie(salarie, await deduireEtatSalarie(this.prisma, salarie.id))
      )
    );

    const dernier = itemsBruts.at(-1);
    const prochainCurseur =
      aPlus && dernier !== undefined
        ? encoderCurseur({ nom: dernier.nom, prenom: dernier.prenom, id: dernier.id })
        : null;

    return { donnees: { items, prochainCurseur } };
  }

  async creer(dto: CreerSalarieDto) {
    const { companyId } = companyScope(this.tenantContext.getOrThrow());
    const company = await this.prisma.company.findFirstOrThrow({
      where: { id: companyId },
      select: { matriculePrefixe: true, matriculeLongueur: true },
    });

    const dateEntree = versDate(dto.dateEntree);
    const dateAnciennete = dto.dateAnciennete ? versDate(dto.dateAnciennete) : dateEntree;

    await this.controlerBlocages({
      companyId,
      matricule: dto.matricule?.trim() || undefined,
      numeroPiece: identifiantLegalSaisi(dto.numeroPiece),
      numeroCnss: identifiantLegalSaisi(dto.numeroCnss),
      nom: dto.nom,
      prenom: dto.prenom,
      sexe: dto.sexe,
      dateNaissance: versDate(dto.dateNaissance),
      villeNaissance: dto.villeNaissance,
      numeroCimr: dto.numeroCimr,
    });

    const paysResidenceEstMaroc = await this.paysEstMaroc(dto.paysId ?? null);
    const alertes = [
      ...collecterAlertesSalarie({
        dateEntree,
        dateAnciennete,
        codePostal: dto.codePostal ?? null,
        paysResidenceEstMaroc,
        emailPersonnel: dto.emailPersonnel ?? null,
        emailProfessionnel: dto.emailProfessionnel ?? null,
        telephonePersonnel: dto.telephonePersonnel ?? null,
        telephoneProfessionnel: dto.telephoneProfessionnel ?? null,
        urgenceEmail: dto.urgenceEmail ?? null,
        urgenceTelephone: dto.urgenceTelephone ?? null,
      }),
      ...(await calculerAlertesRapprochement(this.prisma, {
        companyId,
        nom: dto.nom,
        prenom: dto.prenom,
        dateNaissance: versDate(dto.dateNaissance),
        numeroPiece: identifiantLegalSaisi(dto.numeroPiece),
      })),
    ];

    const donneesBase = {
      companyId,
      nom: dto.nom,
      prenom: dto.prenom,
      sexe: dto.sexe,
      dateNaissance: versDate(dto.dateNaissance),
      villeNaissance: dto.villeNaissance ?? null,
      paysNaissanceId: dto.paysNaissanceId ?? null,
      nationaliteId: dto.nationaliteId ?? null,
      situationFamilialeCode: dto.situationFamilialeCode ?? null,
      numeroPiece: identifiantLegalSaisi(dto.numeroPiece),
      numeroCnss: identifiantLegalSaisi(dto.numeroCnss),
      numeroCimr: dto.numeroCimr ?? null,
      adresse: dto.adresse ?? null,
      complementAdresse: dto.complementAdresse ?? null,
      ville: dto.ville ?? null,
      codePostal: dto.codePostal ?? null,
      paysId: dto.paysId ?? null,
      telephonePersonnel: dto.telephonePersonnel ?? null,
      telephoneProfessionnel: dto.telephoneProfessionnel ?? null,
      emailPersonnel: dto.emailPersonnel ?? null,
      emailProfessionnel: dto.emailProfessionnel ?? null,
      urgencePrenom: dto.urgencePrenom ?? null,
      urgenceNom: dto.urgenceNom ?? null,
      urgenceTelephone: dto.urgenceTelephone ?? null,
      urgenceEmail: dto.urgenceEmail ?? null,
      dateEntree,
      dateAnciennete,
    };

    const matriculeSaisi = dto.matricule?.trim();
    let salarie;
    if (matriculeSaisi === undefined || matriculeSaisi.length === 0) {
      const prefixe = company.matriculePrefixe ?? '';
      salarie = await creerSalarieMatriculeAuto(
        this.prisma,
        { prefixe, longueur: company.matriculeLongueur },
        donneesBase
      );
    } else {
      try {
        salarie = await this.prisma.$transaction(async (tx) => {
          await marquerMatriculeConsomme(tx, companyId, matriculeSaisi);
          return tx.salarie.create({
            data: { ...donneesBase, matricule: matriculeSaisi },
          });
        });
      } catch (erreur) {
        if (estConflitUnicite(erreur)) {
          throw new BadRequestException({
            code: CODES_REPONSE.VALEUR_INDISPONIBLE.code,
            message: CODES_REPONSE.VALEUR_INDISPONIBLE.message,
            champ: 'matricule',
          });
        }
        throw erreur;
      }
    }

    const complet = await this.chargerFiche(salarie.id);
    return okEcriture(await this.versFicheComplete(complet), alertes);
  }

  async verifier(dto: VerifierSalarieDto) {
    const { companyId } = companyScope(this.tenantContext.getOrThrow());

    const blocages: AlerteApi[] = [];
    try {
      await this.controlerBlocages({
        companyId,
        matricule: dto.matricule?.trim() || undefined,
        numeroPiece: identifiantLegalSaisi(dto.numeroPiece),
        numeroCnss: identifiantLegalSaisi(dto.numeroCnss),
        nom: dto.nom,
        prenom: dto.prenom,
        villeNaissance: undefined,
        numeroCimr: undefined,
      });
    } catch (erreur) {
      if (erreur instanceof BadRequestException) {
        const corps = erreur.getResponse() as { code: string; message: string; champ?: string };
        blocages.push({
          code: corps.code,
          message: corps.message,
          champ: corps.champ,
        });
      } else {
        throw erreur;
      }
    }

    const paysResidenceEstMaroc = await this.paysEstMaroc(dto.paysId ?? null);
    const alertes = [
      ...blocages,
      ...collecterAlertesSalarie({
        dateEntree: dto.dateEntree ? versDate(dto.dateEntree) : null,
        dateAnciennete: dto.dateAnciennete ? versDate(dto.dateAnciennete) : null,
        codePostal: dto.codePostal ?? null,
        paysResidenceEstMaroc,
        emailPersonnel: dto.emailPersonnel ?? null,
        emailProfessionnel: dto.emailProfessionnel ?? null,
        telephonePersonnel: dto.telephonePersonnel ?? null,
        telephoneProfessionnel: dto.telephoneProfessionnel ?? null,
        urgenceEmail: dto.urgenceEmail ?? null,
        urgenceTelephone: dto.urgenceTelephone ?? null,
      }),
      ...(await calculerAlertesRapprochement(this.prisma, {
        companyId,
        nom: dto.nom ?? null,
        prenom: dto.prenom ?? null,
        dateNaissance: dto.dateNaissance ? versDate(dto.dateNaissance) : null,
        numeroPiece: identifiantLegalSaisi(dto.numeroPiece),
      })),
    ];

    return { donnees: null, alertes };
  }

  async modifierIdentite(id: string, dto: ModifierIdentiteSalarieDto, versionAttendue: number) {
    const existant = await this.trouverSalarieSociete(id);
    const donnees: Record<string, unknown> = {};

    if (dto.nom !== undefined) {
      assertAlphabetiqueSalarie(dto.nom, 'nom');
      donnees.nom = dto.nom;
    }
    if (dto.prenom !== undefined) {
      assertAlphabetiqueSalarie(dto.prenom, 'prenom');
      donnees.prenom = dto.prenom;
    }
    if (dto.sexe !== undefined) donnees.sexe = dto.sexe;
    if (dto.dateNaissance !== undefined) donnees.dateNaissance = versDate(dto.dateNaissance);
    if (dto.villeNaissance !== undefined) {
      assertAlphabetiqueSalarie(dto.villeNaissance, 'villeNaissance');
      donnees.villeNaissance = dto.villeNaissance;
    }
    if (dto.paysNaissanceId !== undefined) donnees.paysNaissanceId = dto.paysNaissanceId;
    if (dto.nationaliteId !== undefined) donnees.nationaliteId = dto.nationaliteId;
    if (dto.situationFamilialeCode !== undefined) {
      donnees.situationFamilialeCode = dto.situationFamilialeCode;
    }

    return this.appliquerModification(id, existant, versionAttendue, donnees, {
      nom: dto.nom ?? existant.nom,
      prenom: dto.prenom ?? existant.prenom,
      dateNaissance: dto.dateNaissance ? versDate(dto.dateNaissance) : existant.dateNaissance,
      numeroPiece: existant.numeroPiece,
    });
  }

  async modifierCoordonnees(
    id: string,
    dto: ModifierCoordonneesSalarieDto,
    versionAttendue: number
  ) {
    const existant = await this.trouverSalarieSociete(id);
    const donnees: Record<string, unknown> = {};

    for (const cle of [
      'adresse',
      'complementAdresse',
      'ville',
      'codePostal',
      'paysId',
      'telephonePersonnel',
      'telephoneProfessionnel',
      'emailPersonnel',
      'emailProfessionnel',
      'urgencePrenom',
      'urgenceNom',
      'urgenceTelephone',
      'urgenceEmail',
    ] as const) {
      if (dto[cle] !== undefined) {
        if (cle === 'urgencePrenom' || cle === 'urgenceNom' || cle === 'ville') {
          assertAlphabetiqueSalarie(dto[cle], cle);
        }
        donnees[cle] = dto[cle];
      }
    }

    const paysId = dto.paysId !== undefined ? dto.paysId : existant.paysId;
    const codePostal = dto.codePostal !== undefined ? dto.codePostal : existant.codePostal;

    return this.appliquerModification(id, existant, versionAttendue, donnees, {
      nom: existant.nom,
      prenom: existant.prenom,
      dateEntree: existant.dateEntree,
      dateAnciennete: existant.dateAnciennete,
      codePostal,
      paysId,
      emailPersonnel:
        dto.emailPersonnel !== undefined ? dto.emailPersonnel : existant.emailPersonnel,
      emailProfessionnel:
        dto.emailProfessionnel !== undefined ? dto.emailProfessionnel : existant.emailProfessionnel,
      telephonePersonnel:
        dto.telephonePersonnel !== undefined ? dto.telephonePersonnel : existant.telephonePersonnel,
      telephoneProfessionnel:
        dto.telephoneProfessionnel !== undefined
          ? dto.telephoneProfessionnel
          : existant.telephoneProfessionnel,
      urgenceEmail: dto.urgenceEmail !== undefined ? dto.urgenceEmail : existant.urgenceEmail,
      urgenceTelephone:
        dto.urgenceTelephone !== undefined ? dto.urgenceTelephone : existant.urgenceTelephone,
    });
  }

  async modifierIdentifiantsLegaux(
    id: string,
    dto: ModifierIdentifiantsLegauxSalarieDto,
    versionAttendue: number
  ) {
    const existant = await this.trouverSalarieSociete(id);
    const { companyId } = companyScope(this.tenantContext.getOrThrow());

    if (dto.matricule !== undefined) {
      await this.verifierUniciteMatricule(companyId, dto.matricule, id);
    }
    if (dto.numeroPiece !== undefined && dto.numeroPiece !== null) {
      await this.verifierUniciteNumeroPiece(companyId, dto.numeroPiece, id);
    }
    if (dto.numeroCnss !== undefined && dto.numeroCnss !== null) {
      await this.verifierUniciteNumeroCnss(companyId, dto.numeroCnss, id);
      assertChiffresSalarie(dto.numeroCnss, 'numeroCnss');
    }
    if (dto.numeroCimr !== undefined && dto.numeroCimr !== null) {
      assertChiffresSalarie(dto.numeroCimr, 'numeroCimr');
    }

    const donnees: Record<string, unknown> = {};
    if (dto.matricule !== undefined) donnees.matricule = dto.matricule;
    if (dto.numeroPiece !== undefined) donnees.numeroPiece = dto.numeroPiece;
    if (dto.numeroCnss !== undefined) donnees.numeroCnss = dto.numeroCnss;
    if (dto.numeroCimr !== undefined) donnees.numeroCimr = dto.numeroCimr;

    return this.appliquerModification(id, existant, versionAttendue, donnees, {
      nom: existant.nom,
      prenom: existant.prenom,
      dateNaissance: existant.dateNaissance,
      numeroPiece: dto.numeroPiece !== undefined ? dto.numeroPiece : existant.numeroPiece,
    });
  }

  async modifierDates(id: string, dto: ModifierDatesSalarieDto, versionAttendue: number) {
    const existant = await this.trouverSalarieSociete(id);
    const donnees: Record<string, unknown> = {};

    const dateEntree =
      dto.dateEntree !== undefined ? versDate(dto.dateEntree) : existant.dateEntree;
    const dateAnciennete =
      dto.dateAnciennete !== undefined ? versDate(dto.dateAnciennete) : existant.dateAnciennete;

    if (dto.dateEntree !== undefined) donnees.dateEntree = dateEntree;
    if (dto.dateAnciennete !== undefined) donnees.dateAnciennete = dateAnciennete;

    return this.appliquerModification(id, existant, versionAttendue, donnees, {
      nom: existant.nom,
      prenom: existant.prenom,
      dateEntree,
      dateAnciennete,
      numeroPiece: existant.numeroPiece,
    });
  }

  async impactSuppression(id: string) {
    await this.trouverSalarieSociete(id);
    const inventaire = {
      message:
        'La suppression effacera l integralite du contenu de cette fiche salarie, sans possibilite de retour.',
    };
    return {
      donnees: {
        ...inventaire,
        jetonConfirmation: calculerJetonConfirmation(inventaire),
      },
    };
  }

  async supprimer(id: string, confirmationJeton: string | undefined, versionAttendue: number) {
    const salarie = await this.trouverSalarieSociete(id);

    if (confirmationJeton === undefined || confirmationJeton.trim().length === 0) {
      throw new BadRequestException({
        code: CODES_REPONSE.CONFIRMATION_REQUISE.code,
        message: CODES_REPONSE.CONFIRMATION_REQUISE.message,
      });
    }

    const bulletins = await this.bulletins.listerBulletinsParSalarie(id);
    if (bulletins.length > 0) {
      throw new ConflictException({
        code: CODES_REPONSE.SUPPRESSION_INTERDITE.code,
        message: CODES_REPONSE.SUPPRESSION_INTERDITE.message,
      });
    }

    const inventaire = {
      message:
        'La suppression effacera l integralite du contenu de cette fiche salarie, sans possibilite de retour.',
    };
    const jetonAttendu = calculerJetonConfirmation(inventaire);
    if (!jetonsIdentiques(jetonAttendu, confirmationJeton)) {
      throw new ConflictException({
        code: CODES_REPONSE.CONFIRMATION_OBSOLETE.code,
        message: CODES_REPONSE.CONFIRMATION_OBSOLETE.message,
      });
    }

    const { count } = await this.prisma.salarie.deleteMany({
      where: { id, version: versionAttendue },
    });
    if (count === 0) {
      const encoreLa = await this.prisma.salarie.findUnique({ where: { id } });
      if (encoreLa !== null) {
        throw new ConflictException({
          code: CODES_REPONSE.CONFLIT_VERSION.code,
          message: CODES_REPONSE.CONFLIT_VERSION.message,
        });
      }
      throw new NotFoundException(MESSAGE_NEUTRE);
    }

    return okEcriture({ id: salarie.id });
  }

  private async appliquerModification(
    id: string,
    existant: Awaited<ReturnType<typeof this.trouverSalarieSociete>>,
    versionAttendue: number,
    donnees: Record<string, unknown>,
    contexteAlertes: {
      nom: string;
      prenom: string;
      dateNaissance?: Date;
      dateEntree?: Date;
      dateAnciennete?: Date;
      numeroPiece?: string | null;
      codePostal?: string | null;
      paysId?: string | null;
      emailPersonnel?: string | null;
      emailProfessionnel?: string | null;
      telephonePersonnel?: string | null;
      telephoneProfessionnel?: string | null;
      urgenceEmail?: string | null;
      urgenceTelephone?: string | null;
    }
  ) {
    const { companyId } = companyScope(this.tenantContext.getOrThrow());
    const paysResidenceEstMaroc = await this.paysEstMaroc(contexteAlertes.paysId ?? null);

    const alertes = [
      ...collecterAlertesSalarie({
        dateEntree: contexteAlertes.dateEntree ?? null,
        dateAnciennete: contexteAlertes.dateAnciennete ?? null,
        codePostal: contexteAlertes.codePostal ?? null,
        paysResidenceEstMaroc,
        emailPersonnel: contexteAlertes.emailPersonnel ?? null,
        emailProfessionnel: contexteAlertes.emailProfessionnel ?? null,
        telephonePersonnel: contexteAlertes.telephonePersonnel ?? null,
        telephoneProfessionnel: contexteAlertes.telephoneProfessionnel ?? null,
        urgenceEmail: contexteAlertes.urgenceEmail ?? null,
        urgenceTelephone: contexteAlertes.urgenceTelephone ?? null,
      }),
      ...(await calculerAlertesRapprochement(this.prisma, {
        companyId,
        nom: contexteAlertes.nom,
        prenom: contexteAlertes.prenom,
        dateNaissance: contexteAlertes.dateNaissance ?? null,
        numeroPiece: contexteAlertes.numeroPiece ?? null,
        exclureSalarieId: id,
      })),
    ];

    if (Object.keys(donnees).length > 0) {
      const matriculeNouveau =
        typeof donnees.matricule === 'string' ? donnees.matricule : undefined;
      if (matriculeNouveau !== undefined) {
        await this.prisma.$transaction(async (tx) => {
          await marquerMatriculeConsomme(tx, companyId, matriculeNouveau);
          await this.verrouillage.modifierSalarie({ id, versionAttendue, donnees }, tx);
        });
      } else {
        await this.verrouillage.modifierSalarie({ id, versionAttendue, donnees });
      }
    }

    const complet = await this.chargerFiche(id);
    return okEcriture(await this.versFicheComplete(complet), alertes);
  }

  private async controlerBlocages(params: {
    companyId: string;
    matricule?: string;
    numeroPiece?: string | null;
    numeroCnss?: string | null;
    nom?: string;
    prenom?: string;
    sexe?: 'HOMME' | 'FEMME';
    dateNaissance?: Date;
    villeNaissance?: string;
    numeroCimr?: string;
  }) {
    try {
      if (params.nom !== undefined) assertAlphabetiqueSalarie(params.nom, 'nom');
      if (params.prenom !== undefined) assertAlphabetiqueSalarie(params.prenom, 'prenom');
      if (params.villeNaissance !== undefined) {
        assertAlphabetiqueSalarie(params.villeNaissance, 'villeNaissance');
      }
      const numeroPiece = identifiantLegalSaisi(params.numeroPiece);
      const numeroCnss = identifiantLegalSaisi(params.numeroCnss);

      if (params.numeroCimr !== undefined) assertChiffresSalarie(params.numeroCimr, 'numeroCimr');
      if (numeroCnss !== null) {
        assertChiffresSalarie(numeroCnss, 'numeroCnss');
      }

      if (params.matricule !== undefined) {
        await this.verifierUniciteMatricule(params.companyId, params.matricule);
      }
      if (numeroPiece !== null) {
        await this.verifierUniciteNumeroPiece(params.companyId, numeroPiece);
      }
      if (numeroCnss !== null) {
        await this.verifierUniciteNumeroCnss(params.companyId, numeroCnss);
      }
    } catch (erreur) {
      relancerValidation(erreur);
    }
  }

  private async verifierUniciteMatricule(companyId: string, matricule: string, exclureId?: string) {
    const doublon = await this.prisma.salarie.findFirst({
      where: {
        companyId,
        matricule,
        ...(exclureId !== undefined ? { id: { not: exclureId } } : {}),
      },
      select: { id: true },
    });
    if (doublon !== null) {
      throw erreurValeurIndisponible('matricule');
    }

    const consomme = await this.prisma.matriculeConsomme.findUnique({
      where: { companyId_valeur: { companyId, valeur: matricule } },
      select: { valeur: true },
    });
    if (consomme === null) {
      return;
    }

    if (exclureId !== undefined) {
      const actuel = await this.prisma.salarie.findFirst({
        where: { id: exclureId, companyId, matricule },
        select: { id: true },
      });
      if (actuel !== null) {
        return;
      }
    }

    throw erreurValeurIndisponible('matricule');
  }

  private async verifierUniciteNumeroPiece(
    companyId: string,
    numeroPiece: string,
    exclureId?: string
  ) {
    const doublon = await this.prisma.salarie.findFirst({
      where: {
        companyId,
        numeroPiece,
        ...(exclureId !== undefined ? { id: { not: exclureId } } : {}),
      },
      select: { id: true },
    });
    if (doublon !== null) {
      throw erreurValeurIndisponible('numeroPiece');
    }
  }

  private async verifierUniciteNumeroCnss(
    companyId: string,
    numeroCnss: string,
    exclureId?: string
  ) {
    const doublon = await this.prisma.salarie.findFirst({
      where: {
        companyId,
        numeroCnss,
        ...(exclureId !== undefined ? { id: { not: exclureId } } : {}),
      },
      select: { id: true },
    });
    if (doublon !== null) {
      throw erreurValeurIndisponible('numeroCnss');
    }
  }

  private async paysEstMaroc(paysId: string | null): Promise<boolean> {
    if (paysId === null) return false;
    const pays = await this.prisma.pays.findUnique({
      where: { id: paysId },
      select: { codeIso: true },
    });
    return pays?.codeIso === 'MA';
  }

  private async idsSalariesParEtablissementActif(
    companyId: string,
    etablissementId: string
  ): Promise<string[]> {
    const emplois = await this.prisma.emploi.findMany({
      where: { salarie: { companyId } },
      select: {
        salarieId: true,
        contratVersions: {
          orderBy: { moisEffet: 'desc' },
          take: 1,
          select: { dateSortie: true },
        },
        affectationVersions: {
          orderBy: { moisEffet: 'desc' },
          take: 1,
          select: { etablissementId: true },
        },
      },
    });

    const ids = new Set<string>();
    for (const emploi of emplois) {
      const contrat = emploi.contratVersions[0];
      const affectation = emploi.affectationVersions[0];
      if (contrat === undefined || affectation === undefined) continue;
      if (!emploiEstOuvert(contrat.dateSortie)) continue;
      if (affectation.etablissementId === etablissementId) {
        ids.add(emploi.salarieId);
      }
    }
    return [...ids];
  }

  private async trouverSalarieSociete(id: string) {
    const { companyId, accountId } = companyScope(this.tenantContext.getOrThrow());
    const salarie = await this.prisma.salarie.findFirst({
      where: { id, companyId, company: { accountId } },
      include: { ...INCLUDE_FICHE_SALARIE, ...INCLUDE_COLLECTIONS_SALARIE },
    });
    if (salarie === null) {
      throw new NotFoundException(MESSAGE_NEUTRE);
    }
    return salarie;
  }

  private async chargerFiche(id: string) {
    return this.prisma.salarie.findUniqueOrThrow({
      where: { id },
      include: { ...INCLUDE_FICHE_SALARIE, ...INCLUDE_COLLECTIONS_SALARIE },
    });
  }
}
