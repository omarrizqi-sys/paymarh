import { Injectable, Logger } from '@nestjs/common';
import type { Uuid } from '@paymarh/shared-types';
import { PrismaService } from '../prisma/prisma.service.js';

/** Description d une action a consigner dans le journal. */
export interface AuditEntry {
  /** Auteur de l action. */
  readonly userId: Uuid;

  /** Verbe de l action, en MAJUSCULES_AVEC_UNDERSCORES. */
  readonly action: string;

  /** Type de la ressource visee (ex. "Company"). */
  readonly targetType: string;

  /** Identifiant de la ressource visee, ou null si l action est globale. */
  readonly targetId?: string | null;
}

/**
 * Journalisation des actions sensibles.
 *
 * ETAT AU MODULE 0 : le mecanisme est complet et fonctionnel, mais il n est
 * appele nulle part - aucune fonctionnalite n existe encore. La table est
 * donc vide, et c est normal.
 *
 * Il est cree des maintenant parce que la tracabilite est un principe
 * fondateur : tout acces elargi d un PLATFORM_ADMIN (voir
 * common/tenancy/tenant-scope.ts, fonction `crossAccountScope`) devra etre
 * accompagne d un appel a `record()` dans le meme flux.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
      },
    });

    this.logger.log(`Audit : ${entry.action} sur ${entry.targetType} par ${entry.userId}`);
  }
}
