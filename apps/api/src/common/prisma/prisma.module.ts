import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Module global : PrismaService est injectable partout sans re-import.
 * C est le seul module marque @Global du projet, precisement parce qu il
 * represente une ressource unique et partagee (la connexion a la base).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
