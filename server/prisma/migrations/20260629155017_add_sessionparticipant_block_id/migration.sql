-- AlterTable
ALTER TABLE "SessionParticipant" ADD COLUMN     "blockId" TEXT;

-- CreateIndex
CREATE INDEX "SessionParticipant_blockId_idx" ON "SessionParticipant"("blockId");
