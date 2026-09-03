-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "accountId" UUID,
ADD COLUMN     "companyId" UUID,
ADD COLUMN     "ecart" JSONB;

-- AlterTable
ALTER TABLE "Emploi" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Salarie" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "AuditLog_accountId_idx" ON "AuditLog"("accountId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");
