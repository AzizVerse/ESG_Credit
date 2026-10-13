const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");

if (!process.argv.includes("--worker")) {
  const database = path.resolve("backups", `ifc-integration-${Date.now()}.db`);
  fs.copyFileSync(path.resolve("prisma/dev.db"), database);
  const run = spawnSync(process.execPath, [__filename, "--worker"], { env: { ...process.env, DATABASE_URL: "file:" + database.replaceAll("\\", "/") }, stdio: "inherit" });
  for (const suffix of ["", "-wal", "-shm", "-journal"]) if (fs.existsSync(database + suffix)) fs.unlinkSync(database + suffix);
  process.exit(run.status ?? 1);
}

async function run() {
  require("dotenv").config({ quiet: true });
  const { PrismaClient } = require("@prisma/client");
  const jwt = require("jsonwebtoken");
  const env = require("../src/config/env");
  const { applicableRules } = require("../src/modules/exclusions/exclusions.rules");
  const prisma = new PrismaClient();
  const server = require("../src/app").listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminToken = jwt.sign({ sub: admin.id }, env.jwtSecret);
  const request = async (route, token, method = "GET", body) => {
    const response = await fetch(base + route, { method, headers: { ...(token ? { authorization: "Bearer " + token } : {}), "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  async function fixture(name) {
    const company = await prisma.company.create({ data: { name: "IFC test " + name, legalForm: "SARL", sector: "Technology", activityDescription: "Test only", address: "Test" } });
    const user = await prisma.user.create({ data: { email: name + "@ifc.test", name, password: "test-only-unused", role: "ENTERPRISE", companyId: company.id } });
    const application = await prisma.application.create({ data: { companyId: company.id, projectName: name, projectType: "NEW_PROJECT", activityType: "Technology", financingAmount: 1000, location: "Test", categoryAuto: "C" } });
    return { id: application.id, token: jwt.sign({ sub: user.id }, env.jwtSecret) };
  }
  const clear = scope => Object.fromEntries(applicableRules(scope).map(rule => [rule.id, "NO"]));
  const baseline = (await request("/exclusions/admin/summary", adminToken)).body.data;
  const safe = await fixture("safe");
  const excluded = await fixture("excluded");
  const unknown = await fixture("unknown");
  const contradiction = await fixture("contradiction");
  assert.equal((await request("/exclusions/admin/summary")).status, 401);
  assert.equal((await request("/exclusions/admin/summary", safe.token)).status, 403);
  assert.equal((await request(`/exclusions/applications/${excluded.id}`, safe.token)).status, 404);
  assert.equal((await request(`/applications/my/${safe.id}/submit`, safe.token, "POST")).status, 409);
  assert.equal((await request(`/exclusions/applications/${safe.id}`, safe.token, "PUT", { scope: "MICROFINANCE", answers: clear("STANDARD_FI") })).status, 403);
  assert.equal((await request(`/exclusions/applications/${safe.id}`, safe.token, "PUT", { answers: { illegal: "INVALID" } })).status, 400);
  for (const [row, answers, expected] of [[safe, clear("STANDARD_FI"), "SUBMITTED"], [excluded, { ...clear("STANDARD_FI"), tobacco: "YES" }, "REJECTED"], [unknown, { ...clear("STANDARD_FI"), illegal: "UNKNOWN" }, "UNDER_REVIEW"]]) {
    assert.equal((await request(`/exclusions/applications/${row.id}`, row.token, "PUT", { answers })).status, 200);
    const submitted = await request(`/applications/my/${row.id}/submit`, row.token, "POST");
    assert.equal(submitted.status, 200); assert.equal(submitted.body.data.status, expected);
    assert.equal((await request(`/exclusions/applications/${row.id}`, row.token, "PUT", { answers })).status, 409);
  }
  await prisma.questionnaireAnswer.create({ data: { applicationId: contradiction.id, section: "PERFORMANCE_STANDARD_2_HR", questionCode: "NP2_HR_Q004", answerValue: "YES" } });
  await request(`/exclusions/applications/${contradiction.id}`, contradiction.token, "PUT", { answers: clear("STANDARD_FI") });
  const conflicting = await request(`/applications/my/${contradiction.id}/submit`, contradiction.token, "POST");
  assert.equal(conflicting.body.data.status, "UNDER_REVIEW");
  for (const row of [excluded, unknown, contradiction]) assert.equal((await request(`/scoring/applications/${row.id}/calculate`, adminToken, "POST", {})).status, 409);
  assert.equal((await request(`/applications/my/${excluded.id}/answers`, excluded.token, "PUT", { answers: [{ section: "TEST", questionCode: "TEST", answerValue: "NO" }] })).status, 409);
  const audit = await request(`/exclusions/applications/${excluded.id}`, adminToken);
  assert.equal(audit.body.data.events[0].action, "AUTO_REFUSED");
  assert.equal(audit.body.data.screening.reasons[0].id, "tobacco");
  const totals = await request("/exclusions/admin/summary", adminToken);
  assert.equal(totals.body.data.automaticallyRefused, baseline.automaticallyRefused + 1);
  assert.equal(totals.body.data.byOutcome.REVIEW_REQUIRED, baseline.byOutcome.REVIEW_REQUIRED + 2);
  const legacy = await fixture("legacy");
  await prisma.application.update({ where: { id: legacy.id }, data: { status: "SUBMITTED" } });
  const oldResult = await prisma.eSGAssessmentResult.findFirst();
  const { id: oldId, applicationId: oldApplicationId, ...resultData } = oldResult;
  await prisma.eSGAssessmentResult.create({ data: { ...resultData, applicationId: legacy.id } });
  const legacyScreen = await request(`/exclusions/applications/${legacy.id}`, adminToken, "PUT", { answers: { ...clear("STANDARD_FI"), weapons: "YES" } });
  assert.equal(legacyScreen.status, 200);
  assert.equal((await prisma.application.findUnique({ where: { id: legacy.id } })).status, "REJECTED");
  assert.equal(await prisma.eSGAssessmentResult.findUnique({ where: { applicationId: legacy.id } }), null);
  const scopeCase = await fixture("scope-case");
  await request(`/exclusions/applications/${scopeCase.id}`, adminToken, "PUT", { scope: "MICROFINANCE" });
  const scoped = await request(`/exclusions/applications/${scopeCase.id}`, scopeCase.token);
  assert(scoped.body.data.rules.some(rule => rule.id === "hazardousChemicals"));
  assert(!scoped.body.data.rules.some(rule => rule.id === "primaryForest"));
  console.log("PASS: authorization, ownership, incomplete submissions, scope control, clear/excluded/unknown outcomes, contradictions, locked answers, scoring hold, legacy refusal/result cleanup, audit and dashboard counts (isolated database).");
  server.close(); await prisma.$disconnect();
}
run().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
