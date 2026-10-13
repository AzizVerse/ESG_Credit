const assert = require("node:assert/strict");
const { test, after } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "equora-sector-settings-"));
const settingsPath = path.join(directory, "settings.json");
process.env.SCORING_SETTINGS_PATH = settingsPath;
const { getSettings, saveSettings, resolveWeights, assessmentNeedsConfirmation, requireConfirmation, validateSectors } = require("../src/modules/scoring/scoring.settings");

after(() => {
  if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);
  fs.rmdirSync(directory);
});

test("validates predefined sectors and exact weight totals", () => {
  const initial = getSettings();
  assert.equal(initial.revision, 0);
  assert.equal(initial.sectors.length, 7);
  assert.throws(() => validateSectors(initial.sectors.slice(1)), { statusCode: 400 });
  assert.throws(() => validateSectors(initial.sectors.map((row, index) => index === 0 ? { ...row, environment: -1 } : row)), { statusCode: 400 });
  assert.throws(() => validateSectors(initial.sectors.map((row, index) => index === 0 ? { ...row, governance: 0.6 } : row)), { statusCode: 400 });
  assert.throws(() => validateSectors(initial.sectors.map((row, index) => index === 0 ? { ...row, environment: "0.25" } : row)), { statusCode: 400 });
  assert.throws(() => validateSectors(initial.sectors.map((row, index) => index === 0 ? { ...row, sector: "Unknown" } : row)), { statusCode: 400 });
});

test("persists revisions, applies configured weights and rejects stale saves", () => {
  const initial = getSettings();
  const initialWeights = resolveWeights({ activityType: "Technology" }, {}, initial);
  const sectors = initial.sectors.map((row) => row.sector === "Technology" ? { ...row, environment: 0.3, governance: 0.45 } : row);
  const saved = saveSettings({ sectors, expectedVersion: initial.version }, "test-admin");
  assert.equal(getSettings().version, saved.version);
  assert.equal(saved.revision, 1);
  assert.equal(saved.history[0].changes.length, 1);
  assert.equal(saved.updatedBy, "test-admin");
  assert.throws(() => saveSettings({ sectors, expectedVersion: initial.version }, "other-admin"), { statusCode: 409 });
  const nextWeights = resolveWeights({ activityType: "Technology" }, {}, getSettings());
  assert.equal(nextWeights.environment, 0.3);
  assert.equal(nextWeights.social, 0.25);
  assert.equal(nextWeights.governance, 0.45);
  assert.equal(assessmentNeedsConfirmation(initialWeights, nextWeights), true);
  assert.equal(assessmentNeedsConfirmation(nextWeights, nextWeights), false);
  assert.equal(assessmentNeedsConfirmation(null, nextWeights), false);
  assert.equal(assessmentNeedsConfirmation({ sector: "Technology", environment: 0.3, social: 0.25, governance: 0.45 }, nextWeights), true);
  assert.equal(saveSettings({ sectors, expectedVersion: saved.version }, "test-admin").revision, 1);
  const restored = saveSettings({ sectors: initial.sectors, expectedVersion: saved.version }, "test-admin");
  assert.equal(restored.revision, 2);
  assert.equal(restored.history.length, 2);
  assert.equal(getSettings().version, restored.version);
  assert.equal(assessmentNeedsConfirmation(initialWeights, resolveWeights({ activityType: "Technology" }, {}, restored)), true);
});

test("confirmation is bound to the exact configuration revision", () => {
  const settings = getSettings();
  assert.throws(() => requireConfirmation({ settings, options: {}, affectedCount: 1 }), (error) => error.statusCode === 409 && error.details.confirmationRequired);
  assert.throws(() => requireConfirmation({ settings, options: { expectedConfigurationVersion: settings.version, confirmSettingsChange: "true" }, affectedCount: 1 }), { statusCode: 409 });
  assert.throws(() => requireConfirmation({ settings, options: { expectedConfigurationVersion: "old", confirmSettingsChange: true }, affectedCount: 1 }), { statusCode: 409 });
  assert.doesNotThrow(() => requireConfirmation({ settings, options: { expectedConfigurationVersion: settings.version, confirmSettingsChange: true }, affectedCount: 1 }));
  assert.doesNotThrow(() => requireConfirmation({ settings, options: {}, affectedCount: 0 }));
});

test("invalid configuration files fail closed rather than changing scoring silently", () => {
  const validFile = fs.readFileSync(settingsPath, "utf8");
  fs.writeFileSync(settingsPath, "invalid JSON");
  assert.throws(() => getSettings(), { statusCode: 503 });
  fs.writeFileSync(settingsPath, validFile);
});
