const {
  average,
  eiaStatusScore,
  findRow,
  hasDetails,
  isNo,
  isPlanned,
  isYes,
  parseTable,
  positiveAnswerScore,
  responseScore,
  roundScore,
} = require("./scoring.rules");
const { getQuestionWeight, weightedAverage } = require("./scoring.weights");

// Build a { score, weight } entry for the weighted section aggregation.
// The weight comes from the question's materiality band and the detected
// sector multiplier (see scoring.weights.js).
function weightedEntry(code, score, sector) {
  return { score, weight: getQuestionWeight(code, sector) };
}

function getQuestionLabel(questionMeta, code) {
  return questionMeta[code]?.label || code;
}

function calculateRiskMitigationScore(riskAnswer, detailAnswer) {
  if (isNo(riskAnswer)) {
    return 100;
  }

  if (isYes(riskAnswer)) {
    return hasDetails(detailAnswer) ? 60 : 0;
  }

  return null;
}

function calculateExposureScore(answer) {
  if (isNo(answer)) {
    return 100;
  }

  if (isYes(answer)) {
    return 60;
  }

  return null;
}

function calculateClimateScore(answersByCode, sector) {
  const planScore = positiveAnswerScore(answersByCode.CLIMATE_008);
  const awarenessScore = positiveAnswerScore(answersByCode.CLIMATE_007);
  const plannedYearScore =
    isPlanned(answersByCode.CLIMATE_008) && answersByCode.CLIMATE_009?.answerValue ? 100 : null;
  const transitionDetailScore =
    isYes(answersByCode.CLIMATE_008) && hasDetails(answersByCode.CLIMATE_010)
      ? 100
      : isYes(answersByCode.CLIMATE_008)
        ? 30
        : null;
  const investmentValue = Number(answersByCode.CLIMATE_011?.answerValue || 0);
  const investmentScore = investmentValue > 0 ? 100 : 20;

  return weightedAverage([
    weightedEntry("CLIMATE_007", awarenessScore, sector),
    weightedEntry("CLIMATE_008", planScore, sector),
    weightedEntry("CLIMATE_009", plannedYearScore, sector),
    weightedEntry("CLIMATE_010", transitionDetailScore, sector),
    weightedEntry("CLIMATE_011", investmentScore, sector),
  ]);
}

function addInsight(collection, message, questionCode = null) {
  if (!message) {
    return;
  }

  if (
    collection.some(
      (item) => item.message === message && item.questionCode === questionCode
    )
  ) {
    return;
  }

  collection.push({ message, questionCode });
}

function createAccumulator() {
  return {
    environmentScores: [],
    socialScores: [],
    governanceScores: [],
    strengths: [],
    weaknesses: [],
    sectionBreakdown: new Map(),
  };
}

function addSection(accumulator, { sectionCode, sectionTitle, pillar, score, summary }) {
  if (typeof score !== "number") {
    return;
  }

  const rounded = roundScore(score);

  if (pillar === "Environment") accumulator.environmentScores.push(rounded);
  if (pillar === "Social") accumulator.socialScores.push(rounded);
  if (pillar === "Governance") accumulator.governanceScores.push(rounded);

  const existing = accumulator.sectionBreakdown.get(sectionCode);

  if (existing) {
    existing.scores.push(rounded);
    if (summary) {
      existing.summaries.add(summary);
    }
    return;
  }

  accumulator.sectionBreakdown.set(sectionCode, {
    sectionCode,
    sectionTitle,
    pillar,
    scores: [rounded],
    summaries: new Set(summary ? [summary] : []),
  });
}

function scoreRegulatory(answersByCode, questionMeta, accumulator) {
  const sector = accumulator.sector;
  const score = weightedAverage([
    weightedEntry("REG_001", positiveAnswerScore(answersByCode.REG_001), sector),
    weightedEntry("REG_002", eiaStatusScore(answersByCode.REG_002), sector),
    weightedEntry("REG_003", positiveAnswerScore(answersByCode.REG_003), sector),
    weightedEntry("REG_004", positiveAnswerScore(answersByCode.REG_004), sector),
    weightedEntry("REG_005", positiveAnswerScore(answersByCode.REG_005), sector),
  ]);

  if (isYes(answersByCode.REG_001)) {
    addInsight(accumulator.strengths, "Étude d’impact environnemental déclarée.", "REG_001");
  }
  if (isNo(answersByCode.REG_001)) {
    addInsight(accumulator.weaknesses, "Étude d’impact environnemental absente.", "REG_001");
  }

  addSection(accumulator, {
    sectionCode: "REGULATORY_COMPLIANCE",
    sectionTitle: questionMeta.REG_001?.sectionTitle || "Réglementation nationale",
    pillar: "Governance",
    score,
    summary:
      score >= 75
        ? "Conformité réglementaire globalement satisfaisante."
        : "Conformité réglementaire partielle ou incomplète.",
  });
}

function scoreCertifications(answersByCode, questionMeta, accumulator) {
  const sector = accumulator.sector;
  const score = weightedAverage([
    weightedEntry("CERT_001", positiveAnswerScore(answersByCode.CERT_001), sector),
    weightedEntry("CERT_005", positiveAnswerScore(answersByCode.CERT_005), sector),
    weightedEntry("CERT_006", positiveAnswerScore(answersByCode.CERT_006), sector),
    weightedEntry("CERT_007", positiveAnswerScore(answersByCode.CERT_007), sector),
    weightedEntry("CERT_008", positiveAnswerScore(answersByCode.CERT_008), sector),
    weightedEntry("CERT_010", positiveAnswerScore(answersByCode.CERT_010), sector),
  ]);

  if (isYes(answersByCode.CERT_005)) addInsight(accumulator.strengths, "Certification HACCP déclarée.", "CERT_005");
  if (isYes(answersByCode.CERT_007)) addInsight(accumulator.strengths, "Certification ISO 9001 déclarée.", "CERT_007");
  if (isYes(answersByCode.CERT_008)) addInsight(accumulator.strengths, "Certification ISO 14001 déclarée.", "CERT_008");

  addSection(accumulator, {
    sectionCode: "CERTIFICATIONS",
    sectionTitle: questionMeta.CERT_001?.sectionTitle || "Certifications et autorisations",
    pillar: "Governance",
    score,
    summary:
      score >= 75
        ? "Référentiels et certifications globalement bien structurés."
        : "Couverture de certification limitée ou partielle.",
  });
}

function scoreNp1(answersByCode, questionMeta, accumulator) {
  const sector = accumulator.sector;
  const codes = ["NP1_001", "NP1_002", "NP1_003", "NP1_004", "NP1_005", "NP1_006", "NP1_007", "NP1_008"];
  const score = weightedAverage(
    codes.map((code) => weightedEntry(code, positiveAnswerScore(answersByCode[code]), sector))
  );

  if (isYes(answersByCode.NP1_001)) {
    addInsight(
      accumulator.strengths,
      "Système d’évaluation et de suivi des risques E&S déclaré.",
      "NP1_001"
    );
  }
  if (isNo(answersByCode.NP1_001)) {
    addInsight(
      accumulator.weaknesses,
      "Absence de système formalisé d’évaluation et de suivi des risques E&S.",
      "NP1_001"
    );
  }

  addSection(accumulator, {
    sectionCode: "PERFORMANCE_STANDARD_1",
    sectionTitle:
      questionMeta.NP1_001?.sectionTitle ||
      "Norme de performance 1 — Évaluation et gestion des risques et des impacts environnementaux et sociaux",
    pillar: "Governance",
    score,
    summary:
      score >= 75
        ? "Le système de gestion E&S apparaît structuré."
        : "Le système de gestion E&S apparaît incomplet ou peu formalisé.",
  });
}

function scoreHsBloc1(answersByCode, questionMeta, accumulator) {
  const codes = [
    "NP2_HS_B1_001",
    "NP2_HS_B1_002",
    "NP2_HS_B1_003",
    "NP2_HS_B1_004",
    "NP2_HS_B1_005",
    "NP2_HS_B1_006",
    "NP2_HS_B1_007",
  ];
  const score = average(codes.map((code) => calculateExposureScore(answersByCode[code])));
  const yesCount = codes.filter((code) => isYes(answersByCode[code])).length;

  if (yesCount >= 3) {
    addInsight(
      accumulator.weaknesses,
      "Plusieurs nuisances opérationnelles ou expositions HSE sont déclarées.",
      "PERFORMANCE_STANDARD_2_HS_BLOC_1"
    );
  }

  addSection(accumulator, {
    sectionCode: "PERFORMANCE_STANDARD_2_HS_BLOC_1",
    sectionTitle: questionMeta.NP2_HS_B1_001?.sectionTitle || "Norme de performance 2 — Bloc 1",
    pillar: "Social",
    score,
    summary:
      yesCount === 0
        ? "Peu de nuisances HSE déclarées."
        : "Présence de nuisances ou expositions HSE nécessitant un encadrement.",
  });
}

function scoreHsBloc2(answersByCode, questionMeta, accumulator) {
  const booleanCodes = [
    "NP2_HS_B2_001",
    "NP2_HS_B2_002",
    "NP2_HS_B2_003",
    "NP2_HS_B2_004",
    "NP2_HS_B2_005",
    "NP2_HS_B2_006",
    "NP2_HS_B2_007",
    "NP2_HS_B2_008",
    "NP2_HS_B2_009",
    "NP2_HS_B2_010",
    "NP2_HS_B2_011",
    "NP2_HS_B2_012",
    "NP2_HS_B2_013",
    "NP2_HS_B2_014",
    "NP2_HS_B2_016",
    "NP2_HS_B2_019",
    "NP2_HS_B2_020",
    "NP2_HS_B2_021",
    "NP2_HS_B2_022",
  ];
  const sector = accumulator.sector;
  const score = weightedAverage([
    ...booleanCodes.map((code) =>
      weightedEntry(code, positiveAnswerScore(answersByCode[code]), sector)
    ),
    weightedEntry("NP2_HS_B2_017", positiveAnswerScore(answersByCode.NP2_HS_B2_017), sector),
  ]);

  if (isYes(answersByCode.NP2_HS_B2_020)) {
    addInsight(accumulator.strengths, "Plan de sécurité / évacuation déclaré.", "NP2_HS_B2_020");
  }
  if (isNo(answersByCode.NP2_HS_B2_020)) {
    addInsight(accumulator.weaknesses, "Absence de plan de sécurité / évacuation.", "NP2_HS_B2_020");
  }

  addSection(accumulator, {
    sectionCode: "PERFORMANCE_STANDARD_2_HS_BLOC_2",
    sectionTitle: questionMeta.NP2_HS_B2_001?.sectionTitle || "Norme de performance 2 — Bloc 2",
    pillar: "Social",
    score,
    summary:
      score >= 75
        ? "Les dispositifs HSE sont globalement en place."
        : "Les dispositifs HSE apparaissent partiels ou insuffisants.",
  });
}

function scoreHr(answersByCode, questionMeta, accumulator) {
  const sector = accumulator.sector;
  // NP2_HR_Q003 / Q004 (child / forced labour) and NP2_HR_Q015 (ongoing
  // litigation) are EXPOSURE / knockout questions handled via the red-flag
  // channel, not scored numerically here.
  const hrCodes = [
    "NP2_HR_Q001",
    "NP2_HR_Q002",
    "NP2_HR_Q005",
    "NP2_HR_Q006",
    "NP2_HR_Q007",
    "NP2_HR_Q008",
    "NP2_HR_Q009",
    "NP2_HR_Q010",
    "NP2_HR_Q011",
    "NP2_HR_Q012",
    "NP2_HR_Q013",
    "NP2_HR_Q014",
    "NP2_HR_Q016",
    "NP2_HR_SUPPLIERS_001",
  ];
  const entries = hrCodes.map((code) =>
    weightedEntry(code, positiveAnswerScore(answersByCode[code]), sector)
  );
  const accidentRows = parseTable(answersByCode.NP2_HR_ACCIDENT_TABLE);
  const totalOccurrences = accidentRows.reduce(
    (sum, row) => sum + Number(row.occurrence || 0),
    0
  );
  const accidentScore =
    totalOccurrences > 5 ? 35 : totalOccurrences > 2 ? 60 : accidentRows.length > 0 ? 80 : null;

  if (accidentScore !== null) {
    entries.push(weightedEntry("NP2_HR_ACCIDENT_TABLE", accidentScore, sector));
  }
  if (totalOccurrences > 5) {
    addInsight(
      accumulator.weaknesses,
      "Sinistralité travail élevée sur la période déclarée.",
      "NP2_HR_ACCIDENT_TABLE"
    );
  }

  if (isYes(answersByCode.NP2_HR_Q010)) {
    addInsight(accumulator.strengths, "Politiques et procédures RH déclarées.", "NP2_HR_Q010");
  }
  if (isNo(answersByCode.NP2_HR_Q010)) {
    addInsight(
      accumulator.weaknesses,
      "Absence de politiques et procédures RH formalisées.",
      "NP2_HR_Q010"
    );
  }
  if (isYes(answersByCode.NP2_HR_Q009)) {
    addInsight(accumulator.strengths, "Personnel déclaré à la sécurité sociale.", "NP2_HR_Q009");
  }

  const sectionScore = weightedAverage(entries);

  addSection(accumulator, {
    sectionCode: "PERFORMANCE_STANDARD_2_HR",
    sectionTitle:
      questionMeta.NP2_HR_Q001?.sectionTitle ||
      "Norme de performance 2 — Gestion des ressources humaines",
    pillar: "Social",
    score: sectionScore,
    summary:
      sectionScore >= 75
        ? "Les pratiques RH apparaissent globalement structurées."
        : "Les pratiques RH présentent plusieurs faiblesses de conformité ou d’encadrement.",
  });
}

function scoreSimpleControlTable(answer, controlLabels) {
  const rows = parseTable(answer);
  const firstRow = rows[0];

  if (!firstRow) {
    return null;
  }

  if (firstRow.response === "NO") {
    return 100;
  }

  const controlScores = controlLabels.map((label) => {
    const row = findRow(rows, label);
    return responseScore(row?.response);
  });

  return average(controlScores);
}

function scoreEmergencyTable(answer) {
  const rows = parseTable(answer);
  if (!rows.length) return null;

  const procedureScore = responseScore(findRow(rows, "procedures d’urgence")?.response);
  const installationScore = responseScore(findRow(rows, "bon etat")?.response);
  const standardsScore = responseScore(findRow(rows, "normes internes")?.response);
  const pollutionRow = findRow(rows, "pollution des sols");
  const pollutionScore =
    pollutionRow?.response === "YES" ? 0 : pollutionRow?.response === "NO" ? 100 : 30;

  return average([procedureScore, installationScore, standardsScore, pollutionScore]);
}

function scoreNorme3(answersByCode, questionMeta, accumulator) {
  const liquidScore = scoreSimpleControlTable(answersByCode.NP3_LIQUID_WASTE_TABLE, [
    "raccordement",
    "prétraitement",
    "contrôle régulier",
  ]);
  const solidScore = scoreSimpleControlTable(answersByCode.NP3_SOLID_WASTE_TABLE, [
    "collecte séparative",
    "valorisation",
    "contrôle et un suivi",
  ]);
  const airScore = scoreSimpleControlTable(answersByCode.NP3_AIR_EMISSIONS_TABLE, [
    "contrôle et un suivi",
    "ventilation forcée",
    "systèmes de traitement d’air",
  ]);
  const hazardousScore = scoreSimpleControlTable(answersByCode.NP3_HAZARDOUS_MATERIALS_TABLE, [
    "contrôle et un suivi",
    "prévenir la production",
  ]);
  const emergencyScore = scoreEmergencyTable(answersByCode.NP3_EMERGENCY_PREPAREDNESS_TABLE);

  addSection(accumulator, {
    sectionCode: "PERFORMANCE_STANDARD_3_LIQUID_WASTE",
    sectionTitle:
      questionMeta.NP3_LIQUID_WASTE_TABLE?.sectionTitle ||
      "Norme de performance 3 — Gestion des déchets liquides",
    pillar: "Environment",
    score: liquidScore,
    summary:
      liquidScore >= 75
        ? "Gestion des rejets liquides globalement maîtrisée."
        : "Gestion des rejets liquides partielle ou insuffisante.",
  });
  addSection(accumulator, {
    sectionCode: "PERFORMANCE_STANDARD_3_SOLID_WASTE",
    sectionTitle:
      questionMeta.NP3_SOLID_WASTE_TABLE?.sectionTitle ||
      "Norme de performance 3 — Gestion des déchets solides",
    pillar: "Environment",
    score: solidScore,
    summary:
      solidScore >= 75
        ? "Gestion des déchets solides globalement structurée."
        : "Gestion des déchets solides à renforcer.",
  });
  addSection(accumulator, {
    sectionCode: "PERFORMANCE_STANDARD_3_AIR_EMISSIONS",
    sectionTitle:
      questionMeta.NP3_AIR_EMISSIONS_TABLE?.sectionTitle ||
      "Norme de performance 3 — Émissions gazeuses",
    pillar: "Environment",
    score: airScore,
    summary:
      airScore >= 75
        ? "Suivi et traitement des émissions atmosphériques globalement satisfaisants."
        : "Contrôle des émissions atmosphériques insuffisant ou partiel.",
  });
  addSection(accumulator, {
    sectionCode: "PERFORMANCE_STANDARD_3_HAZARDOUS_MATERIALS",
    sectionTitle:
      questionMeta.NP3_HAZARDOUS_MATERIALS_TABLE?.sectionTitle ||
      "Norme de performance 3 — Matières dangereuses",
    pillar: "Environment",
    score: hazardousScore,
    summary:
      hazardousScore >= 75
        ? "Encadrement des matières dangereuses globalement satisfaisant."
        : "Encadrement des matières dangereuses à renforcer.",
  });
  addSection(accumulator, {
    sectionCode: "PERFORMANCE_STANDARD_3_EMERGENCY_PREPAREDNESS",
    sectionTitle:
      questionMeta.NP3_EMERGENCY_PREPAREDNESS_TABLE?.sectionTitle ||
      "Norme de performance 3 — Préparation aux situations d’urgence",
    pillar: "Environment",
    score: emergencyScore,
    summary:
      emergencyScore >= 75
        ? "Préparation aux situations d’urgence globalement satisfaisante."
        : "Préparation aux situations d’urgence insuffisante ou partielle.",
  });
}

function scoreMitigationSection(questionCode, detailCode, pillar, accumulator, questionMeta) {
  const score = calculateRiskMitigationScore(
    accumulator.answersByCode[questionCode],
    accumulator.answersByCode[detailCode]
  );

  addSection(accumulator, {
    sectionCode: questionMeta[questionCode]?.sectionCode || questionCode,
    sectionTitle: questionMeta[questionCode]?.sectionTitle || getQuestionLabel(questionMeta, questionCode),
    pillar,
    score,
    summary:
      score >= 75
        ? "Le risque déclaré apparaît faible ou correctement encadré."
        : "Le risque déclaré nécessite un encadrement ou des mesures d’atténuation plus solides.",
  });
}

function scoreClimate(answersByCode, questionMeta, accumulator) {
  const score = calculateClimateScore(answersByCode, accumulator.sector);

  if (isYes(answersByCode.CLIMATE_007)) {
    addInsight(accumulator.strengths, "Conscience des enjeux climatiques déclarée.", "CLIMATE_007");
  }
  if (isYes(answersByCode.CLIMATE_008)) {
    addInsight(accumulator.strengths, "Plan de transition énergétique engagé.", "CLIMATE_008");
  }
  if (isPlanned(answersByCode.CLIMATE_008)) {
    addInsight(
      accumulator.weaknesses,
      "Plan de transition énergétique encore au stade de projet.",
      "CLIMATE_008"
    );
  }

  addSection(accumulator, {
    sectionCode: "CLIMATE_QUESTIONS",
    sectionTitle: questionMeta.CLIMATE_001?.sectionTitle || "Questions climatiques",
    pillar: "Environment",
    score,
    summary:
      score >= 75
        ? "Maturité climatique globalement satisfaisante."
        : "Maturité climatique partielle ou à renforcer.",
  });
}

function calculatePillars(answersByCode, questionMeta, detectedSector) {
  const accumulator = createAccumulator();
  accumulator.answersByCode = answersByCode;
  accumulator.sector = detectedSector || "Autre";

  scoreRegulatory(answersByCode, questionMeta, accumulator);
  scoreCertifications(answersByCode, questionMeta, accumulator);
  scoreNp1(answersByCode, questionMeta, accumulator);
  scoreHsBloc1(answersByCode, questionMeta, accumulator);
  scoreHsBloc2(answersByCode, questionMeta, accumulator);
  scoreHr(answersByCode, questionMeta, accumulator);
  scoreNorme3(answersByCode, questionMeta, accumulator);

  scoreMitigationSection("NP4_001", "NP4_001_DETAILS", "Social", accumulator, questionMeta);
  scoreMitigationSection("NP4_002", "NP4_002_DETAILS", "Social", accumulator, questionMeta);
  scoreMitigationSection("NP4_003", "NP4_003_DETAILS", "Social", accumulator, questionMeta);
  scoreMitigationSection("NP5_001", "NP5_001_DETAILS", "Social", accumulator, questionMeta);
  scoreMitigationSection("NP6_001", "NP6_001_DETAILS", "Environment", accumulator, questionMeta);
  scoreMitigationSection("NP6_002", "NP6_002_DETAILS", "Environment", accumulator, questionMeta);
  scoreMitigationSection("NP7_001", "NP7_001_DETAILS", "Social", accumulator, questionMeta);
  scoreMitigationSection("NP8_001", "NP8_001_DETAILS", "Social", accumulator, questionMeta);
  scoreClimate(answersByCode, questionMeta, accumulator);

  return {
    environmentScore: roundScore(average(accumulator.environmentScores)),
    socialScore: roundScore(average(accumulator.socialScores)),
    governanceScore: roundScore(average(accumulator.governanceScores)),
    strengths: accumulator.strengths,
    weaknesses: accumulator.weaknesses,
    sectionBreakdown: Array.from(accumulator.sectionBreakdown.values()).map((item) => ({
      sectionCode: item.sectionCode,
      sectionTitle: item.sectionTitle,
      pillar: item.pillar,
      score: roundScore(average(item.scores)),
      summary: Array.from(item.summaries).join(" "),
    })),
  };
}

module.exports = {
  calculatePillars,
};
