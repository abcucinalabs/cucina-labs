-- AlterTable
DO $$ BEGIN
  ALTER TABLE "Sequence" ADD COLUMN "contentSources" TEXT[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
