-- AlterTable: add nullable first, backfill, then set NOT NULL
ALTER TABLE "Cycle" ADD COLUMN "cycleStartDate" TIMESTAMP(3);

UPDATE "Cycle" SET "cycleStartDate" = "cycleEndDate" - INTERVAL '30 days' WHERE "cycleStartDate" IS NULL;

ALTER TABLE "Cycle" ALTER COLUMN "cycleStartDate" SET NOT NULL;
