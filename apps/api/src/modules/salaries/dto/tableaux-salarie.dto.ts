import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreerPersonneAChargeDto {
  @IsString()
  lienParenteCode!: string;

  @IsString()
  prenom!: string;

  @IsString()
  nom!: string;

  @IsEnum(['HOMME', 'FEMME'])
  sexe!: 'HOMME' | 'FEMME';

  @IsDateString()
  dateNaissance!: string;

  @IsBoolean()
  aCharge!: boolean;

  @IsOptional()
  @IsBoolean()
  situationHandicap?: boolean;
}

export class ModifierPersonneAChargeDto {
  @IsOptional()
  @IsString()
  lienParenteCode?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsEnum(['HOMME', 'FEMME'])
  sexe?: 'HOMME' | 'FEMME';

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsOptional()
  @IsBoolean()
  aCharge?: boolean;

  @IsOptional()
  @IsBoolean()
  situationHandicap?: boolean;
}

export class CompteBancaireSalarieSaisieDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  banqueId?: string | null;

  @IsOptional()
  @IsString()
  banqueLibreSaisie?: string | null;

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
  titulaire?: string | null;

  @IsOptional()
  @IsString()
  partVirement?: string | null;
}

export class RemplacerComptesBancairesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompteBancaireSalarieSaisieDto)
  comptes!: CompteBancaireSalarieSaisieDto[];
}

export class CreerPretDto {
  @IsString()
  libelleObjet!: string;

  @IsString()
  libelleBulletin!: string;

  @IsString()
  montantTotal!: string;

  @IsString()
  moisDebut!: string;

  @IsString()
  mensualite!: string;

  @IsInt()
  @Min(1)
  nombreEcheances!: number;
}

export class ModifierPretDto {
  @IsOptional()
  @IsString()
  libelleObjet?: string;

  @IsOptional()
  @IsString()
  libelleBulletin?: string;

  @IsOptional()
  @IsString()
  montantTotal?: string;

  @IsOptional()
  @IsString()
  moisDebut?: string;

  @IsOptional()
  @IsString()
  mensualite?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  nombreEcheances?: number;
}

export class CreerSaisieSurSalaireDto {
  @IsString()
  referenceDecision!: string;

  @IsString()
  creancier!: string;

  @IsString()
  libelleBulletin!: string;

  @IsString()
  montantTotal!: string;

  @IsString()
  montantMensuel!: string;

  @IsString()
  moisDebut!: string;
}

export class ModifierSaisieSurSalaireDto {
  @IsOptional()
  @IsString()
  referenceDecision?: string;

  @IsOptional()
  @IsString()
  creancier?: string;

  @IsOptional()
  @IsString()
  libelleBulletin?: string;

  @IsOptional()
  @IsString()
  montantTotal?: string;

  @IsOptional()
  @IsString()
  montantMensuel?: string;

  @IsOptional()
  @IsString()
  moisDebut?: string;
}
