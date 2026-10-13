require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const scenarios = require("./presentation.scenarios");
const { calculateCategory } = require("../src/modules/scoring/scoring.category");
const { calculatePillars } = require("../src/modules/scoring/scoring.pillars");
const { buildRedFlags } = require("../src/modules/scoring/scoring.redFlags");
const { getSettings, resolveWeights } = require("../src/modules/scoring/scoring.settings");
const { calculate } = require("../src/modules/scoring/scoring.service");

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, "..");
const ADMIN_EMAIL = "admin@test.com";
const DEMO_PASSWORD = "123456";
const DAY = 86400000;

function headcount(scenario) {
  const femaleShare = { Technology: 0.4, "Industrie lourde": 0.2, Textile: 0.65, Agroalimentaire: 0.52, "BTP / construction": 0.12, Transport: 0.18 }[scenario.sector];
  const women = Math.round(scenario.staff * femaleShare);
  const men = scenario.staff - women;
  const roles = (total) => { const cadres = Math.round(total * 0.12); const supervision = Math.round(total * 0.22); return [cadres, supervision, total - cadres - supervision]; };
  const maleRoles = roles(men), femaleRoles = roles(women);
  const permanentMen = Math.round(men * 0.85), permanentWomen = Math.round(women * 0.85);
  return {
    NP2_HR_EFFECTIFS_CADRES_HOMMES: maleRoles[0], NP2_HR_EFFECTIFS_CADRES_FEMMES: femaleRoles[0],
    NP2_HR_EFFECTIFS_MAITRISE_HOMMES: maleRoles[1], NP2_HR_EFFECTIFS_MAITRISE_FEMMES: femaleRoles[1],
    NP2_HR_EFFECTIFS_AGENTS_HOMMES: maleRoles[2], NP2_HR_EFFECTIFS_AGENTS_FEMMES: femaleRoles[2],
    NP2_HR_EFFECTIFS_PERMANENT_HOMMES: permanentMen, NP2_HR_EFFECTIFS_PERMANENT_FEMMES: permanentWomen,
    NP2_HR_EFFECTIFS_INTERIMAIRE_HOMMES: men - permanentMen, NP2_HR_EFFECTIFS_INTERIMAIRE_FEMMES: women - permanentWomen,
  };
}

function buildTable(question, scenario) {
  if (question.code === "NP2_HR_ACCIDENT_TABLE") {
    return [{ nature: scenario.accidents ? "Recorded minor workplace injuries; corrective actions pending" : "No reportable occupational accidents in the last year", occurrence: scenario.accidents || 0 }];
  }
  const rows = structuredClone(question.metadata?.initialRows || []);
  const control = scenario.maturity === "weak" ? "NO" : "YES";
  const definition = {
    NP3_LIQUID_WASTE_TABLE: [scenario.waste?.liquid, ["YES", control, control]],
    NP3_SOLID_WASTE_TABLE: [scenario.waste?.solid, [control, control, control]],
    NP3_AIR_EMISSIONS_TABLE: [scenario.waste?.air, ["NO", "YES", scenario.sector === "Transport" ? "YES" : "NO", control, "YES", control]],
    NP3_HAZARDOUS_MATERIALS_TABLE: [scenario.waste?.hazardous, ["NO", "NO", "NO", "NO", "YES", control, control]],
  }[question.code];
  if (definition) {
    const [exposure, controls] = definition;
    return rows.map((row, index) => ({ ...row,
      response: index === 0 ? (exposure ? "YES" : "NO") : exposure ? controls[index - 1] : "NSP",
      value: index === 0 ? (exposure ? "Material activity exposure; see project profile" : "No exposure declared; subsequent controls are not applicable")
        : exposure ? (controls[index - 1] === "YES" ? "Control documented in the fictional scenario" : "Control gap: verification or corrective action required") : "Not applicable to the declared activity",
    }));
  }
  if (question.code === "NP3_EMERGENCY_PREPAREDNESS_TABLE") {
    const responses = [control, "YES", control, "NO"];
    if (scenario.slug === "southlink") responses[2] = "NSP";
    return rows.map((row, index) => ({ ...row, response: responses[index] }));
  }
  return rows;
}

function valueFor(question, scenario) {
  const code = question.code;
  if (question.type === "TABLE") return JSON.stringify(buildTable(question, scenario));
  if (scenario.overrides && Object.hasOwn(scenario.overrides, code)) return scenario.overrides[code];
  if (code.startsWith("CAT_")) return scenario.flags.includes(code) ? "YES" : "NO";
  if (code.startsWith("NP2_HS_B1_")) return scenario.exposures.includes(code) ? "YES" : "NO";
  if (["NP2_HR_Q003", "NP2_HR_Q004", "NP2_HR_Q015", "NP4_001", "NP5_001", "NP6_001", "NP6_002", "NP7_001", "NP8_001"].includes(code)) return "NO";
  if (code === "NP4_002" || code === "NP4_003") return scenario.flags.some((flag) => flag.startsWith("CAT_A_")) ? "YES" : "NO";
  const special = {
    REG_001: scenario.regulation[0], REG_002: scenario.regulation[0] === "YES" ? scenario.regulation[1] : "",
    REG_003: scenario.regulation[2], REG_004: scenario.regulation[3], REG_005: scenario.regulation[4], REG_006: "2026-08-12",
    REG_007: scenario.sector === "Technology" && scenario.slug === "atlas-tech" ? "No site-specific operating permit applicable to leased software offices" : "Applicable environmental, municipal and sector authorities (fictional file)",
    CERT_001: scenario.certifications.length ? "YES" : "NO",
    CERT_002: scenario.certifications.map((item) => ({ CERT_005: "HACCP", CERT_007: "ISO 9001", CERT_008: "ISO 14001", CERT_010: "OHSAS 18001 (legacy reference in the questionnaire)" }[item])).join(", "),
    CERT_011: "Current workplace safety practice follows ISO 45001 principles; no legacy OHSAS certification is claimed. All records are synthetic presentation examples.",
    NP2_HR_ORG_001: scenario.sector === "Technology" ? 1 : 2,
    NP2_HR_ORG_002: scenario.sector === "Technology" ? "09:00-17:00; scheduled on-call support with rest periods" : "Two scheduled shifts; rest periods and overtime tracking are documented",
    NP2_HR_ORG_003: scenario.sector === "Technology" ? 5 : 6,
    NP2_HS_B2_015: scenario.maturity === "weak" ? "2024-04-15" : "2026-08-20",
    NP2_HS_B2_017: "QUARTERLY", NP2_HS_B2_018: scenario.maturity === "weak" ? "2024-04-15" : "2026-09-10",
    CLIMATE_001: scenario.energy[0], CLIMATE_002: scenario.energy[1], CLIMATE_003: scenario.energy[2], CLIMATE_004: scenario.energy[3], CLIMATE_005: scenario.energy[4],
    CLIMATE_006: "Grid electricity accounts for the balance of total annual consumption.", CLIMATE_007: "YES", CLIMATE_008: scenario.plan,
    CLIMATE_009: scenario.plan === "PLANNED" ? 2027 : "",
    CLIMATE_010: scenario.plan === "YES" ? "Named project owner; quarterly energy monitoring; efficiency investment and measurable reduction targets for 2027." : "",
    CLIMATE_011: scenario.investment, CLIMATE_012: "Improved operating resilience; no guaranteed revenue increase is assumed.", CLIMATE_013: "Energy savings are a project objective, not a verified achieved result.",
    CLIMATE_014: ["Textile", "Agroalimentaire"].includes(scenario.sector) ? "YES" : "NO", CLIMATE_015: "",
    CLIMATE_016: JSON.stringify(["Textile", "Agroalimentaire"].includes(scenario.sector) ? ["EUROPE", "NORTH_AFRICA"] : []),
    ...headcount(scenario),
  };
  if (Object.hasOwn(special, code)) return special[code];
  if (code.startsWith("CERT_") && question.type === "BOOLEAN") return scenario.certifications.includes(code) ? "YES" : "NO";
  if (code.endsWith("_DETAILS")) {
    const parentCode = code.replace(/_DETAILS$/, "");
    const parent = scenario.overrides?.[parentCode] || (["NP4_002", "NP4_003"].includes(parentCode) && scenario.flags.some((flag) => flag.startsWith("CAT_A_")) ? "YES" : "");
    if (parent === "NO" || ["NP5_001", "NP6_001", "NP7_001", "NP8_001", "NP4_001"].includes(parentCode) && parent !== "YES") return "";
    return "Scenario measures: a responsible officer, documented procedures, worker or community consultation where applicable, and monitored corrective actions. " + scenario.notes;
  }
  if (question.type === "BOOLEAN") {
    if (scenario.maturity === "weak" && ["NP1_002", "NP1_003", "NP1_004", "NP1_005", "NP1_006", "NP1_007", "NP1_008", "NP2_HS_B2_003", "NP2_HS_B2_014", "NP2_HS_B2_019", "NP2_HS_B2_022", "NP2_HR_Q010", "NP2_HR_Q012", "NP2_HR_SUPPLIERS_001"].includes(code)) return "NO";
    return "YES";
  }
  return "";
}

function buildAnswers(sections, scenario) {
  const includedSections = scenario.partial ? new Set(["CATEGORIZATION", "REGULATORY_COMPLIANCE", "PERFORMANCE_STANDARD_2_HS_BLOC_2", "PERFORMANCE_STANDARD_3_EMERGENCY_PREPAREDNESS"]) : null;
  return sections.flatMap((section) => (includedSections && !includedSections.has(section.code) ? [] : section.questions).map((question) => {
    const value = valueFor(question, scenario);
    if (value === "" || value === null || value === undefined) return null;
    const answerValue = String(value);
    if (["BOOLEAN", "SINGLE_CHOICE"].includes(question.type) && !question.options.some((option) => option.value === answerValue)) throw new Error(`Invalid option ${question.code}: ${answerValue}`);
    if (question.type === "NUMBER" && !Number.isFinite(Number(value))) throw new Error(`Invalid number: ${question.code}`);
    const labels = { YES: "Yes", NO: "No", NA: "N/A", PLANNED: "Planned", QUARTERLY: "Quarterly", APPROVED_WITHOUT_RESERVES: "Approved without conditions", APPROVED_WITH_RESERVES: "Approved with conditions", UNDER_APPROVAL: "Under approval", IN_PROGRESS: "In progress" };
    return { section: section.code, questionCode: question.code, answerValue,
      answerLabel: question.type === "TABLE" ? "Completed scenario table" : labels[answerValue] || (["TEXT", "TEXTAREA", "NUMBER", "DATE"].includes(question.type) ? answerValue : "Europe, North Africa"),
      comment: question.hasComment ? `${scenario.maturity === "weak" ? "Control gaps require verification and corrective action." : "Declared practices are specific to this fictional case."} ${scenario.notes}` : null,
    };
  })).filter(Boolean);
}

async function loadTemplate() {
  const template = await prisma.formTemplate.findFirst({ where: { isActive: true }, include: { sections: { orderBy: { order: "asc" }, include: { questions: { orderBy: { order: "asc" }, include: { options: true } } } } } });
  if (!template) throw new Error("An active questionnaire is required. No data was removed.");
  return template;
}

async function preview() {
  const template = await loadTemplate();
  const settings = getSettings();
  const meta = Object.fromEntries(template.sections.flatMap((section) => section.questions.map((question) => [question.code, { label: question.label, type: question.type, sectionCode: section.code, sectionTitle: section.title }])));
  return scenarios.map((scenario) => {
    const answers = Object.fromEntries(buildAnswers(template.sections, scenario).map((answer) => [answer.questionCode, answer]));
    const category = calculateCategory(answers);
    const weights = resolveWeights({ activityType: scenario.sector }, {}, settings);
    const pillars = calculatePillars(answers, meta, weights.sector);
    const flags = buildRedFlags({ answersByCode: answers, category, detectedSector: weights.sector });
    return { company: scenario.name, sector: weights.sector, status: scenario.status, calculated: scenario.calculate, category: category.categoryAuto,
      global: Number((pillars.environmentScore * weights.environment + pillars.socialScore * weights.social + pillars.governanceScore * weights.governance).toFixed(2)), flags: flags.length,
    };
  });
}

async function main() {
  if (process.argv.includes("--preview")) { console.table(await preview()); return; }
  const template = await loadTemplate();
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin || admin.role !== "ADMIN") throw new Error("The existing admin@test.com administrator is required. No data was removed.");
  const prepared = scenarios.map((scenario) => ({ scenario, answers: buildAnswers(template.sections, scenario), documents: scenario.evidence.map((type) => {
    const filename = `${scenario.slug}-${type}.pdf`;
    const source = path.join(__dirname, "presentation-documents", filename);
    if (!fs.existsSync(source)) throw new Error(`Missing presentation evidence: ${filename}. No data was removed.`);
    return { type, filename, source };
  }) }));
  const replaceAll = process.argv.includes("--replace-all");
  const backupDirectory = path.join(ROOT, "backups");
  fs.mkdirSync(backupDirectory, { recursive: true });
  const backupPath = path.join(backupDirectory, `before-presentation-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
  await prisma.$executeRawUnsafe("VACUUM INTO ?", backupPath);
  const oldAttachments = await prisma.applicationAttachment.findMany({
    where: replaceAll ? {} : { application: { company: { name: { startsWith: "DEMO -" } } } },
    select: { filePath: true },
  });
  const uploadsRoot = path.join(ROOT, "uploads");
  const archivedFiles = [];
  for (const attachment of oldAttachments) {
    const absolutePath = path.resolve(ROOT, attachment.filePath);
    // Only archive and remove files inside this project's upload directory.
    if (!absolutePath.toLowerCase().startsWith((uploadsRoot + path.sep).toLowerCase()) || !fs.existsSync(absolutePath)) continue;
    const destination = path.join(backupPath + "-uploads", path.relative(uploadsRoot, absolutePath));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(absolutePath, destination);
    archivedFiles.push(absolutePath);
  }
  console.log(`Database backup: ${backupPath}`);
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const uploadDirectory = path.join(ROOT, "uploads", "presentation");
  fs.mkdirSync(uploadDirectory, { recursive: true });
  const created = [];
  await prisma.$transaction(async (tx) => {
    const companies = await tx.company.findMany({ where: replaceAll ? {} : { name: { startsWith: "DEMO -" } }, select: { id: true } });
    const ids = companies.map((company) => company.id);
    const applicationWhere = replaceAll ? {} : { companyId: { in: ids } };
    const applicationIds = (await tx.application.findMany({ where: applicationWhere, select: { id: true } })).map((application) => application.id);
    const childrenWhere = replaceAll ? {} : { applicationId: { in: applicationIds } };
    await tx.eSGAssessmentResult.deleteMany({ where: childrenWhere });
    await tx.questionnaireAnswer.deleteMany({ where: childrenWhere });
    await tx.adminReview.deleteMany({ where: childrenWhere });
    await tx.committeeDecision.deleteMany({ where: childrenWhere });
    await tx.correctiveAction.deleteMany({ where: childrenWhere });
    await tx.applicationAttachment.deleteMany({ where: childrenWhere });
    await tx.projectProfile.deleteMany({ where: replaceAll ? {} : { companyId: { in: ids } } });
    await tx.application.deleteMany({ where: applicationWhere });
    await tx.user.update({ where: { id: admin.id }, data: { companyId: null } });
    await tx.user.deleteMany({ where: { id: { not: admin.id }, ...(replaceAll ? {} : { companyId: { in: ids } }) } });
    await tx.company.deleteMany({ where: replaceAll ? {} : { id: { in: ids } } });

    for (const [index, item] of prepared.entries()) {
      const { scenario, answers, documents } = item;
      const createdAt = new Date(Date.now() - (scenarios.length - index) * 3 * DAY);
      const updatedAt = new Date(createdAt.getTime() + DAY);
      const company = await tx.company.create({ data: { name: `DEMO - ${scenario.name}`, legalForm: "SARL", sector: scenario.sector, activityDescription: scenario.description, address: `${scenario.location}, Tunisia (fictional presentation company)` } });
      const user = await tx.user.create({ data: { name: `${scenario.name} contact`, email: `${scenario.slug}.demo@test.com`, password: hashedPassword, role: "ENTERPRISE", companyId: company.id } });
      const category = calculateCategory(Object.fromEntries(answers.map((answer) => [answer.questionCode, answer])));
      const projectNature = scenario.slug === "medina-civil" ? "NEW_PROJECT" : "MODERNIZATION";
      const profile = { legalName: company.name, address: company.address, zoneType: ["Technology", "Transport"].includes(scenario.sector) ? "URBAN" : "PERI_URBAN", isIndustrialZone: ["Industrie lourde", "Textile", "Agroalimentaire"].includes(scenario.sector), contactName: "Presentation project coordinator", contactPosition: "Operations and ESG coordinator", creationDate: "2018-06-01", totalSurface: scenario.sector === "Technology" ? 1800 : 16000, coveredSurface: scenario.sector === "Technology" ? 1200 : 6500, projectNature, activitySector: scenario.sector, projectDescription: scenario.description };
      const application = await tx.application.create({ data: {
        companyId: company.id, status: scenario.status, projectName: scenario.project, projectType: projectNature, activityType: scenario.sector, financingAmount: scenario.amount, location: scenario.location, categoryAuto: category.categoryAuto, createdAt, updatedAt,
        projectProfile: { create: { companyId: company.id, projectNature, marketType: scenario.staff >= 200 ? "GE" : "PME", zoneType: profile.zoneType, projectSummary: JSON.stringify(profile), siteLocation: scenario.location, estimatedDuration: "12 months", createdAt, updatedAt } },
        questionnaireAnswers: { createMany: { data: answers } },
      } });
      for (const document of documents) {
        const filePath = path.join(uploadDirectory, document.filename);
        fs.copyFileSync(document.source, filePath);
        await tx.applicationAttachment.create({ data: { applicationId: application.id, originalName: `DEMO-${document.filename}`, fileName: document.filename, filePath, fileType: "application/pdf", mimeType: "application/pdf", fileSize: fs.statSync(filePath).size, documentType: document.type, description: "Synthetic presentation evidence only; not an actual certificate, approval or audit.", uploadedById: user.id, uploadedAt: updatedAt } });
      }
      if (scenario.status === "UNDER_REVIEW") await tx.adminReview.create({ data: { applicationId: application.id, reviewerId: admin.id, status: "IN_PROGRESS", notes: scenario.notes } });
      created.push({ scenario, id: application.id });
    }
  }, { timeout: 60000 });
  const results = [];
  for (const { scenario, id } of created) {
    const result = scenario.calculate ? await calculate(id) : null;
    const category = calculateCategory(Object.fromEntries(scenario.flags.map((code) => [code, { answerValue: "YES" }]))).categoryAuto;
    results.push({ company: scenario.name, sector: scenario.sector, status: scenario.status, category: result?.categoryAuto || category, risk: result?.riskLevel || "Not calculated", global: result?.scores?.global ?? "-", flags: result?.redFlags?.length ?? "-", login: `${scenario.slug}.demo@test.com` });
  }
  const summary = { generatedAt: new Date().toISOString(), companies: created.length, adminLogin: ADMIN_EMAIL, rows: results, backupPath };
  const newFiles = new Set(prepared.flatMap((item) => item.documents.map((document) => path.join(uploadDirectory, document.filename).toLowerCase())));
  for (const archivedFile of archivedFiles) {
    if (!newFiles.has(archivedFile.toLowerCase()) && fs.existsSync(archivedFile)) fs.unlinkSync(archivedFile);
  }
  fs.writeFileSync(path.join(backupDirectory, "presentation-seed-report.json"), JSON.stringify(summary, null, 2));
  const reportDirectory = path.join(ROOT, "docs");
  fs.mkdirSync(reportDirectory, { recursive: true });
  const report = ["# EQUORA Presentation Dataset", "", "All companies, contacts and evidence are fictional. Scores below are calculated by the existing engine with the currently saved sector settings.", "", "## Access", "", "Administrator: admin@test.com (existing password preserved). Company demonstration accounts use password 123456.", "", "## Scenario Matrix", "", "| Company | Sector | Status | Category | Risk | ESG score | Flags | Company login |", "|---|---|---|---|---|---:|---:|---|", ...results.map((row) => `| ${row.company} | ${row.sector} | ${row.status} | ${row.category} | ${row.risk} | ${row.global} | ${row.flags} | ${row.login} |`), "", "## Suggested Presentation Flow", "", "1. Dashboard: six sectors, score distribution, all risk levels, and missing assessments.", "2. Atlas Digital Solutions versus Meridian Cloud: technology C versus B physical exposure.", "3. Carthage Materials versus Nord Metals: same inherent category A, different controls and residual risks.", "4. DyeWorks Sahel: labor safeguards, effluent and chemical controls, red flags and recommendations.", "5. Cap Bon Food Processing: sector-specific food safety and wastewater evidence.", "6. Medina Civil Infrastructure: community engagement and involuntary resettlement with mitigation details.", "7. Urban Build Services: complete submitted application awaiting initial calculation.", "8. Oasis Cold Chain and SouthLink Freight: incomplete drafts, save-and-continue and unknown controls.", "9. Sector configuration: update a 100% weight distribution, then review the recalculation confirmation.", "", "## Regeneration", "", "npm run seed:demo replaces DEMO companies only and backs up the database. npm run seed:presentation:reset replaces all business records and non-primary users; use only in a disposable demonstration environment.", "", "Scoring settings and active questionnaire templates are preserved. No approvals, rejections or committee decisions are seeded.", "", `Database backup: ${backupPath}`, ""];
  fs.writeFileSync(path.join(reportDirectory, "presentation-dataset.md"), report.join("\n"));
  console.table(results);
  console.log("Presentation data ready. Admin login and scoring configuration preserved. Demo company password: 123456.");
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
module.exports = { buildAnswers, headcount, preview };
