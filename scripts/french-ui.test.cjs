const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildSync } = require("esbuild");
const moduleContext = { exports: {} };
const compiled = buildSync({ entryPoints: ["frontend/src/i18n/french.js"], bundle: true, platform: "node", format: "cjs", write: false }).outputFiles[0].text;
vm.runInNewContext(compiled, { module: moduleContext, exports: moduleContext.exports });
const { t } = moduleContext.exports;
test("French labels cover statuses, sectors, questions and IFC exclusions", () => {
  assert.equal(t("DRAFT"), "Brouillon");
  assert.equal(t("SUBMITTED"), "Soumise");
  assert.equal(t("Technology"), "Technologie");
  assert.equal(t("YES"), "Oui");
  assert.equal(t("NO"), "Non");
  assert.equal(t("Production or trade in tobacco, with substantial involvement."), "Production ou commerce de tabac avec une implication substantielle.");
  assert.match(t("Requires verification: Production or trade in tobacco, with substantial involvement."), /^Vérification requise : Production/);
  assert.equal(t("CAT_A_001"), "CAT_A_001");
  assert.equal(t("Texte libre de l’entreprise"), "Texte libre de l’entreprise");
});
test("all interface translation imports target French and document language is French", () => {
  assert.match(fs.readFileSync("frontend/index.html", "utf8"), /lang="fr"/);
  for (const directory of ["pages", "components", "context"]) for (const name of fs.readdirSync(path.join("frontend/src", directory)).filter(name => name.endsWith(".jsx"))) {
    const source = fs.readFileSync(path.join("frontend/src", directory, name), "utf8");
    assert(!source.includes("/i18n/english"), name);
    assert(!source.includes('"en-GB"') && !source.includes('"en-US"'), name);
  }
});
