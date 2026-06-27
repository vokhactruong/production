-- CreateTable
CREATE TABLE "pending_deletions" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastTriedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_deletions_pkey" PRIMARY KEY ("id")
);
