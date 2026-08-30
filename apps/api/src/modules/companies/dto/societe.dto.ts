import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class EtablissementPrincipalDto {
  @IsString()
  @IsNotEmpty()
  adresse!: string;

  @IsString()
  @IsNotEmpty()
  ville!: string;

  @IsOptional()
  @IsString()
  complementAdresse?: string;

  @IsOptional()
  @IsString()
  codePostal?: string;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsOptional()
  @IsString()
  ice?: string;

  @IsOptional()
  @IsString()
  taxeProfessionnelle?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  nom?: string;
}

export class CreerSocieteDto {
  @IsString()
  @IsNotEmpty()
  codeDossier!: string;

  @IsString()
  @IsNotEmpty()
  raisonSociale!: string;

  @IsOptional()
  @IsString()
  nomCommercial?: string;

  @IsUUID()
  formeJuridiqueId!: string;

  @IsOptional()
  @IsString()
  activiteExercee?: string;

  @IsOptional()
  @IsString()
  identifiantFiscal?: string;

  @IsOptional()
  @IsString()
  registreCommerce?: string;

  @IsOptional()
  @IsString()
  tribunalRegistreCommerce?: string;

  @IsOptional()
  @IsString()
  dateCreation?: string;

  @IsOptional()
  @IsString()
  dateCessationActivite?: string;

  @IsOptional()
  @IsString()
  siteWeb?: string;

  @IsIn(['EN_MONTAGE', 'EN_PRODUCTION', 'INACTIVE'])
  etatDossier!: 'EN_MONTAGE' | 'EN_PRODUCTION' | 'INACTIVE';

  @IsString()
  @IsNotEmpty()
  moisDebutMontage!: string;

  @IsString()
  @IsNotEmpty()
  moisDebutProduction!: string;

  @IsOptional()
  @IsString()
  dateInactivite?: string;

  @IsOptional()
  @IsString()
  signataireCivilite?: string;

  @IsOptional()
  @IsString()
  signatairePrenom?: string;

  @IsOptional()
  @IsString()
  signataireNom?: string;

  @IsOptional()
  @IsString()
  signataireQualite?: string;

  @IsOptional()
  @IsString()
  matriculePrefixe?: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(20)
  matriculeLongueur!: number;

  @IsOptional()
  @IsBoolean()
  matriculeGenerationAuto?: boolean;

  @IsDefined()
  @IsBoolean()
  calculAutoAbsencesEntreesSorties!: boolean;

  @ValidateNested()
  @Type(() => EtablissementPrincipalDto)
  etablissementPrincipal!: EtablissementPrincipalDto;
}

export class ModifierSocieteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codeDossier?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  raisonSociale?: string;

  @IsOptional()
  @IsString()
  nomCommercial?: string | null;

  @IsOptional()
  @IsUUID()
  formeJuridiqueId?: string;

  @IsOptional()
  @IsString()
  activiteExercee?: string | null;

  @IsOptional()
  @IsString()
  identifiantFiscal?: string | null;

  @IsOptional()
  @IsString()
  registreCommerce?: string | null;

  @IsOptional()
  @IsString()
  tribunalRegistreCommerce?: string | null;

  @IsOptional()
  @IsString()
  dateCreation?: string | null;

  @IsOptional()
  @IsString()
  dateCessationActivite?: string | null;

  @IsOptional()
  @IsString()
  siteWeb?: string | null;

  @IsOptional()
  @IsString()
  moisDebutMontage?: string;

  @IsOptional()
  @IsString()
  moisDebutProduction?: string;

  @IsOptional()
  @IsString()
  signataireCivilite?: string | null;

  @IsOptional()
  @IsString()
  signatairePrenom?: string | null;

  @IsOptional()
  @IsString()
  signataireNom?: string | null;

  @IsOptional()
  @IsString()
  signataireQualite?: string | null;

  @IsOptional()
  @IsString()
  matriculePrefixe?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  matriculeLongueur?: number;

  @IsOptional()
  @IsBoolean()
  matriculeGenerationAuto?: boolean;

  @IsOptional()
  @IsBoolean()
  calculAutoAbsencesEntreesSorties?: boolean | null;

  @IsOptional()
  @IsIn(['NON_AGRICOLE'])
  regimeDeBase?: 'NON_AGRICOLE';
}

export class ChangerEtatSocieteDto {
  @IsIn(['EN_MONTAGE', 'EN_PRODUCTION', 'INACTIVE'])
  etatDossier!: 'EN_MONTAGE' | 'EN_PRODUCTION' | 'INACTIVE';

  @IsOptional()
  @IsString()
  dateInactivite?: string | null;
}

export class ParametrageSocieteDto {
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(12)
  moisClotureConges!: number;

  @IsOptional()
  @IsUUID()
  typeExonerationId?: string | null;

  @IsOptional()
  @IsString()
  exonerationDateDebut?: string | null;

  @IsOptional()
  @IsString()
  exonerationDateFin?: string | null;
}

export class ForcerRegimeDto {
  @IsIn(['NON_AGRICOLE'])
  regimeDeBase!: 'NON_AGRICOLE';

  @IsString()
  @IsNotEmpty()
  motif!: string;
}
