import { Controller, type MiddlewareConsumer, Module, type NestModule, Post } from '@nestjs/common';
import { RouteSansEcriture } from '../../../common/conformite-routes/route-sans-ecriture.decorator.js';
import { PrismaModule } from '../../../common/prisma/prisma.module.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { TenancyModule } from '../../../common/tenancy/tenancy.module.js';
import { TenantContextMiddleware } from '../../../common/tenancy/tenant-context.middleware.js';
import { RequiertPermission } from '../../../common/permissions/requiert-permission.decorator.js';

@Controller('probe-sans-ecriture')
export class ProbeSansEcritureController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('tenter-ecriture')
  @RequiertPermission('salarie.lire')
  @RouteSansEcriture()
  async tenterEcriture() {
    await this.prisma.salarie.updateMany({
      where: { id: '00000000-0000-4000-8000-000000000000' },
      data: { nom: 'probe-ecriture' },
    });
    return { donnees: { ok: true } };
  }
}

@Module({
  imports: [PrismaModule, TenancyModule],
  controllers: [ProbeSansEcritureController],
})
export class ProbeSansEcritureModule implements NestModule {
  readonly probe = true;

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes(ProbeSansEcritureController);
  }
}
