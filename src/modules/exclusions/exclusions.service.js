const { PrismaClient } = require("@prisma/client");
const ApiError = require("../../utils/apiError");
const rules = require("./exclusions.rules");
const prisma = new PrismaClient();
async function getApplication(user, id) {
  const application = await prisma.application.findFirst({ where: { id, ...(user.role === "ADMIN" ? {} : { companyId: user.companyId || "NO_COMPANY" }) }, include: { exclusionScreening: true } });
  if (!application) throw new ApiError("Application not found", 404);
  return application;
}
async function get(user, id) {
  const application = await getApplication(user, id);
  const scope = application.exclusionScreening?.scope || "STANDARD_FI";
  const events = user.role === "ADMIN" ? await prisma.exclusionScreeningEvent.findMany({ where: { applicationId: id }, orderBy: { createdAt: "desc" } }) : undefined;
  return { screening: application.exclusionScreening, rules: rules.applicableRules(scope), sourceUrl: rules.SOURCE_URL, policyVersion: rules.POLICY_VERSION, events };
}
async function save(user, id, body) {
  return prisma.$transaction(async tx => {
    const application = await tx.application.findFirst({ where: { id, ...(user.role === "ADMIN" ? {} : { companyId: user.companyId || "NO_COMPANY" }) }, include: { exclusionScreening: true } });
    if (!application) throw new ApiError("Application not found", 404);
    if (application.status !== "DRAFT" && !(user.role === "ADMIN" && ["SUBMITTED", "UNDER_REVIEW"].includes(application.status))) throw new ApiError("Screening declarations are locked for this application", 409);
    const scope = user.role === "ADMIN" ? (body.scope || application.exclusionScreening?.scope || "STANDARD_FI") : (application.exclusionScreening?.scope || "STANDARD_FI");
    if (user.role !== "ADMIN" && body.scope && body.scope !== scope) throw new ApiError("Only an administrator can set the financing scope", 403);
    if (!rules.SCOPES.includes(scope)) throw new ApiError("Invalid financing scope", 400);
    const input = body.answers ?? application.exclusionScreening?.answers ?? {};
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError("Invalid screening answers", 400);
    const answers = {};
    for (const rule of rules.applicableRules(scope)) {
      if (input[rule.id] !== undefined) {
        if (!["YES", "NO", "UNKNOWN"].includes(input[rule.id])) throw new ApiError("Invalid screening answer", 400);
        answers[rule.id] = input[rule.id];
      }
    }
    const result = await rules.evaluateApplication(tx, id, scope, answers);
    const data = { scope, answers, ...result, policyVersion: rules.POLICY_VERSION, screenedAt: new Date() };
    const saved = await tx.exclusionScreening.upsert({ where: { applicationId: id }, create: { applicationId: id, ...data }, update: data });
    let action = "DECLARATIONS_SAVED";
    if (application.status !== "DRAFT") {
      if (result.outcome === "EXCLUDED") {
        await tx.application.update({ where: { id }, data: { status: "REJECTED" } });
        await tx.eSGAssessmentResult.deleteMany({ where: { applicationId: id } });
        action = "AUTO_REFUSED";
      } else if (result.outcome === "REVIEW_REQUIRED") {
        await tx.application.update({ where: { id }, data: { status: "UNDER_REVIEW" } });
        await tx.eSGAssessmentResult.deleteMany({ where: { applicationId: id } });
      }
    }
    await tx.exclusionScreeningEvent.create({ data: { applicationId: id, actorId: user.id, action, snapshot: JSON.parse(JSON.stringify(data)) } });
    return saved;
  });
}
async function summary() {
  const rows = await prisma.application.findMany({ include: { exclusionScreening: true, company: { select: { name: true } } }, orderBy: { updatedAt: "desc" } });
  const byOutcome = { NOT_SCREENED: 0, NO_EXCLUSION_DECLARED: 0, REVIEW_REQUIRED: 0, EXCLUDED: 0 };
  for (const row of rows) byOutcome[row.exclusionScreening?.outcome || "NOT_SCREENED"]++;
  return { byOutcome, automaticallyRefused: rows.filter(row => row.status === "REJECTED" && row.exclusionScreening?.outcome === "EXCLUDED").length,
    applications: rows.map(row => ({ id: row.id, projectName: row.projectName, companyName: row.company.name, status: row.status, screening: row.exclusionScreening })) };
}
module.exports = { get, save, summary };
