const test = require("node:test");
const assert = require("node:assert/strict");
const { applicableRules, evaluate } = require("../src/modules/exclusions/exclusions.rules");
const clear = scope => Object.fromEntries(applicableRules(scope).map(rule => [rule.id, "NO"]));
test("complete clear declarations are not an exclusion; omissions require completion", () => {
  assert.equal(evaluate("STANDARD_FI", {}).outcome, "NOT_SCREENED");
  assert.equal(evaluate("STANDARD_FI", clear("STANDARD_FI")).outcome, "NO_EXCLUSION_DECLARED");
});
test("every applicable positive declaration is excluded with an exact reason", () => {
  for (const scope of ["STANDARD_FI", "MICROFINANCE", "TRADE_FINANCE"]) for (const rule of applicableRules(scope)) {
    const result = evaluate(scope, { ...clear(scope), [rule.id]: "YES" });
    assert.equal(result.outcome, "EXCLUDED"); assert.deepEqual(result.reasons, [{ id: rule.id, label: rule.label }]);
  }
});
test("unknown is review, not refusal, and a confirmed exclusion takes precedence", () => {
  assert.equal(evaluate("STANDARD_FI", { ...clear("STANDARD_FI"), illegal: "UNKNOWN" }).outcome, "REVIEW_REQUIRED");
  assert.equal(evaluate("STANDARD_FI", { ...clear("STANDARD_FI"), illegal: "UNKNOWN", tobacco: "YES" }).outcome, "EXCLUDED");
});
test("special FI exclusions do not leak between financing scopes", () => {
  assert.equal(evaluate("TRADE_FINANCE", { ...clear("TRADE_FINANCE"), hazardousChemicals: "YES", primaryForest: "YES" }).outcome, "NO_EXCLUSION_DECLARED");
  assert.equal(evaluate("STANDARD_FI", { ...clear("STANDARD_FI"), hazardousChemicals: "YES" }).outcome, "NO_EXCLUSION_DECLARED");
  assert.throws(() => applicableRules("OTHER"));
});
