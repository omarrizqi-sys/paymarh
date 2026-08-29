import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

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

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL est absente. Copiez .env.example en .env a la racine du depot, puis relancez l'API."
      );
    }

    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connexion a PostgreSQL etablie.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
