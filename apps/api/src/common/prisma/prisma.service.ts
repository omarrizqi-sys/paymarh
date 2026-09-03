import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { RequeteSansEcritureContextService } from '../conformite-routes/requete-sans-ecriture-context.service.js';
import { creerExtensionGardeSansEcriture } from './prisma-sans-ecriture-extension.js';

/**
 * Unique porte d entree vers PostgreSQL.
 *
 * AUCUN module ne doit ouvrir sa propre connexion ni ecrire de SQL brut :
 * tout passe par ce service (principe "un seul detenteur de la donnee").
 *
 * Depuis Prisma 7, la connexion n est plus decrite dans schema.prisma : elle
 * est fournie au client sous forme d adaptateur de driver (ici `pg`).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService, sansEcriture: RequeteSansEcritureContextService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL est absente. Copiez .env.example en .env a la racine du depot, puis relancez l'API."
      );
    }

    super({ adapter: new PrismaPg({ connectionString }) });
    const etendu = this.$extends(creerExtensionGardeSansEcriture(sansEcriture));
    return etendu as unknown as this;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connexion a PostgreSQL etablie.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
