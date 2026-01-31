-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN "dailyEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Subscriber" ADD COLUMN "weeklyEnabled" BOOLEAN NOT NULL DEFAULT true;
