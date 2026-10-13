const assert = require("node:assert/strict");
const { test } = require("node:test");
const scenarios = require("../prisma/presentation.scenarios");
const { headcount } = require("../prisma/seedPresentationData");

test("twelve distinct companies cover six sectors and one application per company", () => {
  assert.equal(scenarios.length, 12);
  assert.equal(new Set(scenarios.map((scenario) => scenario.slug)).size, 12);
  assert.equal(new Set(scenarios.map((scenario) => scenario.name)).size, 12);
  const sectors = new Map();
  for (const scenario of scenarios) sectors.set(scenario.sector, (sectors.get(scenario.sector) || 0) + 1);
  assert.equal(sectors.size, 6);
  assert.ok([...sectors.values()].every((count) => count === 2));
  assert.equal(scenarios.filter((scenario) => scenario.calculate).length, 9);
  assert.equal(scenarios.filter((scenario) => scenario.status === "DRAFT").length, 2);
  assert.equal(scenarios.filter((scenario) => scenario.status === "SUBMITTED" && !scenario.calculate).length, 1);
});

test("workforce and energy figures reconcile; statuses and declarations are coherent", () => {
  for (const scenario of scenarios) {
    assert.ok(["DRAFT", "SUBMITTED", "UNDER_REVIEW"].includes(scenario.status));
    assert.ok(!scenario.flags.includes("CAT_FI_001"));
    assert.ok(!(scenario.calculate && scenario.partial));
    const counts = headcount(scenario);
    const roles = Object.entries(counts).filter(([code]) => !code.includes("PERMANENT") && !code.includes("INTERIMAIRE")).reduce((sum, [, value]) => sum + value, 0);
    const employment = Object.entries(counts).filter(([code]) => code.includes("PERMANENT") || code.includes("INTERIMAIRE")).reduce((sum, [, value]) => sum + value, 0);
    assert.equal(roles, scenario.staff);
    assert.equal(employment, scenario.staff);
    assert.ok(scenario.energy[0] >= scenario.energy.slice(1).reduce((sum, value) => sum + value, 0));
    assert.ok(scenario.amount > 0);
    assert.ok(!scenario.certifications.includes("CERT_010"), "No obsolete OHSAS certification claimed");
  }
});
