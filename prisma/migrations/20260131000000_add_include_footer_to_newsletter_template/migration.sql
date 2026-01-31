-- AlterTable
DO $$ BEGIN
  ALTER TABLE "NewsletterTemplate" ADD COLUMN "includeFooter" BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
