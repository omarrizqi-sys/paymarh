import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { API_VERSION } from './version.js';

/**
 * Point d entree de l API PaymaRH.
 *
 * Rappel du principe "API d abord" : ce processus detient la totalite de la
 * logique. Le back-office, le futur portail salarie et la future application
 * mobile ne sont que des clients de cette API.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Validation systematique des entrees. `whitelist` supprime tout champ non
  // declare dans les DTO : un client ne peut pas glisser de propriete
  // inattendue dans une requete.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const corsOrigins = (configService.get<string>('API_CORS_ORIGINS') ?? 'http://localhost:3000')
    .split(',')
    .map((origine) => origine.trim())
    .filter((origine) => origine.length > 0);

  app.enableCors({ origin: corsOrigins, credentials: true });

  // Arret propre : ferme la connexion PostgreSQL avant de quitter.
  app.enableShutdownHooks();

  const port = Number(configService.get<string>('API_PORT') ?? 3001);
  await app.listen(port);

  logger.log(`API PaymaRH v${API_VERSION} a l'ecoute sur http://localhost:${port}`);
  logger.log(`Temoin de sante : http://localhost:${port}/health`);
}

void bootstrap();
