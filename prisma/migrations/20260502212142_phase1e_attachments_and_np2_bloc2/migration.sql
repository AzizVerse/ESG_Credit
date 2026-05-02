-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApplicationAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "originalName" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "documentType" TEXT,
    "mimeType" TEXT,
    "description" TEXT,
    "uploadedById" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApplicationAttachment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ApplicationAttachment" ("applicationId", "createdAt", "description", "fileName", "filePath", "id", "mimeType", "updatedAt", "uploadedById") SELECT "applicationId", "createdAt", "description", "fileName", "filePath", "id", "mimeType", "updatedAt", "uploadedById" FROM "ApplicationAttachment";
DROP TABLE "ApplicationAttachment";
ALTER TABLE "new_ApplicationAttachment" RENAME TO "ApplicationAttachment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
