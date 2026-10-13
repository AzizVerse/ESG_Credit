const fs = require("node:fs");
const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const ApiError = require("../../utils/apiError");
const { detectSector, getDefaultSectorWeights } = require("./scoring.sectorWeights");

const SETTINGS_PATH = path.resolve(process.env.SCORING_SETTINGS_PATH || path.join(__dirname, "../../..", "prisma/scoring-sector-settings.json"));
const PILLARS = ["environment", "social", "governance"];

function validateSectors(sectors) {
  const defaults = getDefaultSectorWeights();
  if (!Array.isArray(sectors) || sectors.length !== defaults.length) {
    throw new ApiError("Provide weights for all predefined sectors, including Other.", 400);
  }
  return defaults.map((item) => {
    const matches = sectors.filter((sector) => sector?.sector === item.sector);
    if (matches.length !== 1) throw new ApiError(`Missing or duplicate sector: ${item.sector}.`, 400);
    const row = matches[0];
    if (PILLARS.some((pillar) => typeof row[pillar] !== "number" || !Number.isFinite(row[pillar]) || row[pillar] < 0 || row[pillar] > 1)) {
      throw new ApiError(`Each weight for ${item.sector} must be between 0% and 100%.`, 400);
    }
    if (Math.abs(PILLARS.reduce((sum, pillar) => sum + row[pillar], 0) - 1) > 0.000001) {
      throw new ApiError(`Weights for ${item.sector} must total 100%.`, 400);
    }
    return { sector: item.sector, ...Object.fromEntries(PILLARS.map((pillar) => [pillar, row[pillar]])) };
  });
}

function versionFor(settings) {
  const fingerprint = createHash("sha256").update(JSON.stringify(settings.sectors)).digest("hex").slice(0, 16);
  return `sector-v${settings.revision}-${fingerprint}`;
}

function getSettings() {
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw new ApiError("Unable to read sector settings. Check the configuration file before calculating.", 503);
    settings = { revision: 0, sectors: getDefaultSectorWeights(), updatedAt: null, updatedBy: null, history: [] };
  }
  try {
    settings.sectors = validateSectors(settings.sectors);
    if (!Number.isInteger(settings.revision) || settings.revision < 0 || !Array.isArray(settings.history)) throw new Error("Invalid revision history");
  } catch {
    throw new ApiError("Stored sector settings are invalid. Restore a valid configuration before calculating.", 503);
  }
  return { ...settings, version: versionFor(settings) };
}

function sameWeights(left, right) {
  return left?.sector === right?.sector && PILLARS.every((pillar) => typeof left[pillar] === "number" && Math.abs(left[pillar] - right[pillar]) < 0.000001);
}

function saveSettings({ sectors, expectedVersion }, userId) {
  const current = getSettings();
  if (expectedVersion !== current.version) {
    throw new ApiError("Sector settings changed in another session. Reload them before saving.", 409);
  }
  const validated = validateSectors(sectors);
  const changes = validated.filter((row, index) => !sameWeights(row, current.sectors[index])).map((row) => ({
    sector: row.sector,
    previous: current.sectors.find((item) => item.sector === row.sector),
    current: row,
  }));
  if (!changes.length) return current;
  const updatedAt = new Date().toISOString();
  const settings = {
    revision: current.revision + 1,
    sectors: validated,
    updatedAt,
    updatedBy: userId,
    history: [...current.history, { revision: current.revision + 1, updatedAt, updatedBy: userId, changes }],
  };
  const temporaryPath = `${SETTINGS_PATH}.${randomUUID()}.tmp`;
  try {
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(temporaryPath, JSON.stringify(settings, null, 2) + "\n", { flag: "wx" });
    fs.renameSync(temporaryPath, SETTINGS_PATH);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
  return { ...settings, version: versionFor(settings) };
}

function resolveWeights(application, profileDetails, settings) {
  const detected = detectSector(application, profileDetails);
  const weights = settings.sectors.find((row) => row.sector === detected.sector);
  return { ...weights, configurationVersion: settings.version, configurationRevision: settings.revision };
}

function assessmentNeedsConfirmation(previousWeights, nextWeights) {
  if (!previousWeights) return false;
  if (previousWeights.configurationVersion) return previousWeights.configurationVersion !== nextWeights.configurationVersion;
  // Legacy results have no revision; compare actual values and flag later settings edits.
  return nextWeights.configurationRevision > 0 || !sameWeights(previousWeights, nextWeights);
}

function requireConfirmation({ settings, options, affectedCount }) {
  if (options.expectedConfigurationVersion && options.expectedConfigurationVersion !== settings.version) {
    throw new ApiError("Sector settings changed after the calculation was prepared. Review them and try again.", 409);
  }
  if (affectedCount && (options.confirmSettingsChange !== true || options.expectedConfigurationVersion !== settings.version)) {
    throw new ApiError("Sector weights have changed. Confirm before replacing existing ESG assessments.", 409, {
      confirmationRequired: true, configurationVersion: settings.version, affectedCount,
    });
  }
}

module.exports = { getSettings, saveSettings, resolveWeights, assessmentNeedsConfirmation, requireConfirmation, validateSectors };
