const { PrismaClient, ApplicationStatus } = require("@prisma/client");

const ApiError = require("../../utils/apiError");
const { calculateCategory } = require("./scoring.category");
const { calculatePillars } = require("./scoring.pillars");
const { buildRedFlags } = require("./scoring.redFlags");
const { buildRecommendations } = require("./scoring.recommendations");
const { detectSector } = require("./scoring.sectorWeights");
const { roundScore } = require("./scoring.rules");

const prisma = new PrismaClient();
const ENGINE_VERSION = "RULES_V1";
const RISK_ORDER = ["Faible", "Modéré", "Substantiel", "Élevé"];

function parseProjectProfileDetails(projectProfile) {
  if (!projectProfile?.projectSummary) {
    return {};
  }

  try {
    return JSON.parse(projectProfile.projectSummary);
  } catch (error) {
    return {};
  }
}

function buildQuestionMeta(formTemplate) {
  const questionMeta = {};

  for (const section of formTemplate?.sections || []) {
    for (const question of section.questions || []) {
      questionMeta[question.code] = {
        label: question.label,
        type: question.type,
        sectionCode: section.code,
        sectionTitle: section.title,
      };
    }
  }

  return questionMeta;
}

function buildAnswersByCode(answers) {
  return answers.reduce((accumulator, answer) => {
    accumulator[answer.questionCode] = answer;
    return accumulator;
  }, {});
}

function clampRisk(level) {
  const index = RISK_ORDER.indexOf(level);
  return Math.max(0, index);
}

function resolveRiskLevel({ categoryAuto, globalScore, governanceScore, redFlags }) {
  const baseByCategory = {
    A: "Substantiel",
    "B+": "Substantiel",
    B: "Modéré",
    C: "Faible",
    FI: "Modéré",
    "À déterminer": "Modéré",
  };

  let riskIndex = clampRisk(baseByCategory[categoryAuto] || "Modéré");

  if (globalScore >= 80) riskIndex -= 1;
  else if (globalScore >= 60) riskIndex += 0;
  else if (globalScore >= 40) riskIndex += 1;
  else riskIndex += 2;

  const criticalCount = redFlags.filter((flag) => flag.severity === "CRITICAL").length;
  const majorCount = redFlags.filter((flag) => flag.severity === "MAJOR").length;

  if (criticalCount > 0) {
    riskIndex = Math.max(riskIndex, RISK_ORDER.indexOf("Élevé"));
  } else if (majorCount >= 2) {
    riskIndex = Math.max(riskIndex, RISK_ORDER.indexOf("Substantiel"));
  }

  if (categoryAuto === "A" && majorCount >= 1) {
    riskIndex = Math.max(riskIndex, RISK_ORDER.indexOf("Élevé"));
  }

  if (categoryAuto === "FI" && governanceScore < 50) {
    riskIndex = Math.max(riskIndex, RISK_ORDER.indexOf("Substantiel"));
  }

  riskIndex = Math.min(Math.max(riskIndex, 0), RISK_ORDER.length - 1);
  return RISK_ORDER[riskIndex];
}

function getGlobalScore(scores, weights) {
  return roundScore(
    scores.environmentScore * weights.environment +
      scores.socialScore * weights.social +
      scores.governanceScore * weights.governance
  );
}

function mergeUnique(primary, secondary) {
  const merged = new Set([...(primary || []), ...(secondary || [])]);
  return Array.from(merged);
}

function normalizeInsightText(text) {
  if (!text) {
    return "";
  }

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/etude d[' ]impact (sur l[' ]?)?environnement(al)?/g, "etude impact environnement")
    .replace(
      /systeme (d[' ]evaluation et de suivi|de gestion) des risques e&s/g,
      "systeme risques es"
    )
    .replace(/conscience des enjeux climatiques|sensibilisation climatique/g, "sensibilisation climatique")
    .replace(/plan de securite ?\/ ?evacuation|plan de securite ou d[' ]evacuation/g, "plan securite evacuation")
    .replace(/declaration du personnel a la securite sociale declaree|personnel declare a la securite sociale/g, "personnel declare securite sociale")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeInsightEntries(entries, { excludedEntries = [] } = {}) {
  const excludedCodes = new Set(
    excludedEntries.map((entry) => entry?.questionCode).filter(Boolean)
  );
  const excludedTexts = new Set(
    excludedEntries.map((entry) => normalizeInsightText(entry?.message)).filter(Boolean)
  );
  const seenCodes = new Set();
  const seenTexts = new Set();
  const result = [];

  for (const entry of entries || []) {
    const normalizedText = normalizeInsightText(entry?.message);
    const questionCode = entry?.questionCode || null;

    if (!entry?.message) {
      continue;
    }

    if ((questionCode && excludedCodes.has(questionCode)) || excludedTexts.has(normalizedText)) {
      continue;
    }

    if (questionCode) {
      if (seenCodes.has(questionCode)) {
        continue;
      }
      seenCodes.add(questionCode);
      seenTexts.add(normalizedText);
      result.push(entry.message);
      continue;
    }

    if (seenTexts.has(normalizedText)) {
      continue;
    }

    seenTexts.add(normalizedText);
    result.push(entry.message);
  }

  return result;
}

function toResponse(result) {
  return {
    id: result.id,
    applicationId: result.applicationId,
    categoryAuto: result.categoryAuto,
    scores: {
      environment: result.environmentScore,
      social: result.socialScore,
      governance: result.governanceScore,
      global: result.globalScore,
    },
    riskLevel: result.riskLevel,
    sector: result.sectorWeights?.sector || "Général",
    sectorWeights: result.sectorWeights,
    redFlags: result.redFlags,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    recommendations: result.recommendations,
    sectionBreakdown: result.sectionBreakdown,
    engineVersion: result.engineVersion,
    calculatedAt: result.calculatedAt,
  };
}

function averageNumeric(values) {
  const numericValues = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  if (!numericValues.length) {
    return null;
  }

  return roundScore(
    numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
  );
}

async function loadAssessmentContext(applicationId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      company: true,
      projectProfile: true,
      questionnaireAnswers: true,
    },
  });

  if (!application) {
    throw new ApiError("Demande introuvable.", 404);
  }

  const formTemplate = await prisma.formTemplate.findFirst({
    where: { isActive: true },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: {
              options: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!formTemplate) {
    throw new ApiError("Aucun formulaire actif trouvé pour le calcul ESG.", 404);
  }

  return { application, formTemplate };
}

async function calculate(applicationId) {
  const { application, formTemplate } = await loadAssessmentContext(applicationId);
  const profileDetails = parseProjectProfileDetails(application.projectProfile);
  const answersByCode = buildAnswersByCode(application.questionnaireAnswers || []);
  const questionMeta = buildQuestionMeta(formTemplate);
  const category = calculateCategory(answersByCode);
  const sectorWeights = detectSector(application, profileDetails);
  const pillarResult = calculatePillars(answersByCode, questionMeta, sectorWeights.sector);
  const redFlags = buildRedFlags({
    answersByCode,
    category,
    detectedSector: sectorWeights.sector,
  });
  const recommendationResult = buildRecommendations({
    answersByCode,
    redFlags,
    detectedSector: sectorWeights.sector,
  });
  const mergedStrengthEntries = [...(pillarResult.strengths || []), ...(recommendationResult.strengths || [])];
  const mergedWeaknessEntries = [...(pillarResult.weaknesses || []), ...(recommendationResult.weaknesses || [])];
  const strengths = dedupeInsightEntries(mergedStrengthEntries);
  const weaknesses = dedupeInsightEntries(mergedWeaknessEntries);

  const environmentScore = pillarResult.environmentScore;
  const socialScore = pillarResult.socialScore;
  const governanceScore = pillarResult.governanceScore;
  const globalScore = getGlobalScore(
    { environmentScore, socialScore, governanceScore },
    sectorWeights
  );
  const riskLevel = resolveRiskLevel({
    categoryAuto: category.categoryAuto,
    globalScore,
    governanceScore,
    redFlags,
  });

  const record = await prisma.eSGAssessmentResult.upsert({
    where: { applicationId },
    update: {
      categoryAuto: category.categoryAuto,
      environmentScore,
      socialScore,
      governanceScore,
      globalScore,
      riskLevel,
      redFlags,
      strengths,
      weaknesses,
      recommendations: recommendationResult.recommendations,
      sectionBreakdown: pillarResult.sectionBreakdown,
      sectorWeights,
      engineVersion: ENGINE_VERSION,
      calculatedAt: new Date(),
    },
    create: {
      applicationId,
      categoryAuto: category.categoryAuto,
      environmentScore,
      socialScore,
      governanceScore,
      globalScore,
      riskLevel,
      redFlags,
      strengths,
      weaknesses,
      recommendations: recommendationResult.recommendations,
      sectionBreakdown: pillarResult.sectionBreakdown,
      sectorWeights,
      engineVersion: ENGINE_VERSION,
      calculatedAt: new Date(),
    },
  });

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      categoryAuto: category.categoryAuto,
    },
  });

  return toResponse(record);
}

async function getByApplicationId(applicationId) {
  const result = await prisma.eSGAssessmentResult.findUnique({
    where: { applicationId },
  });

  if (!result) {
    throw new ApiError("Aucun bilan ESG calculé pour cette demande.", 404);
  }

  return toResponse(result);
}

async function getDashboardSummary() {
  const applications = await prisma.application.findMany({
    include: {
      company: {
        select: { name: true },
      },
      esgAssessmentResult: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const byStatus = {
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  const byCategory = {
    A: 0,
    "B+": 0,
    B: 0,
    C: 0,
    FI: 0,
    "À déterminer": 0,
  };
  const byRiskLevel = {
    Faible: 0,
    Modéré: 0,
    Substantiel: 0,
    Élevé: 0,
  };
  const bySector = {};

  const scoredResults = applications
    .map((application) => application.esgAssessmentResult)
    .filter(Boolean);
  const totalCalculatedResults = scoredResults.length;
  const missingResults = applications.length - totalCalculatedResults;

  for (const application of applications) {
    if (application.status && Object.prototype.hasOwnProperty.call(byStatus, application.status)) {
      byStatus[application.status] += 1;
    }

    const category = application.esgAssessmentResult?.categoryAuto || application.categoryAuto;
    if (category && Object.prototype.hasOwnProperty.call(byCategory, category)) {
      byCategory[category] += 1;
    }

    const riskLevel = application.esgAssessmentResult?.riskLevel;
    if (riskLevel && Object.prototype.hasOwnProperty.call(byRiskLevel, riskLevel)) {
      byRiskLevel[riskLevel] += 1;
    }

    const sector = application.esgAssessmentResult?.sectorWeights?.sector;
    if (sector) {
      bySector[sector] = (bySector[sector] || 0) + 1;
    }
  }

  const averageScores = {
    environment: averageNumeric(scoredResults.map((result) => result.environmentScore)),
    social: averageNumeric(scoredResults.map((result) => result.socialScore)),
    governance: averageNumeric(scoredResults.map((result) => result.governanceScore)),
    global: averageNumeric(scoredResults.map((result) => result.globalScore)),
  };

  const highRiskApplications = applications
    .filter((application) =>
      ["Élevé", "Substantiel"].includes(application.esgAssessmentResult?.riskLevel)
    )
    .sort(
      (left, right) =>
        (right.esgAssessmentResult?.globalScore ?? 0) -
        (left.esgAssessmentResult?.globalScore ?? 0)
    )
    .map((application) => ({
      id: application.id,
      projectName: application.projectName,
      companyName: application.company?.name || "-",
      riskLevel: application.esgAssessmentResult?.riskLevel || "-",
      categoryAuto:
        application.esgAssessmentResult?.categoryAuto || application.categoryAuto || "-",
      sector: application.esgAssessmentResult?.sectorWeights?.sector || "-",
      globalScore: application.esgAssessmentResult?.globalScore ?? null,
      status: application.status,
    }));

  const recentApplications = applications.slice(0, 8).map((application) => ({
    id: application.id,
    projectName: application.projectName,
    companyName: application.company?.name || "-",
    status: application.status,
    categoryAuto:
      application.esgAssessmentResult?.categoryAuto || application.categoryAuto || "-",
    riskLevel: application.esgAssessmentResult?.riskLevel || null,
    globalScore: application.esgAssessmentResult?.globalScore ?? null,
    createdAt: application.createdAt,
  }));

  return {
    totalApplications: applications.length,
    totalCalculatedResults,
    missingResults,
    byStatus,
    byCategory,
    byRiskLevel,
    bySector,
    averageScores,
    highRiskApplications,
    recentApplications,
  };
}

async function calculateMissing() {
  const applications = await prisma.application.findMany({
    where: {
      status: {
        in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW],
      },
    },
    include: {
      esgAssessmentResult: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let calculated = 0;
  let skipped = 0;
  const errors = [];

  for (const application of applications) {
    if (application.esgAssessmentResult) {
      skipped += 1;
      continue;
    }

    try {
      await calculate(application.id);
      calculated += 1;
    } catch (error) {
      errors.push({
        applicationId: application.id,
        projectName: application.projectName,
        message: error.message,
      });
    }
  }

  return {
    processed: applications.length,
    calculated,
    skipped,
    errors,
  };
}

async function recalculateAll() {
  const applications = await prisma.application.findMany({
    where: {
      status: {
        in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW],
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let recalculated = 0;
  const errors = [];

  for (const application of applications) {
    try {
      await calculate(application.id);
      recalculated += 1;
    } catch (error) {
      errors.push({
        applicationId: application.id,
        projectName: application.projectName,
        message: error.message,
      });
    }
  }

  return {
    processed: applications.length,
    recalculated,
    errors,
  };
}

module.exports = {
  calculate,
  getByApplicationId,
  getDashboardSummary,
  calculateMissing,
  recalculateAll,
};
