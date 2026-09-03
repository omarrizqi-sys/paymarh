import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreerSalarieDto {
  @IsOptional()
  @IsString()
  matricule?: string;

  @IsString()
  @MaxLength(200)
  nom!: string;

  @IsString()
  @MaxLength(200)
  prenom!: string;

  @IsEnum(['HOMME', 'FEMME'])
  sexe!: 'HOMME' | 'FEMME';

  @IsDateString()
  dateNaissance!: string;

  @IsOptional()
  @IsString()
  villeNaissance?: string;

  @IsOptional()
  @IsUUID()
  paysNaissanceId?: string;

  @IsOptional()
  @IsUUID()
  nationaliteId?: string;

  @IsOptional()
  @IsString()
  situationFamilialeCode?: string;

  @IsOptional()
  @IsString()
  numeroPiece?: string;

  @IsOptional()
  @IsString()
  numeroCnss?: string;

  @IsOptional()
  @IsString()
  numeroCimr?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  complementAdresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  codePostal?: string;

  @IsOptional()
  @IsUUID()
  paysId?: string;

  @IsOptional()
  @IsString()
  telephonePersonnel?: string;

  @IsOptional()
  @IsString()
  telephoneProfessionnel?: string;

  @IsOptional()
  @IsString()
  emailPersonnel?: string;

  @IsOptional()
  @IsString()
  emailProfessionnel?: string;

  @IsOptional()
  @IsString()
  urgencePrenom?: string;

  @IsOptional()
  @IsString()
  urgenceNom?: string;

  @IsOptional()
  @IsString()
  urgenceTelephone?: string;

  @IsOptional()
  @IsString()
  urgenceEmail?: string;

  @IsDateString()
  dateEntree!: string;

  @IsOptional()
  @IsDateString()
  dateAnciennete?: string;
}

/** Saisie partielle pour le pre-controle — tous les champs optionnels. */
export class VerifierSalarieDto {
  @IsOptional()
  @IsString()
  matricule?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsEnum(['HOMME', 'FEMME'])
  sexe?: 'HOMME' | 'FEMME';

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsOptional()
  @IsString()
  numeroPiece?: string;

  @IsOptional()
  @IsString()
  numeroCnss?: string;

  @IsOptional()
  @IsString()
  codePostal?: string;

  @IsOptional()
  @IsUUID()
  paysId?: string;

  @IsOptional()
  @IsString()
  emailPersonnel?: string;

  @IsOptional()
  @IsString()
  emailProfessionnel?: string;

  @IsOptional()
  @IsString()
  telephonePersonnel?: string;

  @IsOptional()
  @IsString()
  telephoneProfessionnel?: string;

  @IsOptional()
  @IsString()
  urgenceEmail?: string;

  @IsOptional()
  @IsString()
  urgenceTelephone?: string;

  @IsOptional()
  @IsDateString()
  dateEntree?: string;

  @IsOptional()
  @IsDateString()
  dateAnciennete?: string;
}

export class ModifierIdentiteSalarieDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsEnum(['HOMME', 'FEMME'])
  sexe?: 'HOMME' | 'FEMME';

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  villeNaissance?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  paysNaissanceId?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  nationaliteId?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  situationFamilialeCode?: string | null;
}

export class ModifierCoordonneesSalarieDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  adresse?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  complementAdresse?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  ville?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  codePostal?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  paysId?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  telephonePersonnel?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  telephoneProfessionnel?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  emailPersonnel?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  emailProfessionnel?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  urgencePrenom?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  urgenceNom?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  urgenceTelephone?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  urgenceEmail?: string | null;
}

export class ModifierIdentifiantsLegauxSalarieDto {
  @IsOptional()
  @IsString()
  matricule?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  numeroPiece?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  numeroCnss?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  numeroCimr?: string | null;
}

export class ModifierDatesSalarieDto {
  @IsOptional()
  @IsDateString()
  dateEntree?: string;

  @IsOptional()
  @IsDateString()
  dateAnciennete?: string;
}

export class ListerSalariesQueryDto {
  @IsOptional()
  @IsString()
  curseur?: string;

  @IsOptional()
  @IsEnum(['ACTIF', 'INACTIF'])
  etat?: 'ACTIF' | 'INACTIF';

  @IsOptional()
  @IsUUID()
  etablissementId?: string;

  @IsOptional()
  @IsString()
  recherche?: string;

  @IsOptional()
  limite?: number;
}
