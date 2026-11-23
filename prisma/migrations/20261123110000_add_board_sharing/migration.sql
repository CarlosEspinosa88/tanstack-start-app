CREATE TYPE "BoardShareStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');

CREATE TABLE "BoardShare" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "BoardShareStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BoardShare_ownerId_recipientId_key"
ON "BoardShare"("ownerId", "recipientId");
CREATE INDEX "BoardShare_recipientId_status_idx"
ON "BoardShare"("recipientId", "status");
CREATE INDEX "BoardShare_ownerId_status_idx"
ON "BoardShare"("ownerId", "status");

ALTER TABLE "BoardShare"
ADD CONSTRAINT "BoardShare_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardShare"
ADD CONSTRAINT "BoardShare_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
