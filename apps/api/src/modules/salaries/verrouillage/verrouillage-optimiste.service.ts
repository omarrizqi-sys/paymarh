import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CODES_REPONSE } from '../reponses/codes-reponse.js';

export const EN_TETE_IF_MATCH = 'if-match';

export interface MiseAJourOptimisteSalarie {
  readonly id: string;
  readonly versionAttendue: number;
  readonly donnees: Record<string, unknown>;
}

export interface MiseAJourOptimisteEmploi {
  readonly id: string;
  readonly versionAttendue: number;
  readonly donnees: Record<string, unknown>;
}

@Injectable()
export class VerrouillageOptimisteService {
  constructor(private readonly prisma: PrismaService) {}

  exigerVersion(enTete: string | undefined): number {
    if (enTete === undefined || enTete.trim().length === 0) {
      throw new HttpException(
        {
          code: CODES_REPONSE.EN_TETE_IF_MATCH_REQUIS.code,
          message: CODES_REPONSE.EN_TETE_IF_MATCH_REQUIS.message,
        },
        HttpStatus.PRECONDITION_REQUIRED
      );
    }

    const version = Number.parseInt(enTete.trim(), 10);
    if (!Number.isInteger(version) || version < 0) {
      throw new HttpException(
        {
          code: CODES_REPONSE.EN_TETE_IF_MATCH_REQUIS.code,
          message: CODES_REPONSE.EN_TETE_IF_MATCH_REQUIS.message,
        },
        HttpStatus.PRECONDITION_REQUIRED
      );
    }

    return version;
  }

  async modifierSalarie(
    params: MiseAJourOptimisteSalarie,
    client: { salarie: PrismaService['salarie'] } = this.prisma
  ) {
    const { count } = await client.salarie.updateMany({
      where: { id: params.id, version: params.versionAttendue },
      data: {
        ...params.donnees,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException({
        code: CODES_REPONSE.CONFLIT_VERSION.code,
        message: CODES_REPONSE.CONFLIT_VERSION.message,
      });
    }

    return client.salarie.findUniqueOrThrow({ where: { id: params.id } });
  }

  async modifierEmploi(params: MiseAJourOptimisteEmploi) {
    const { count } = await this.prisma.emploi.updateMany({
      where: { id: params.id, version: params.versionAttendue },
      data: {
        ...params.donnees,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException({
        code: CODES_REPONSE.CONFLIT_VERSION.code,
        message: CODES_REPONSE.CONFLIT_VERSION.message,
      });
    }

    return this.prisma.emploi.findUniqueOrThrow({ where: { id: params.id } });
  }
}
