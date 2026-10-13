require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { calculate } = require("../src/modules/scoring/scoring.service");
const { calculateCategory } = require("../src/modules/scoring/scoring.category");

const prisma = new PrismaClient();
const applicationId = "demo-fi-sme-financing-example";

async function main() {
  let application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) {
    const source = await prisma.application.findFirst({
      where: { company: { name: "DEMO - Atlas Digital Solutions" }, categoryAuto: "C" },
      include: { questionnaireAnswers: true },
    });
    if (!source?.questionnaireAnswers.length) throw new Error("The fictional Atlas demonstration questionnaire is required. No records were changed.");
    const answers = source.questionnaireAnswers.map(({ section, questionCode, answerValue, answerLabel }) => ({
      section, questionCode,
      answerValue: questionCode.startsWith("CAT_") ? (questionCode === "CAT_FI_001" ? "YES" : "NO") : answerValue,
      answerLabel: questionCode.startsWith("CAT_") ? (questionCode === "CAT_FI_001" ? "Yes" : "No") : answerLabel,
      comment: "Fictional FI demonstration. Office controls are adapted from the existing synthetic Atlas questionnaire; these are illustrative declarations, not verified evidence.",
    }));
    const category = calculateCategory(Object.fromEntries(answers.map((answer) => [answer.questionCode, answer])));
    if (category.categoryAuto !== "FI") throw new Error("The active demonstration answers did not produce FI. No records were changed.");
    const email = "fi-sme.example.demo@test.com";
    if (await prisma.user.findUnique({ where: { email } })) throw new Error("The FI demo email is already in use. No records were changed.");
    const backupDirectory = path.join(__dirname, "..", "backups");
    fs.mkdirSync(backupDirectory, { recursive: true });
    const backupPath = path.join(backupDirectory, `before-fi-example-${Date.now()}.db`);
    await prisma.$executeRawUnsafe("VACUUM INTO ?", backupPath);
    const password = await bcrypt.hash("123456", 10);
    const description = "Fictional financial intermediary providing SME loans through a digital lending platform. The example finances small business working capital and energy-efficiency investments, with illustrative borrower E&S screening, exclusion checks, complaints handling and portfolio monitoring. No real loans, approvals or supporting evidence are claimed.";
    application = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({ data: {
        name: "DEMO - FI Example - SME Finance", legalForm: "SA", sector: "Autre",
        activityDescription: description, address: "Tunis, Tunisia (fictional demo company)",
        users: { create: { name: "FI demonstration contact", email, password, role: "ENTERPRISE" } },
      } });
      const profile = {
        legalName: company.name, address: company.address, zoneType: "URBAN", isIndustrialZone: false,
        contactName: "FI demonstration contact", contactPosition: "Portfolio ESG coordinator",
        creationDate: "2020-01-01", totalSurface: 600, coveredSurface: 600,
        projectNature: "MODERNIZATION", activitySector: "Autre", projectDescription: description,
      };
      return tx.application.create({ data: {
        id: applicationId, companyId: company.id, status: "SUBMITTED",
        projectName: "FI example — SME lending and green finance platform", projectType: "MODERNIZATION",
        activityType: "Financial intermediary", financingAmount: 2500000, location: "Tunis, Tunisia",
        categoryAuto: "FI", questionnaireAnswers: { createMany: { data: answers } },
        projectProfile: { create: { companyId: company.id, projectNature: "MODERNIZATION", zoneType: "URBAN",
          projectSummary: JSON.stringify(profile), siteLocation: "Tunis, Tunisia", estimatedDuration: "12 months" } },
      } });
    });
    console.log(`Created fictional FI example. Database backup: ${backupPath}`);
  }
  await calculate(application.id);
  const saved = await prisma.application.findUnique({ where: { id: applicationId }, include: { esgAssessmentResult: true } });
  if (saved.categoryAuto !== "FI" || saved.esgAssessmentResult?.categoryAuto !== "FI") throw new Error("FI category verification failed.");
  console.log(JSON.stringify({ id: saved.id, project: saved.projectName, category: saved.esgAssessmentResult.categoryAuto,
    score: saved.esgAssessmentResult.globalScore, risk: saved.esgAssessmentResult.riskLevel, status: saved.status }));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
