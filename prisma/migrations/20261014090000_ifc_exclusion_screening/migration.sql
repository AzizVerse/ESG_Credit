CREATE TABLE "ExclusionScreening" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "applicationId" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'STANDARD_FI',
  "outcome" TEXT NOT NULL DEFAULT 'NOT_SCREENED',
  "answers" JSONB NOT NULL,
  "reasons" JSONB NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "screenedAt" DATETIME NOT NULL,
  CONSTRAINT "ExclusionScreening_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ExclusionScreening_applicationId_key" ON "ExclusionScreening"("applicationId");
CREATE TABLE "ExclusionScreeningEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "applicationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExclusionScreeningEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
