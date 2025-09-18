-- CreateTable
CREATE TABLE "public"."Issue" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reporterName" TEXT,
    "lessonNumber" INTEGER NOT NULL,
    "sentenceIndex" INTEGER NOT NULL,
    "typo" BOOLEAN NOT NULL DEFAULT false,
    "missingReference" BOOLEAN NOT NULL DEFAULT false,
    "incorrectReference" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Issue_lessonNumber_sentenceIndex_idx" ON "public"."Issue"("lessonNumber", "sentenceIndex");

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
