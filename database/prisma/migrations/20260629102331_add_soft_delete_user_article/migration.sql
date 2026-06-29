-- AlterTable: add deletedAt to users
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: add deletedAt to articles
ALTER TABLE "articles" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "articles_deletedAt_idx" ON "articles"("deletedAt");
