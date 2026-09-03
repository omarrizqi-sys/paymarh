import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ContratEmploiSaisieDto {
  @IsString()
  @MaxLength(200)
  libellePoste!: string;

  @IsDateString()
  dateDebut!: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @IsString()
  typeContratCode!: string;

  @IsOptional()
  @IsDateString()
  periodeEssaiDateFin?: string;

  @IsOptional()
  @IsDateString()
  renouvellementEssaiDateFin?: string;

  @IsOptional()
  @IsEnum(['CADRE', 'NON_CADRE'])
  statutCadre?: 'CADRE' | 'NON_CADRE';

  @IsOptional()
  @IsString()
  coefficient?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  indice?: string;

  @IsOptional()
  @IsDateString()
  dateSortie?: string | null;

  @IsOptional()
  @IsString()
  motifSortieCode?: string | null;
}

export class RemunerationEmploiSaisieDto {
  @IsEnum(['BRUT_MENSUEL', 'BRUT_HORAIRE', 'NET_CIBLE'])
  modeDeterminationSalaire!: 'BRUT_MENSUEL' | 'BRUT_HORAIRE' | 'NET_CIBLE';

  @IsString()
  montant!: string;

  @IsOptional()
  @IsBoolean()
  masquerNombreHeures?: boolean;

  @IsOptional()
  @IsBoolean()
  masquerTauxHoraire?: boolean;

  @IsOptional()
  @IsBoolean()
  bulletinTousLesMois?: boolean;

  @IsOptional()
  @IsInt({ each: true })
  moisProduction?: number[];

  @IsOptional()
  @IsEnum(['VIREMENT', 'CHEQUE', 'ESPECES'])
  modePaiement?: 'VIREMENT' | 'CHEQUE' | 'ESPECES';

  @IsOptional()
  @IsUUID()
  compteBancaireId?: string | null;

  @IsOptional()
  @IsBoolean()
  teletravailIndemniteVersee?: boolean | null;

  @IsOptional()
  @IsString()
  teletravailMontant?: string | null;
}

export class AffectationEmploiSaisieDto {
  @IsUUID()
  etablissementId!: string;

  @IsOptional()
  @IsString()
  departementRef?: string | null;

  @IsOptional()
  @IsString()
  serviceRef?: string | null;

  @IsEnum(['HEBDOMADAIRE', 'MENSUELLE'])
  baseSaisieDuree!: 'HEBDOMADAIRE' | 'MENSUELLE';

  @IsOptional()
  @IsString()
  dureeContractuelle?: string | null;

  @IsOptional()
  @IsString()
  repartitionHoraireRef?: string | null;

  @IsOptional()
  @IsEnum(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'])
  reposHebdomadaire?:
    'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE' | null;

  @IsOptional()
  @IsBoolean()
  suivreJoursFeriesEtablissement?: boolean;

  @IsOptional()
  @IsBoolean()
  teletravailAutorise?: boolean | null;
}

export class CreerEmploiDto {
  @ValidateNested()
  @Type(() => ContratEmploiSaisieDto)
  contrat!: ContratEmploiSaisieDto;

  @ValidateNested()
  @Type(() => RemunerationEmploiSaisieDto)
  remuneration!: RemunerationEmploiSaisieDto;

  @ValidateNested()
  @Type(() => AffectationEmploiSaisieDto)
  affectation!: AffectationEmploiSaisieDto;
}

export class ModifierContratEmploiDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  libellePoste?: string;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string | null;

  @IsOptional()
  @IsString()
  typeContratCode?: string;

  @IsOptional()
  @IsDateString()
  periodeEssaiDateFin?: string | null;

  @IsOptional()
  @IsDateString()
  renouvellementEssaiDateFin?: string | null;

  @IsOptional()
  @IsEnum(['CADRE', 'NON_CADRE'])
  statutCadre?: 'CADRE' | 'NON_CADRE' | null;

  @IsOptional()
  @IsString()
  coefficient?: string | null;

  @IsOptional()
  @IsString()
  position?: string | null;

  @IsOptional()
  @IsString()
  indice?: string | null;

  @IsOptional()
  @IsDateString()
  dateSortie?: string | null;

  @IsOptional()
  @IsString()
  motifSortieCode?: string | null;
}

export class ModifierRemunerationEmploiDto {
  @IsOptional()
  @IsEnum(['BRUT_MENSUEL', 'BRUT_HORAIRE', 'NET_CIBLE'])
  modeDeterminationSalaire?: 'BRUT_MENSUEL' | 'BRUT_HORAIRE' | 'NET_CIBLE';

  @IsOptional()
  @IsString()
  montant?: string;

  @IsOptional()
  @IsBoolean()
  masquerNombreHeures?: boolean;

  @IsOptional()
  @IsBoolean()
  masquerTauxHoraire?: boolean;

  @IsOptional()
  @IsBoolean()
  bulletinTousLesMois?: boolean;

  @IsOptional()
  @IsInt({ each: true })
  moisProduction?: number[];

  @IsOptional()
  @IsEnum(['VIREMENT', 'CHEQUE', 'ESPECES'])
  modePaiement?: 'VIREMENT' | 'CHEQUE' | 'ESPECES' | null;

  @IsOptional()
  @IsUUID()
  compteBancaireId?: string | null;

  @IsOptional()
  @IsBoolean()
  teletravailIndemniteVersee?: boolean | null;

  @IsOptional()
  @IsString()
  teletravailMontant?: string | null;
}

export class ModifierAffectationEmploiDto {
  @IsOptional()
  @IsUUID()
  etablissementId?: string;

  @IsOptional()
  @IsString()
  departementRef?: string | null;

  @IsOptional()
  @IsString()
  serviceRef?: string | null;

  @IsOptional()
  @IsEnum(['HEBDOMADAIRE', 'MENSUELLE'])
  baseSaisieDuree?: 'HEBDOMADAIRE' | 'MENSUELLE';

  @IsOptional()
  @IsString()
  dureeContractuelle?: string | null;

  @IsOptional()
  @IsString()
  repartitionHoraireRef?: string | null;

  @IsOptional()
  @IsEnum(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'])
  reposHebdomadaire?:
    'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE' | null;

  @IsOptional()
  @IsBoolean()
  suivreJoursFeriesEtablissement?: boolean;

  @IsOptional()
  @IsBoolean()
  teletravailAutorise?: boolean | null;
}
