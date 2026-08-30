import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreerEtablissementDto {
  @IsString()
  @IsNotEmpty()
  nom!: string;

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
}

export class ModifierEtablissementDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  adresse?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ville?: string;

  @IsOptional()
  @IsString()
  complementAdresse?: string | null;

  @IsOptional()
  @IsString()
  codePostal?: string | null;

  @IsOptional()
  @IsString()
  pays?: string;

  @IsOptional()
  @IsString()
  ice?: string | null;

  @IsOptional()
  @IsString()
  taxeProfessionnelle?: string | null;

  @IsOptional()
  @IsString()
  telephone?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;
}

export class HoraireDefautLigneDto {
  @IsIn(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'])
  jourSemaine!: 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE';

  @IsUUID()
  typeHeureId!: string;

  /** Nombre d heures en chaine pour eviter les flottants. */
  @IsString()
  @IsNotEmpty()
  nombreHeures!: string;
}

export class HoraireMensuelLigneDto {
  @IsUUID()
  typeHeureId!: string;

  @IsString()
  @IsNotEmpty()
  nombreHeures!: string;
}

export class ParametrageEtablissementDto {
  @IsOptional()
  @IsString()
  dureeHebdomadaire?: string;

  @IsOptional()
  @IsIn(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'])
  jourReposHebdomadaire?: 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE';

  @IsOptional()
  @IsBoolean()
  teletravailAutorise?: boolean | null;

  @IsOptional()
  @IsBoolean()
  indemniteTeletravailVersee?: boolean | null;

  @IsOptional()
  @IsString()
  montantIndemniteTeletravail?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HoraireDefautLigneDto)
  horaireDefautLignes?: HoraireDefautLigneDto[];

  /** Total de controle affiche cote client — recalcule et verifie par le serveur (ADR 0010). */
  @IsOptional()
  @IsString()
  totalControle?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HoraireMensuelLigneDto)
  horaireMensuelLignes?: HoraireMensuelLigneDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  joursFeriesTravaillesIds?: string[];
}

export class CreerCompteBancaireDto {
  @IsOptional()
  @IsString()
  libelle?: string;

  @IsOptional()
  @IsUUID()
  banqueId?: string | null;

  @IsOptional()
  @IsString()
  banqueSaisieLibre?: string | null;

  @IsOptional()
  @IsString()
  rib?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  bic?: string;

  @IsOptional()
  @IsString()
  nomPayeur?: string;

  @IsOptional()
  @IsBoolean()
  usageSalaires?: boolean;

  @IsOptional()
  @IsBoolean()
  usageCotisationsSociales?: boolean;

  @IsOptional()
  @IsBoolean()
  usageIR?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  etablissementIds?: string[];
}

export class ModifierCompteBancaireDto {
  @IsOptional()
  @IsString()
  libelle?: string | null;

  @IsOptional()
  @IsUUID()
  banqueId?: string | null;

  @IsOptional()
  @IsString()
  banqueSaisieLibre?: string | null;

  @IsOptional()
  @IsString()
  rib?: string | null;

  @IsOptional()
  @IsString()
  iban?: string | null;

  @IsOptional()
  @IsString()
  bic?: string | null;

  @IsOptional()
  @IsString()
  nomPayeur?: string | null;

  @IsOptional()
  @IsBoolean()
  usageSalaires?: boolean;

  @IsOptional()
  @IsBoolean()
  usageCotisationsSociales?: boolean;

  @IsOptional()
  @IsBoolean()
  usageIR?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  etablissementIds?: string[];
}
