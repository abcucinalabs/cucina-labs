-- AlterTable
DO $$ BEGIN
  ALTER TABLE "Subscriber" ADD COLUMN "dailyEnabled" BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Subscriber" ADD COLUMN "weeklyEnabled" BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
