-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalForm" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "activityDescription" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "projectName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "financingAmount" REAL NOT NULL,
    "location" TEXT NOT NULL,
    "categoryAuto" TEXT NOT NULL,
    "categoryFinal" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionnaireAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "answerValue" TEXT NOT NULL,
    "answerLabel" TEXT,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuestionnaireAnswer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectNature" TEXT,
    "marketType" TEXT,
    "zoneType" TEXT,
    "projectSummary" TEXT,
    "siteLocation" TEXT,
    "estimatedDuration" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FormSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "hasComment" BOOLEAN NOT NULL DEFAULT false,
    "isFilterQuestion" BOOLEAN NOT NULL DEFAULT false,
    "helpText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormQuestionOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "description" TEXT,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApplicationAttachment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminReview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdminReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommitteeDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "decidedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommitteeDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommitteeDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME,
    "assignedToId" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CorrectiveAction_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CorrectiveAction_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireAnswer_applicationId_questionCode_key" ON "QuestionnaireAnswer"("applicationId", "questionCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectProfile_applicationId_key" ON "ProjectProfile"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_name_version_key" ON "FormTemplate"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FormSection_templateId_code_key" ON "FormSection"("templateId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FormSection_templateId_order_key" ON "FormSection"("templateId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "FormQuestion_sectionId_code_key" ON "FormQuestion"("sectionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FormQuestion_sectionId_order_key" ON "FormQuestion"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "FormQuestionOption_questionId_value_key" ON "FormQuestionOption"("questionId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "FormQuestionOption_questionId_order_key" ON "FormQuestionOption"("questionId", "order");
