-- AlterTable
ALTER TABLE "FormSection" ADD COLUMN "description" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FormQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "hasComment" BOOLEAN NOT NULL DEFAULT false,
    "isFilterQuestion" BOOLEAN NOT NULL DEFAULT false,
    "requiresAttachment" BOOLEAN NOT NULL DEFAULT false,
    "helpText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FormQuestion" ("code", "createdAt", "hasComment", "helpText", "id", "isFilterQuestion", "isRequired", "label", "order", "sectionId", "type", "updatedAt") SELECT "code", "createdAt", "hasComment", "helpText", "id", "isFilterQuestion", "isRequired", "label", "order", "sectionId", "type", "updatedAt" FROM "FormQuestion";
DROP TABLE "FormQuestion";
ALTER TABLE "new_FormQuestion" RENAME TO "FormQuestion";
CREATE UNIQUE INDEX "FormQuestion_sectionId_code_key" ON "FormQuestion"("sectionId", "code");
CREATE UNIQUE INDEX "FormQuestion_sectionId_order_key" ON "FormQuestion"("sectionId", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
