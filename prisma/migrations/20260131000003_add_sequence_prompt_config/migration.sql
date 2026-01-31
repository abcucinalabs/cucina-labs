-- CreateTable
CREATE TABLE IF NOT EXISTS "SequencePromptConfig" (
    "id" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SequencePromptConfig_pkey" PRIMARY KEY ("id")
);

-- AlterTable: make Sequence.userPrompt optional
DO $$ BEGIN
  ALTER TABLE "Sequence" ALTER COLUMN "userPrompt" DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- AlterTable: add topicId to Sequence
DO $$ BEGIN
  ALTER TABLE "Sequence" ADD COLUMN "topicId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
