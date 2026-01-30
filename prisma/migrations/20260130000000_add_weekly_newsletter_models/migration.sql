-- CreateTable
CREATE TABLE IF NOT EXISTS "SavedContent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedInId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WeeklyNewsletter" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "chefsTableTitle" TEXT,
    "chefsTableBody" TEXT,
    "newsItems" JSONB,
    "recipeIds" TEXT[],
    "cookingItems" JSONB,
    "systemPrompt" TEXT,
    "generatedAt" TIMESTAMP(3),
    "audienceId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyNewsletter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedContent_type_idx" ON "SavedContent"("type");
CREATE INDEX IF NOT EXISTS "SavedContent_used_idx" ON "SavedContent"("used");
CREATE INDEX IF NOT EXISTS "SavedContent_createdAt_idx" ON "SavedContent"("createdAt");
CREATE INDEX IF NOT EXISTS "WeeklyNewsletter_weekStart_idx" ON "WeeklyNewsletter"("weekStart");
CREATE INDEX IF NOT EXISTS "WeeklyNewsletter_status_idx" ON "WeeklyNewsletter"("status");
