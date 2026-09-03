import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuditEntry } from './audit-entry.js';

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
            : (entry.ecart as Prisma.InputJsonValue),
      },
    });

    this.logger.log(`Audit : ${entry.action} sur ${entry.targetType} par ${entry.userId}`);
  }
}
