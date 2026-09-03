import { IsArray, IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreerPrimeContractuelleDto {
  @IsString()
  primeRef!: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(12, { each: true })
  moisApplication!: number[];
}

export class ModifierPrimeContractuelleDto {
  @IsOptional()
  @IsString()
  primeRef?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(12, { each: true })
  moisApplication?: number[];
}

export class CreerAvantageEnNatureDto {
  @IsString()
  natureRef!: string;

  @IsString()
  montant!: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(12, { each: true })
  moisApplication!: number[];
}

export class ModifierAvantageEnNatureDto {
  @IsOptional()
  @IsString()
  natureRef?: string;

  @IsOptional()
  @IsString()
  montant?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(12, { each: true })
  moisApplication?: number[];
}

export class CreerStatutParticulierDto {
  @IsString()
  statutCode!: string;

  @IsDateString()
  dateDebut!: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string | null;
}

export class ModifierStatutParticulierDto {
  @IsOptional()
  @IsString()
  statutCode?: string;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string | null;
}
