const {
  findRow,
  hasDetails,
  isNo,
  isPlanned,
  isYes,
  parseTable,
} = require("./scoring.rules");

function addFlag(flags, flag) {
  if (!flags.some((item) => item.message === flag.message && item.questionCode === flag.questionCode)) {
    flags.push(flag);
  }
}

function isLowPermitExposureSector(detectedSector) {
  return ["Services bancaires / FI"].includes(detectedSector);
}

function buildRedFlags({ answersByCode, category, detectedSector }) {
  const flags = [];

  if (category.warning) {
    addFlag(flags, {
      severity: "MEDIUM",
      pillar: "Governance",
      message: category.warning,
      questionCode: "CAT_FI_001",
    });
  }

  if (isYes(answersByCode.NP2_HR_Q003)) {
    addFlag(flags, {
      severity: "CRITICAL",
      pillar: "Social",
      message: "Travail des enfants déclaré.",
      questionCode: "NP2_HR_Q003",
    });
  }

  if (isYes(answersByCode.NP2_HR_Q004)) {
    addFlag(flags, {
      severity: "CRITICAL",
      pillar: "Social",
      message: "Travail forcé déclaré.",
      questionCode: "NP2_HR_Q004",
    });
  }

  if (isNo(answersByCode.REG_001)) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Environment",
      message: "Étude d’impact sur l’environnement absente.",
      questionCode: "REG_001",
    });
  }

  if (isNo(answersByCode.REG_003)) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Governance",
      message: "Autorisation de bâtir absente.",
      questionCode: "REG_003",
    });
  }

  if (isNo(answersByCode.REG_005)) {
    addFlag(flags, {
      severity: isLowPermitExposureSector(detectedSector) ? "MEDIUM" : "MAJOR",
      pillar: "Governance",
      message: "Permis ou autorisation d’exploitation absents.",
      questionCode: "REG_005",
    });
  }

  if (isNo(answersByCode.NP1_001)) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Governance",
      message: "Absence de système d’évaluation et de suivi des risques E&S.",
      questionCode: "NP1_001",
    });
  }

  if (isNo(answersByCode.NP2_HS_B2_016)) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Social",
      message: "Maintenance des équipements de sécurité incendie non assurée.",
      questionCode: "NP2_HS_B2_016",
    });
  }

  if (isNo(answersByCode.NP2_HS_B2_020)) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Social",
      message: "Absence de plan de sécurité ou d’évacuation.",
      questionCode: "NP2_HS_B2_020",
    });
  }

  if (isNo(answersByCode.NP2_HR_Q009)) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Social",
      message: "Personnel non déclaré à la sécurité sociale.",
      questionCode: "NP2_HR_Q009",
    });
  }

  if (isNo(answersByCode.NP2_HR_Q016)) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Social",
      message: "Absence de suivi structuré des accidents du travail.",
      questionCode: "NP2_HR_Q016",
    });
  }

  const liquidRows = parseTable(answersByCode.NP3_LIQUID_WASTE_TABLE);
  if (
    liquidRows[0]?.response === "YES" &&
    findRow(liquidRows, "prétraitement")?.response === "NO" &&
    findRow(liquidRows, "contrôle régulier")?.response === "NO"
  ) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Environment",
      message: "Production de déchets liquides sans prétraitement ni suivi régulier.",
      questionCode: "NP3_LIQUID_WASTE_TABLE",
    });
  }

  const airRows = parseTable(answersByCode.NP3_AIR_EMISSIONS_TABLE);
  if (
    airRows[0]?.response === "YES" &&
    findRow(airRows, "contrôle et un suivi")?.response === "NO"
  ) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Environment",
      message: "Émissions atmosphériques sans suivi régulier.",
      questionCode: "NP3_AIR_EMISSIONS_TABLE",
    });
  }

  const hazardousRows = parseTable(answersByCode.NP3_HAZARDOUS_MATERIALS_TABLE);
  if (
    hazardousRows[0]?.response === "YES" &&
    findRow(hazardousRows, "contrôle et un suivi")?.response === "NO"
  ) {
    addFlag(flags, {
      severity: "CRITICAL",
      pillar: "Environment",
      message: "Matières dangereuses déclarées sans contrôle ni suivi adapté.",
      questionCode: "NP3_HAZARDOUS_MATERIALS_TABLE",
    });
  }

  const emergencyRows = parseTable(answersByCode.NP3_EMERGENCY_PREPAREDNESS_TABLE);
  if (findRow(emergencyRows, "procedures d’urgence")?.response === "NO") {
    addFlag(flags, {
      severity: "CRITICAL",
      pillar: "Environment",
      message: "Absence de procédures d’urgence déclarées.",
      questionCode: "NP3_EMERGENCY_PREPAREDNESS_TABLE",
    });
  }

  if (isYes(answersByCode.NP5_001) && !hasDetails(answersByCode.NP5_001_DETAILS)) {
    addFlag(flags, {
      severity: "CRITICAL",
      pillar: "Social",
      message: "Réinstallation involontaire déclarée sans mesures d’atténuation.",
      questionCode: "NP5_001",
    });
  }

  if (isYes(answersByCode.NP7_001) && !hasDetails(answersByCode.NP7_001_DETAILS)) {
    addFlag(flags, {
      severity: "CRITICAL",
      pillar: "Social",
      message: "Impact sur les peuples autochtones sans mesures d’atténuation.",
      questionCode: "NP7_001",
    });
  }

  if (isYes(answersByCode.NP8_001) && !hasDetails(answersByCode.NP8_001_DETAILS)) {
    addFlag(flags, {
      severity: "CRITICAL",
      pillar: "Social",
      message: "Impact sur le patrimoine culturel sans mesures d’atténuation.",
      questionCode: "NP8_001",
    });
  }

  if (isYes(answersByCode.NP6_001) && !hasDetails(answersByCode.NP6_001_DETAILS)) {
    addFlag(flags, {
      severity: "MAJOR",
      pillar: "Environment",
      message: "Impact biodiversité déclaré sans dispositif d’atténuation.",
      questionCode: "NP6_001",
    });
  }

  if (isNo(answersByCode.NP2_HR_Q010)) {
    addFlag(flags, {
      severity: "MEDIUM",
      pillar: "Governance",
      message: "Absence de politiques et procédures RH formalisées.",
      questionCode: "NP2_HR_Q010",
    });
  }

  if (isNo(answersByCode.NP2_HR_Q012)) {
    addFlag(flags, {
      severity: "MEDIUM",
      pillar: "Governance",
      message: "Absence de mécanisme de gestion des conflits sociaux.",
      questionCode: "NP2_HR_Q012",
    });
  }

  if (isNo(answersByCode.NP2_HR_SUPPLIERS_001)) {
    addFlag(flags, {
      severity: "MEDIUM",
      pillar: "Governance",
      message: "Dispositifs de protection des sous-traitants et fournisseurs non démontrés.",
      questionCode: "NP2_HR_SUPPLIERS_001",
    });
  }

  if (
    ["Textile", "Industrie lourde", "Agroalimentaire", "BTP / construction", "Transport"].includes(detectedSector) &&
    isNo(answersByCode.CLIMATE_008)
  ) {
    addFlag(flags, {
      severity: "MEDIUM",
      pillar: "Environment",
      message: "Absence de plan de transition énergétique pour une activité exposée.",
      questionCode: "CLIMATE_008",
    });
  }

  return flags;
}

module.exports = {
  buildRedFlags,
};
