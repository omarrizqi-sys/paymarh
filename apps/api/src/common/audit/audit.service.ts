import { Injectable, Logger } from '@nestjs/common';
import type { AuditEcart } from '@paymarh/shared-types';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuditEntry } from './audit-entry.js';

function ecartVersInputJson(ecart: AuditEcart): Prisma.InputJsonValue {
  const serialisable = {
    champs: ecart.champs.map((champ) => ({
      nom: champ.nom,
      ancienne: champ.ancienne,
      nouvelle: champ.nouvelle,
    })),
  };
  return JSON.parse(JSON.stringify(serialisable)) as Prisma.InputJsonValue;
}

/**
 * Journalisation des actions sensibles.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        accountId: entry.accountId ?? null,
        companyId: entry.companyId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        ecart:
          entry.ecart === undefined || entry.ecart === null
            ? Prisma.JsonNull
            : ecartVersInputJson(entry.ecart),
      },
    });

    this.logger.log(`Audit : ${entry.action} sur ${entry.targetType} par ${entry.userId}`);
  }
}
