// Question-level materiality weighting registry.
//
// This module implements the professional weighting methodology on top of the
// existing rule-based engine. It does NOT touch the E/S/G sector weights
// (wE / wS / wG) nor the pillar -> global aggregation formula in
// scoring.service.js. It only changes HOW questions are combined *within* a
// section to produce that section's score.
//
// Methodology (see project design notes):
//   - Each SCORED question is assigned a discrete materiality band, not an
//     arbitrary decimal. Bands are defensible and auditable.
//   - A band maps to a base weight.
//   - A sector multiplier makes the same question matter more/less depending on
//     the detected sector (e.g. liquid-waste control matters more in
//     Agroalimentaire / Industrie lourde than in Technology).
//   - The final question weight = bandWeight * sectorMultiplier.
//
// "role" is documentation only (the archetype a question belongs to); the
// aggregation math is driven by "band" + optional "sector" multipliers.

const BAND_WEIGHTS = {
  CRITICAL: 5, // regulatory knockout / human-rights / high credit-liability
  HIGH: 3, // core control or material impact driver
  MEDIUM: 2, // standard control / condition
  LOW: 1, // minor or partially redundant control
};

const DEFAULT_WEIGHT = 1;

// Sector labels must match those produced by scoring.sectorWeights.js:
//   "Technology", "Industrie lourde", "Textile",
//   "Agroalimentaire", "BTP / construction", "Transport", "Autre".
const QUESTION_WEIGHTS = {
  // --- Réglementation nationale (compliance) ---
  REG_001: {
    role: "COMPLIANCE",
    band: "CRITICAL",
    sector: { "Industrie lourde": 1.5, Agroalimentaire: 1.3, "BTP / construction": 1.3, Technology: 0.5 },
  },
  REG_002: { role: "COMPLIANCE", band: "HIGH" },
  REG_003: { role: "COMPLIANCE", band: "CRITICAL", sector: { Technology: 0.5 } },
  REG_004: { role: "COMPLIANCE", band: "MEDIUM", sector: { "Industrie lourde": 1.3 } },
  REG_005: { role: "COMPLIANCE", band: "HIGH", sector: { Technology: 0.5 } },

  // --- Certifications (credentials) ---
  CERT_001: { role: "CREDENTIAL", band: "MEDIUM" },
  CERT_005: { role: "CREDENTIAL", band: "MEDIUM", sector: { Agroalimentaire: 1.5 } }, // HACCP
  CERT_006: { role: "CREDENTIAL", band: "LOW" }, // EMAS
  CERT_007: { role: "CREDENTIAL", band: "MEDIUM" }, // ISO 9001
  CERT_008: { role: "CREDENTIAL", band: "MEDIUM", sector: { "Industrie lourde": 1.3 } }, // ISO 14001
  CERT_010: { role: "CREDENTIAL", band: "MEDIUM" }, // OHSAS 18001

  // --- Norme de performance 1 (ES management system / controls) ---
  NP1_001: { role: "CONTROL", band: "CRITICAL" },
  NP1_002: { role: "CONTROL", band: "HIGH" },
  NP1_003: { role: "CONTROL", band: "HIGH" },
  NP1_004: { role: "CONTROL", band: "HIGH" },
  NP1_005: { role: "CONTROL", band: "HIGH" },
  NP1_006: { role: "CONTROL", band: "HIGH" },
  NP1_007: { role: "CONTROL", band: "HIGH" },
  NP1_008: { role: "CONTROL", band: "HIGH" },

  // --- NP2 HSE Bloc 2 (fire & safety controls) ---
  NP2_HS_B2_001: { role: "CONTROL", band: "MEDIUM" },
  NP2_HS_B2_002: { role: "CONTROL", band: "MEDIUM" },
  NP2_HS_B2_003: { role: "CONTROL", band: "HIGH" },
  NP2_HS_B2_004: { role: "CONTROL", band: "HIGH" },
  NP2_HS_B2_005: { role: "CONTROL", band: "MEDIUM" },
  NP2_HS_B2_006: { role: "CONTROL", band: "MEDIUM" },
  NP2_HS_B2_007: { role: "CONTROL", band: "HIGH" },
  NP2_HS_B2_008: { role: "CONTROL", band: "HIGH" },
  NP2_HS_B2_009: { role: "CONTROL", band: "LOW" },
  NP2_HS_B2_010: { role: "CONTROL", band: "LOW" },
  NP2_HS_B2_011: { role: "CONTROL", band: "HIGH" },
  NP2_HS_B2_012: { role: "CONTROL", band: "MEDIUM" },
  NP2_HS_B2_013: { role: "CONTROL", band: "LOW" },
  NP2_HS_B2_014: { role: "CONTROL", band: "MEDIUM" },
  NP2_HS_B2_016: { role: "CONTROL", band: "CRITICAL" }, // maintenance équipements sécurité incendie
  NP2_HS_B2_017: { role: "CONTROL", band: "LOW" },
  NP2_HS_B2_019: { role: "CONTROL", band: "HIGH" },
  NP2_HS_B2_020: { role: "CONTROL", band: "CRITICAL" }, // plan sécurité / évacuation
  NP2_HS_B2_021: { role: "CONTROL", band: "MEDIUM" },
  NP2_HS_B2_022: { role: "CONTROL", band: "HIGH" },

  // --- NP2 HR (labour rights & controls) ---
  NP2_HR_Q001: { role: "CONTROL", band: "MEDIUM" },
  NP2_HR_Q002: { role: "CONTROL", band: "MEDIUM" },
  NP2_HR_Q005: { role: "CONTROL", band: "MEDIUM" },
  NP2_HR_Q006: { role: "CONTROL", band: "LOW" },
  NP2_HR_Q007: { role: "COMPLIANCE", band: "HIGH" },
  NP2_HR_Q008: { role: "COMPLIANCE", band: "HIGH" },
  NP2_HR_Q009: { role: "COMPLIANCE", band: "CRITICAL" }, // déclaration sécurité sociale
  NP2_HR_Q010: { role: "CONTROL", band: "HIGH" },
  NP2_HR_Q011: { role: "CONTROL", band: "MEDIUM" },
  NP2_HR_Q012: { role: "CONTROL", band: "MEDIUM" },
  NP2_HR_Q013: { role: "CONTROL", band: "LOW" },
  NP2_HR_Q014: { role: "CONTROL", band: "MEDIUM" },
  NP2_HR_Q016: { role: "CONTROL", band: "HIGH" },
  NP2_HR_SUPPLIERS_001: { role: "CONTROL", band: "MEDIUM" },
  NP2_HR_ACCIDENT_TABLE: { role: "QUANT", band: "HIGH" },

  // --- Climate ---
  CLIMATE_007: { role: "INFO", band: "LOW" }, // awareness
  CLIMATE_008: { role: "CONTROL", band: "HIGH" }, // transition plan
  CLIMATE_009: { role: "QUANT", band: "LOW" }, // planned year
  CLIMATE_010: { role: "CONTROL", band: "MEDIUM" }, // transition detail
  CLIMATE_011: { role: "QUANT", band: "LOW" }, // investment
};

function bandWeight(band) {
  return BAND_WEIGHTS[band] || DEFAULT_WEIGHT;
}

// Returns the effective weight of a question for a given detected sector.
// Unregistered questions fall back to a neutral weight of 1, so behaviour is
// preserved for any code not explicitly banded.
function getQuestionWeight(code, sector) {
  const definition = QUESTION_WEIGHTS[code];

  if (!definition) {
    return DEFAULT_WEIGHT;
  }

  const base = bandWeight(definition.band);
  const multiplier = (definition.sector && definition.sector[sector]) || 1;

  return base * multiplier;
}

// Weighted mean over [{ score, weight }] entries. Null / non-numeric scores are
// excluded (mirrors the N/A handling of the flat average helper). Entries with
// a missing / non-positive weight default to a weight of 1.
function weightedAverage(entries) {
  let totalScore = 0;
  let totalWeight = 0;

  for (const entry of entries || []) {
    const score = entry?.score;

    if (typeof score !== "number" || Number.isNaN(score)) {
      continue;
    }

    const weight =
      typeof entry?.weight === "number" && entry.weight > 0 ? entry.weight : DEFAULT_WEIGHT;

    totalScore += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return null;
  }

  return totalScore / totalWeight;
}

module.exports = {
  BAND_WEIGHTS,
  QUESTION_WEIGHTS,
  bandWeight,
  getQuestionWeight,
  weightedAverage,
};
