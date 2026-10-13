const DEFAULT_WEIGHTS = {
  sector: "Autre",
  environment: 0.34,
  social: 0.33,
  governance: 0.33,
};

const SECTOR_RULES = [
  {
    sector: "Technology",
    keywords: [
      "technology",
      "technologie",
      "software",
      "logiciel",
      "informatique",
      "numerique",
      "it",
      "ict",
      "saas",
      "cloud",
      "datacenter",
      "data center",
      "telecom",
      "digital services",
    ],
    weights: { environment: 0.25, social: 0.25, governance: 0.5 },
  },
  {
    sector: "Industrie lourde",
    keywords: ["ciment", "clinker", "béton", "beton", "carrière", "industrie lourde", "sidér", "métallurg"],
    weights: { environment: 0.5, social: 0.25, governance: 0.25 },
  },
  {
    sector: "Textile",
    keywords: ["textile", "confection", "teinture", "habillement"],
    weights: { environment: 0.3, social: 0.45, governance: 0.25 },
  },
  {
    sector: "Agroalimentaire",
    keywords: ["agro", "aliment", "food", "conserverie", "transformation alimentaire"],
    weights: { environment: 0.4, social: 0.35, governance: 0.25 },
  },
  {
    sector: "BTP / construction",
    keywords: ["btp", "construction", "chantier", "infrastructure", "génie civil"],
    weights: { environment: 0.35, social: 0.35, governance: 0.3 },
  },
  {
    sector: "Transport",
    keywords: ["transport", "logistique", "flotte", "carburant", "camion", "livraison"],
    weights: { environment: 0.45, social: 0.25, governance: 0.3 },
  },
];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectSector(application, profileDetails) {
  const declaredSector = SECTOR_RULES.find((rule) =>
    [profileDetails?.activitySector, application?.activityType].some(
      (sector) => sector && normalize(sector).trim() === normalize(rule.sector)
    )
  );
  if (declaredSector) return { sector: declaredSector.sector, ...declaredSector.weights };

  const haystack = normalize(
    [
      application?.activityType,
      profileDetails?.activitySector,
      profileDetails?.projectDescription,
      application?.projectType,
    ]
      .filter(Boolean)
      .join(" ")
  );

  for (const rule of SECTOR_RULES) {
    if (rule.keywords.some((keyword) => {
      const term = normalize(keyword);
      // Short technology acronyms must be whole words, not parts of other words.
      return term.length <= 3 ? haystack.split(/\W+/).includes(term) : haystack.includes(term);
    })) {
      return {
        sector: rule.sector,
        ...rule.weights,
      };
    }
  }

  return { ...DEFAULT_WEIGHTS };
}

module.exports = {
  detectSector,
  getDefaultSectorWeights: () => [
    ...SECTOR_RULES.map((rule) => ({ sector: rule.sector, ...rule.weights })),
    { ...DEFAULT_WEIGHTS },
  ],
};
