const { PrismaClient, QuestionType, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const TEMPLATE_NAME = "SGES Evaluation E&S";
const TEMPLATE_VERSION = "1";

const YES_NO_OPTIONS = [
  { value: "YES", label: "Oui" },
  { value: "NO", label: "Non" },
];

const YES_NO_NA_OPTIONS = [
  { value: "YES", label: "Oui" },
  { value: "NO", label: "Non" },
  { value: "NA", label: "N/A" },
];

const EIA_STATUS_OPTIONS = [
  { value: "IN_PROGRESS", label: "En cours de réalisation" },
  { value: "UNDER_APPROVAL", label: "En cours d’approbation" },
  { value: "APPROVED_WITHOUT_RESERVES", label: "Approuvée sans réserves" },
  { value: "APPROVED_WITH_RESERVES", label: "Approuvée avec réserves" },
];

const MAINTENANCE_PERIOD_OPTIONS = [
  { value: "QUARTERLY", label: "Trimestrielle" },
  { value: "SEMIANNUAL", label: "Semestrielle" },
  { value: "ANNUAL", label: "Annuelle" },
  { value: "FIVE_YEAR", label: "Quinquennale" },
  { value: "TEN_YEAR", label: "Décennale" },
];

const YES_NO_PLANNED_OPTIONS = [
  { value: "YES", label: "Oui" },
  { value: "NO", label: "Non" },
  { value: "PLANNED", label: "Non, mais je compte m’engager" },
];

const EXPORT_DESTINATION_OPTIONS = [
  { value: "NORTH_AFRICA", label: "Afrique du nord" },
  { value: "SUB_SAHARAN_AFRICA", label: "Afrique sub-saharienne" },
  { value: "EUROPE", label: "Europe" },
  { value: "NORTH_AMERICA", label: "Amérique du nord" },
  { value: "SOUTH_AMERICA", label: "Amérique du sud" },
  { value: "ASIA", label: "Asie" },
  { value: "UK", label: "UK" },
];

const YES_NO_NSP_TABLE_COLUMNS = [
  {
    key: "response",
    label: "Réponse",
    type: "choice",
    options: [
      { value: "YES", label: "Oui" },
      { value: "NO", label: "Non" },
      { value: "NSP", label: "NSP" },
    ],
  },
  { key: "value", label: "Valeur", type: "text" },
];

const YES_NO_NSP_ONLY_COLUMNS = [
  {
    key: "response",
    label: "Réponse",
    type: "choice",
    options: [
      { value: "YES", label: "Oui" },
      { value: "NO", label: "Non" },
      { value: "NSP", label: "NSP" },
    ],
  },
];

function buildBooleanQuestions(questions, startOrder = 1) {
  return questions.map((question, index) => ({
    ...question,
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
    requiresAttachment: false,
    isRequired: false,
    isFilterQuestion: false,
    order: question.order ?? startOrder + index,
  }));
}

function createTableQuestion({
  code,
  label,
  order,
  rows,
  columns,
  helpText = null,
  allowAddRows = false,
}) {
  return {
    code,
    label,
    type: QuestionType.TABLE,
    order,
    isRequired: false,
    hasComment: false,
    isFilterQuestion: false,
    requiresAttachment: false,
    helpText,
    metadata: {
      columns,
      initialRows: rows,
      allowAddRows,
    },
    options: [],
  };
}

const hrEffectifsQuestions = [
  "NP2_HR_EFFECTIFS_CADRES_HOMMES",
  "NP2_HR_EFFECTIFS_CADRES_FEMMES",
  "NP2_HR_EFFECTIFS_MAITRISE_HOMMES",
  "NP2_HR_EFFECTIFS_MAITRISE_FEMMES",
  "NP2_HR_EFFECTIFS_AGENTS_HOMMES",
  "NP2_HR_EFFECTIFS_AGENTS_FEMMES",
  "NP2_HR_EFFECTIFS_PERMANENT_HOMMES",
  "NP2_HR_EFFECTIFS_PERMANENT_FEMMES",
  "NP2_HR_EFFECTIFS_INTERIMAIRE_HOMMES",
  "NP2_HR_EFFECTIFS_INTERIMAIRE_FEMMES",
].map((code, index) => {
  const labels = {
    NP2_HR_EFFECTIFS_CADRES_HOMMES: "Cadres — Hommes",
    NP2_HR_EFFECTIFS_CADRES_FEMMES: "Cadres — Femmes",
    NP2_HR_EFFECTIFS_MAITRISE_HOMMES: "Maîtrise — Hommes",
    NP2_HR_EFFECTIFS_MAITRISE_FEMMES: "Maîtrise — Femmes",
    NP2_HR_EFFECTIFS_AGENTS_HOMMES: "Agents d’exécution — Hommes",
    NP2_HR_EFFECTIFS_AGENTS_FEMMES: "Agents d’exécution — Femmes",
    NP2_HR_EFFECTIFS_PERMANENT_HOMMES: "Personnel permanent — Hommes",
    NP2_HR_EFFECTIFS_PERMANENT_FEMMES: "Personnel permanent — Femmes",
    NP2_HR_EFFECTIFS_INTERIMAIRE_HOMMES: "Personnel intérimaire — Hommes",
    NP2_HR_EFFECTIFS_INTERIMAIRE_FEMMES: "Personnel intérimaire — Femmes",
  };

  return {
    code,
    label: labels[code],
    type: QuestionType.NUMBER,
    hasComment: false,
    requiresAttachment: false,
    isRequired: false,
    isFilterQuestion: false,
    order: index + 1,
    options: [],
  };
});

const hrWorkOrganizationQuestions = [
  {
    code: "NP2_HR_ORG_001",
    label: "Nombre d’équipes/shifts",
    type: QuestionType.NUMBER,
    hasComment: false,
  },
  {
    code: "NP2_HR_ORG_002",
    label: "Horaires de travail",
    type: QuestionType.TEXT,
    hasComment: false,
  },
  {
    code: "NP2_HR_ORG_003",
    label: "Nombre de jours de travail par semaine",
    type: QuestionType.NUMBER,
    hasComment: false,
  },
].map((question, index) => ({
  ...question,
  requiresAttachment: false,
  isRequired: false,
  isFilterQuestion: false,
  options: [],
  order: hrEffectifsQuestions.length + index + 1,
}));

const hrBooleanAndDetailQuestions = [
  {
    code: "NP2_HR_Q001",
    label:
      "Q1 : Est-ce que votre société a une politique active pour la promotion de l’égalité des chances et de traitement des travailleurs, le respect du droit national du travail et de l’emploi et la lutte contre les discriminations ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q001_DETAILS",
    label:
      "Si oui, quelles sont les dispositions que votre société a prises pour la promotion de l’égalité des chances et de traitement des travailleurs, le respect du droit national du travail et de l’emploi et la lutte contre les discriminations ?",
    type: QuestionType.TEXTAREA,
    hasComment: false,
    options: [],
  },
  {
    code: "NP2_HR_Q002",
    label:
      "Q2 : Est-ce que votre société a une politique active pour la promotion de conditions de travail sûres et saines et la protection de la santé des travailleurs ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q002_DETAILS",
    label:
      "Si oui, quelles sont les dispositions que votre société a prises pour la promotion de conditions de travail sûres et saines et la protection de la santé des travailleurs ?",
    type: QuestionType.TEXTAREA,
    hasComment: false,
    options: [],
  },
  {
    code: "NP2_HR_Q003",
    label: "Q3 : Est-ce que votre société emploie (même à titre temporaire) des enfants ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q004",
    label: "Q4 : Est-ce que votre société emploie (même à titre temporaire) des travailleurs forcés ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q005",
    label: "Q5 : Est-ce que votre société prévoit des visites médicales régulières pour son personnel ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q006",
    label:
      "Q6 : Est-ce que votre société est signataire des conventions collectives/sectorielles relatives aux conditions de travail des travailleurs ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q006_DETAILS",
    label: "Si oui, lesquelles ?",
    type: QuestionType.TEXTAREA,
    hasComment: false,
    options: [],
  },
  {
    code: "NP2_HR_Q007",
    label:
      "Q7 : Est-ce que la totalité du personnel (permanent et temporaire) de votre société dispose d’un contrat de travail ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q008",
    label:
      "Q8 : Est-ce que la totalité du personnel (permanent et temporaire) de votre société dispose de fiches de paie périodiques ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q009",
    label:
      "Q9 : Est-ce que la totalité du personnel (permanent et temporaire) de votre société est déclaré à la sécurité sociale ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q010",
    label:
      "Q10 : Est-ce que votre société dispose de politiques et procédures de ressources humaines (ex : manuel, règlement intérieur), qui décrivent son approche en matière de gestion des travailleurs ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q011",
    label:
      "Q11 : Est-ce que votre société fournit aux travailleurs des informations, étayées par des documents, claires et faciles à comprendre sur leurs droits en vertu du droit national du travail et de l’emploi et de toute convention collective applicable, y compris sur leurs droits en matière d’horaire de travail, de congés, de salaire, d’heures supplémentaires, de rémunération et de prestations sociales au début de la relation de travail et lorsqu’un changement important survient ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q012",
    label:
      "Q12 : Existe-il au sein de votre société des dispositifs mis en place pour gérer les conflits sociaux au sein de l’entreprise ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q013",
    label:
      "Q13 : Existe-il au sein de votre société des dispositifs mis en place pour le licenciement du personnel pour des raisons économiques (plans sociaux) ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q014",
    label:
      "Q14 : Existe-il des instances représentatives du personnel au sein de votre société (syndicats, comité d’entreprise, délégués du personnels, délégués syndicaux) ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q015",
    label:
      "Q15 : Existe-il des litiges en cours entre votre société et certains de ses employés ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_Q016",
    label: "Q16 : Est-ce que votre société a mis en place un suivi des accidents du travail ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
].map((question, index) => ({
  ...question,
  requiresAttachment: false,
  isRequired: false,
  isFilterQuestion: false,
  order: hrEffectifsQuestions.length + hrWorkOrganizationQuestions.length + index + 1,
}));

const hrSuppliersQuestions = [
  {
    code: "NP2_HR_SUPPLIERS_001",
    label:
      "Est-ce que votre société a mis en place des dispositifs particuliers relatifs à la protection des droits (travail des enfants, travail forcé, sécurité et hygiène) de vos sous-traitants et de vos fournisseurs ?",
    type: QuestionType.BOOLEAN,
    options: YES_NO_OPTIONS,
    hasComment: true,
  },
  {
    code: "NP2_HR_SUPPLIERS_001_DETAILS",
    label:
      "Si oui, quelles sont les dispositions que votre société a prises pour préserver les droits de vos sous-traitants et de vos fournisseurs ?",
    type: QuestionType.TEXTAREA,
    hasComment: false,
    options: [],
  },
].map((question, index) => ({
  ...question,
  requiresAttachment: false,
  isRequired: false,
  isFilterQuestion: false,
  order:
    hrEffectifsQuestions.length +
    hrWorkOrganizationQuestions.length +
    hrBooleanAndDetailQuestions.length +
    1 +
    index +
    1,
}));

const formSections = [
  {
    code: "CATEGORIZATION",
    title: "Formulaire de catégorisation",
    order: 1,
    questions: [
      {
        code: "CAT_A_001",
        label:
          "Usines industrielles de grande taille (cimenterie, usine sidérurgique, métallurgique, production d’engrais, etc.)",
      },
      {
        code: "CAT_A_002",
        label:
          "Construction d’infrastructures (barrages, port, aéroport, autoroute, centrale électrique, etc.)",
      },
      { code: "CAT_A_003", label: "Impact sur une forêt vierge" },
      {
        code: "CAT_A_004",
        label:
          "Impact sur un site de patrimoine culturel (par exemple, emplacements religieux ou archéologiques)",
      },
      {
        code: "CAT_A_005",
        label:
          "Impacts sur des lignes de partage des eaux par de grands programmes d’aménagement hydraulique (par exemple, lutte contre les inondations, irrigation ou drainage)",
      },
      { code: "CAT_A_006", label: "Déplacement involontaire de communautés ou de familles" },
      {
        code: "CAT_A_007",
        label:
          "Production ou utilisation commerciale de produits agrochimiques (production ou commercialisation de pesticides, engrais, fongicides)",
      },
      { code: "CAT_A_008", label: "Impact sur une voie maritime navigable internationale" },
      {
        code: "CAT_A_009",
        label:
          "Impact sur les habitats naturels protégés ou des zones à diversité biologique élevée (par exemple, marécages, récifs coralliens, palétuviers)",
      },
      { code: "CAT_A_010", label: "Impacts sur des populations indigènes" },
      {
        code: "CAT_A_011",
        label:
          "Génération d’impacts sur l’environnement irréversibles significatifs qui affecteront probablement le milieu physique (carrières, mines, zones d’aménagement agricole/urbain/industriel/touristique, etc.)",
      },
      {
        code: "CAT_BP_001",
        label:
          "Stockage, manipulation ou utilisation de substances toxiques sous forme de liquides, de solides ou de gaz",
      },
      { code: "CAT_BP_002", label: "Production de déchets solides dangereux ou non dangereux" },
      { code: "CAT_BP_003", label: "Utilisation de substances appauvrissant la couche d’ozone" },
      { code: "CAT_BP_004", label: "Le produit final devient un polluant une fois qu’il est utilisé" },
      {
        code: "CAT_BP_005",
        label:
          "Nécessité d’obtention de permis d’autorisations environnementales pour l’exécution du projet",
      },
      { code: "CAT_BP_006", label: "Contamination antérieure des sols" },
      { code: "CAT_B_001", label: "Impact sur la santé et la sécurité sur les lieux de travail" },
      {
        code: "CAT_B_002",
        label: "Niveaux élevés de bruit (dans l’usine ou dans les limites de l’emplacement)",
      },
      { code: "CAT_B_003", label: "Production ou augmentation de la production de déchets liquides" },
      { code: "CAT_B_004", label: "Emission de gaz ou particules dans l’air" },
      { code: "CAT_B_005", label: "Augmentation de la consommation d’eau" },
      { code: "CAT_B_006", label: "Augmentation de la consommation d’énergie" },
      { code: "CAT_C_001", label: "Société de service" },
      { code: "CAT_FI_001", label: "Intermédiaire financier" },
    ].map((question, index) => ({
      ...question,
      type: QuestionType.BOOLEAN,
      order: index + 1,
      isRequired: true,
      hasComment: true,
      isFilterQuestion: true,
      requiresAttachment: false,
      metadata: null,
      options: YES_NO_OPTIONS,
    })),
  },
  {
    code: "REGULATORY_COMPLIANCE",
    title: "Réglementation nationale",
    description:
      "Prière demander au client une copie de lettre d’approbation des autorités de contrôle.",
    order: 2,
    questions: [
      {
        code: "REG_001",
        label: "Etude d’impact sur l’environnement",
        type: QuestionType.SINGLE_CHOICE,
        options: YES_NO_NA_OPTIONS,
        hasComment: true,
        requiresAttachment: true,
      },
      {
        code: "REG_002",
        label: "Statut de l’étude d’impact sur l’environnement",
        type: QuestionType.SINGLE_CHOICE,
        options: EIA_STATUS_OPTIONS,
        hasComment: true,
        requiresAttachment: false,
      },
      {
        code: "REG_003",
        label: "Autorisation de bâtir",
        type: QuestionType.SINGLE_CHOICE,
        options: YES_NO_NA_OPTIONS,
        hasComment: true,
        requiresAttachment: true,
      },
      {
        code: "REG_004",
        label: "Votre usine est-elle un établissement classé",
        type: QuestionType.SINGLE_CHOICE,
        options: YES_NO_NA_OPTIONS,
        hasComment: true,
        requiresAttachment: true,
      },
      {
        code: "REG_005",
        label: "Autre permis/autorisation d’exploitation",
        type: QuestionType.SINGLE_CHOICE,
        options: YES_NO_NA_OPTIONS,
        hasComment: true,
        requiresAttachment: true,
      },
      {
        code: "REG_006",
        label: "Date",
        type: QuestionType.DATE,
        hasComment: false,
        requiresAttachment: false,
        options: [],
      },
      {
        code: "REG_007",
        label: "Autorités de contrôle",
        type: QuestionType.TEXT,
        hasComment: false,
        requiresAttachment: false,
        options: [],
      },
    ].map((question, index) => ({
      isRequired: false,
      isFilterQuestion: false,
      metadata: null,
      ...question,
      order: index + 1,
    })),
  },
  {
    code: "CERTIFICATIONS",
    title: "Certifications et autorisations",
    order: 3,
    questions: [
      {
        code: "CERT_001",
        label: "Normes internationales",
        type: QuestionType.SINGLE_CHOICE,
        options: YES_NO_NA_OPTIONS,
        hasComment: true,
        requiresAttachment: true,
      },
      {
        code: "CERT_002",
        label: "Lesquelles ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        requiresAttachment: false,
        options: [],
      },
      ...buildBooleanQuestions([
        { code: "CERT_003", label: "EU Good Management Practices", requiresAttachment: true },
        { code: "CERT_004", label: "US Food & Drug Administration", requiresAttachment: true },
        { code: "CERT_005", label: "Certification HACCP", requiresAttachment: true },
        { code: "CERT_006", label: "Certification EMAS", requiresAttachment: true },
        { code: "CERT_007", label: "Certification ISO 9001", requiresAttachment: true },
        { code: "CERT_008", label: "Certification ISO 14001", requiresAttachment: true },
        { code: "CERT_009", label: "Certification ISO/TS 16949", requiresAttachment: true },
        { code: "CERT_010", label: "Certification OHSAS 18001", requiresAttachment: true },
      ], 3).map((question) => ({ ...question, requiresAttachment: true })),
      {
        code: "CERT_011",
        label: "Autres certifications (préciser)",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        requiresAttachment: true,
        isRequired: false,
        isFilterQuestion: false,
        order: 11,
        metadata: null,
        options: [],
      },
    ].map((question) => ({ metadata: question.metadata || null, ...question })),
  },
  {
    code: "PERFORMANCE_STANDARD_1",
    title:
      "Norme de performance 1 — Évaluation et gestion des risques et des impacts environnementaux et sociaux",
    order: 4,
    questions: [
      {
        code: "NP1_001",
        label:
          "Est-ce que votre société a mis en place un système d’évaluation et de suivi des risques sociaux et environnementaux ?",
        isFilterQuestion: true,
        helpText:
          "Si oui, est-ce que le système d’évaluation et de suivi des risques sociaux et environnementaux comprend les éléments suivants :",
      },
      { code: "NP1_002", label: "Enoncé de Politique" },
      { code: "NP1_003", label: "Identification des risques et des impacts" },
      { code: "NP1_004", label: "Programme de gestion" },
      { code: "NP1_005", label: "Capacité organisationnelle et compétences" },
      { code: "NP1_006", label: "Préparation et réponse aux situations d’urgence" },
      { code: "NP1_007", label: "Engagement des parties prenantes" },
      { code: "NP1_008", label: "Suivi et évaluation" },
    ].map((question, index) => ({
      type: QuestionType.BOOLEAN,
      options: YES_NO_OPTIONS,
      hasComment: true,
      requiresAttachment: true,
      isRequired: false,
      order: index + 1,
      metadata: null,
      ...question,
      isFilterQuestion: question.isFilterQuestion || false,
    })),
  },
  {
    code: "PERFORMANCE_STANDARD_2_HS_BLOC_1",
    title: "Norme de performance 2 — Bloc 1",
    description:
      "Hygiène et sécurité :\nBloc 1 : la société ou le projet est-il la cause des nuisances suivantes ?",
    order: 5,
    questions: buildBooleanQuestions([
      { code: "NP2_HS_B1_001", label: "Bruit" },
      { code: "NP2_HS_B1_002", label: "Poussières" },
      { code: "NP2_HS_B1_003", label: "Fumées" },
      { code: "NP2_HS_B1_004", label: "Odeurs" },
      { code: "NP2_HS_B1_005", label: "Vibrations" },
      { code: "NP2_HS_B1_006", label: "Trafic routier et congestion" },
      { code: "NP2_HS_B1_007", label: "Manipulation de produits dangereux" },
    ]).map((question) => ({ ...question, metadata: null })),
  },
  {
    code: "PERFORMANCE_STANDARD_2_HS_BLOC_2",
    title: "Norme de performance 2 — Bloc 2",
    description:
      "Hygiène et sécurité :\nBloc 2 : Quelles sont les mesures d’hygiène et sécurité mises en place par votre société ?",
    order: 6,
    questions: [
      ...buildBooleanQuestions([
        { code: "NP2_HS_B2_001", label: "Q1 : Consignes de sécurité affichées" },
        { code: "NP2_HS_B2_002", label: "Q2 : Consignes d’hygiène affichées" },
        { code: "NP2_HS_B2_003", label: "Q3 : Formation du personnel à l’hygiène/sécurité" },
        { code: "NP2_HS_B2_004", label: "Q4 : Equipements de protection individuelle" },
        { code: "NP2_HS_B2_005", label: "Q5 : Infirmerie interne/médecin" },
        { code: "NP2_HS_B2_006", label: "Q6 : Comité d’hygiène et de sécurité" },
        { code: "NP2_HS_B2_007", label: "Q7 : Extincteurs opérationnels" },
        { code: "NP2_HS_B2_008", label: "Q8 : Robinet incendie armé (RIA)" },
        { code: "NP2_HS_B2_009", label: "Q9 : Surpresseur" },
        { code: "NP2_HS_B2_010", label: "Q10 : Groupe électrogène" },
        { code: "NP2_HS_B2_011", label: "Q11 : Alarme et détection incendie" },
        { code: "NP2_HS_B2_012", label: "Q12 : Portes coupe-feu" },
        { code: "NP2_HS_B2_013", label: "Q13 : Sprinklers" },
        { code: "NP2_HS_B2_014", label: "Q14 : Audit sécurité" },
      ]).map((question) => ({ ...question, metadata: null })),
      {
        code: "NP2_HS_B2_015",
        label: "Date dernier audit sécurité",
        type: QuestionType.DATE,
        hasComment: false,
        requiresAttachment: false,
        isRequired: false,
        isFilterQuestion: false,
        order: 15,
        metadata: null,
        options: [],
      },
      {
        code: "NP2_HS_B2_016",
        label: "Maintenance périodique des équipements sécurité incendie",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
        requiresAttachment: false,
        isRequired: false,
        isFilterQuestion: false,
        order: 16,
        metadata: null,
      },
      {
        code: "NP2_HS_B2_017",
        label: "Période maintenance",
        type: QuestionType.SINGLE_CHOICE,
        options: MAINTENANCE_PERIOD_OPTIONS,
        hasComment: false,
        requiresAttachment: false,
        isRequired: false,
        isFilterQuestion: false,
        order: 17,
        metadata: null,
      },
      {
        code: "NP2_HS_B2_018",
        label: "Date dernière maintenance",
        type: QuestionType.DATE,
        hasComment: false,
        requiresAttachment: false,
        isRequired: false,
        isFilterQuestion: false,
        order: 18,
        metadata: null,
        options: [],
      },
      ...buildBooleanQuestions([
        { code: "NP2_HS_B2_019", label: "Q15 : Formation du personnel à la sécurité incendie" },
        { code: "NP2_HS_B2_020", label: "Q16 : Existence plan sécurité/évacuation" },
        { code: "NP2_HS_B2_021", label: "Q17 : Consignes de sécurité incendie affichées" },
        { code: "NP2_HS_B2_022", label: "Q18 : Suivi et contrôle hygiène et sécurité" },
      ], 19).map((question) => ({ ...question, metadata: null })),
    ],
  },
  {
    code: "PERFORMANCE_STANDARD_2_HR",
    title: "Norme de performance 2 — Gestion des ressources humaines",
    description: "Main-d’œuvre et conditions de travail",
    order: 7,
    questions: [
      ...hrEffectifsQuestions.map((question) => ({ ...question, metadata: null })),
      ...hrWorkOrganizationQuestions.map((question) => ({ ...question, metadata: null })),
      ...hrBooleanAndDetailQuestions.map((question) => ({ ...question, metadata: null })),
      createTableQuestion({
        code: "NP2_HR_ACCIDENT_TABLE",
        label: "Suivi des accidents du travail",
        order:
          hrEffectifsQuestions.length +
          hrWorkOrganizationQuestions.length +
          hrBooleanAndDetailQuestions.length +
          1,
        rows: [
          { nature: "", occurrence: "" },
        ],
        columns: [
          { key: "nature", label: "Nature de l’accident", type: "text" },
          { key: "occurrence", label: "Nombre annuel d’occurrence", type: "number" },
        ],
        helpText: "Si oui, prière remplir le tableau ci-dessous :",
        allowAddRows: true,
      }),
      ...hrSuppliersQuestions.map((question) => ({ ...question, metadata: null })),
    ],
  },
  {
    code: "PERFORMANCE_STANDARD_3_LIQUID_WASTE",
    title: "Norme de performance 3 — Gestion des déchets liquides",
    description: "Bloc 1 — Gestion des déchets liquides",
    order: 8,
    questions: [
      createTableQuestion({
        code: "NP3_LIQUID_WASTE_TABLE",
        label: "Gestion des déchets liquides",
        order: 1,
        rows: [
          { label: "Est-ce que l’usine ou le projet produit des déchets liquides ?", response: "", value: "" },
          { label: "Existence d’un raccordement au réseau public d’assainissement ?", response: "", value: "" },
          { label: "Existence d’une station de prétraitement avant rejet extérieur ?", response: "", value: "" },
          { label: "Est-ce qu’il existe un contrôle régulier et un suivi des rejets des eaux usées et pluviales ?", response: "", value: "" },
        ],
        columns: YES_NO_NSP_TABLE_COLUMNS,
        helpText:
          "Remarque : la première question constitue une question filtre. Si la réponse est Non, passer au bloc suivant.",
      }),
    ],
  },
  {
    code: "PERFORMANCE_STANDARD_3_SOLID_WASTE",
    title: "Norme de performance 3 — Gestion des déchets solides",
    description: "Bloc 2 — Gestion des déchets solides",
    order: 9,
    questions: [
      createTableQuestion({
        code: "NP3_SOLID_WASTE_TABLE",
        label: "Gestion des déchets solides",
        order: 1,
        rows: [
          { label: "Est-ce que l’usine ou le projet produit des déchets solides ?", response: "", value: "" },
          { label: "Est-ce que l’usine ou le projet procède à la collecte séparative de ses déchets solides (déchets recyclables, déchets organiques, déchets dangereux, etc.) ?", response: "", value: "" },
          { label: "Est-ce que l’usine ou le projet procède à la valorisation ou au recyclage de ses déchets ?", response: "", value: "" },
          { label: "Existe-il un contrôle et un suivi de la collecte et de l’élimination des déchets solides de l’usine ou du projet ?", response: "", value: "" },
        ],
        columns: YES_NO_NSP_TABLE_COLUMNS,
        helpText:
          "Remarque : la première question constitue une question filtre. Si la réponse est Non, passer au bloc suivant.",
      }),
    ],
  },
  {
    code: "PERFORMANCE_STANDARD_3_AIR_EMISSIONS",
    title: "Norme de performance 3 — Émissions gazeuses",
    description: "Bloc 3 — Émissions gazeuses",
    order: 10,
    questions: [
      createTableQuestion({
        code: "NP3_AIR_EMISSIONS_TABLE",
        label: "Émissions gazeuses",
        order: 1,
        rows: [
          { label: "Est-ce que le process industriel ou le projet conduit à l’émission de gaz, de poussières ou de particules dans l’atmosphère ?", response: "", value: "" },
          { label: "Émission de COV (composés organiques volatiles) ?", response: "", value: "" },
          { label: "Émission de particules en suspension ?", response: "", value: "" },
          { label: "Autres émissions gazeuses ?", response: "", value: "" },
          { label: "Existe-il un contrôle et un suivi des émissions de gaz, poussières ou particules dans l’atmosphère ?", response: "", value: "" },
          { label: "Est-ce que vos locaux de production ou de stockage sont équipés d’un système de ventilation forcée ?", response: "", value: "" },
          { label: "Est-ce que vos locaux de production ou de stockage ou les machines sont équipés de systèmes de traitement d’air appropriés et dédiés, comportant un ensemble de filtres propres à capter les gaz, poussières ou particules émis dans l’atmosphère ?", response: "", value: "" },
        ],
        columns: YES_NO_NSP_TABLE_COLUMNS,
        helpText:
          "Remarque : la première question constitue une question filtre. Si la réponse est Non, passer au bloc suivant.",
      }),
    ],
  },
  {
    code: "PERFORMANCE_STANDARD_3_HAZARDOUS_MATERIALS",
    title: "Norme de performance 3 — Matières dangereuses",
    description: "Bloc 4 — Matières dangereuses",
    order: 11,
    questions: [
      createTableQuestion({
        code: "NP3_HAZARDOUS_MATERIALS_TABLE",
        label: "Matières dangereuses",
        order: 1,
        rows: [
          { label: "Est-ce que le process industriel ou le projet conduit à l’utilisation de matières dangereuses ou/et à la production de déchets dangereux ?", response: "", value: "" },
          { label: "Utilisation d’amiante ?", response: "", value: "" },
          { label: "Utilisation de PCB ?", response: "", value: "" },
          { label: "Utilisation de substances détruisant la couche d’ozone (CFC, réfrigérants…) ?", response: "", value: "" },
          { label: "Utilisation de métaux lourds ?", response: "", value: "" },
          { label: "Utilisation ou production de matières dangereuses ?", response: "", value: "" },
          { label: "Existe-il un contrôle et un suivi de l’utilisation des matières dangereuses et de la collecte et de l’élimination des déchets dangereux de l’usine ou du projet ?", response: "", value: "" },
          { label: "Existe-il des mesures visant à prévenir la production de déchets dangereux ?", response: "", value: "" },
        ],
        columns: YES_NO_NSP_TABLE_COLUMNS,
        helpText:
          "Remarque : la première question constitue une question filtre. Si la réponse est Non, passer au bloc suivant.",
      }),
    ],
  },
  {
    code: "PERFORMANCE_STANDARD_3_EMERGENCY_PREPAREDNESS",
    title: "Norme de performance 3 — Préparation aux situations d’urgence",
    description: "Bloc 5 — Préparation aux situations d’urgence",
    order: 12,
    questions: [
      createTableQuestion({
        code: "NP3_EMERGENCY_PREPAREDNESS_TABLE",
        label: "Préparation aux situations d’urgence",
        order: 1,
        rows: [
          { label: "Existe-il des précautions à suivre en cas d’accident / d’incident et des procédures d’urgence ?", response: "" },
          { label: "Est-ce que les installations de stockage, systèmes de canalisations, réseaux de drainage sont en bon état ?", response: "" },
          { label: "Existence de normes internes de surveillance et d’entretien des installations de stockage, systèmes de canalisations, réseaux de drainage", response: "" },
          { label: "Cas de pollution des sols et des eaux souterraines au niveau et aux alentours des sites de stockage ou du projet", response: "" },
        ],
        columns: YES_NO_NSP_ONLY_COLUMNS,
      }),
    ],
  },
  {
    code: "PERFORMANCE_STANDARD_4",
    title: "Norme de performance 4 — Santé, sécurité et sûreté des communautés",
    description: "Santé, sécurité et sûreté des communautés",
    order: 13,
    questions: [
      {
        code: "NP4_001",
        label:
          "1 - Est-ce que votre projet ou votre activité a un impact sur la santé et la sécurité des communautés (notamment pour celles vivant à proximité du projet) ?",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
        isFilterQuestion: true,
      },
      {
        code: "NP4_001_DETAILS",
        label:
          "Si oui, quelles sont les mesures de mitigation que votre société a prises pour réduire les impacts de votre projet sur la santé et la sécurité des communautés (notamment pour celles vivant à proximité du projet) ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        options: [],
      },
      {
        code: "NP4_002",
        label:
          "2 - Lors de l’étude d’impact sur l’environnement, avez-vous procédé à une consultation publique ou à une enquête publique auprès des parties prenantes concernant votre projet ?",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
        isFilterQuestion: true,
      },
      {
        code: "NP4_002_DETAILS",
        label:
          "Si oui, quelles sont les mesures de communications extérieures auprès des parties prenantes et les mécanismes de règlement des griefs concernant votre projet que votre société a mis en œuvre ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        options: [],
      },
      {
        code: "NP4_003",
        label:
          "3 - Est-ce que votre société a mis en place des mécanismes de divulgation continue de l’information aux communautés affectées par votre projet ?",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
        isFilterQuestion: true,
      },
      {
        code: "NP4_003_DETAILS",
        label:
          "Si oui, quels sont les mécanismes de divulgation continue de l’information aux communautés affectées par votre projet ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        options: [],
      },
    ].map((question, index) => ({
      requiresAttachment: false,
      isRequired: false,
      metadata: null,
      ...question,
      isFilterQuestion: Boolean(question.isFilterQuestion),
      order: index + 1,
    })),
  },
  {
    code: "PERFORMANCE_STANDARD_5",
    title: "Norme de performance 5 — Acquisition de terres et réinstallation involontaire",
    description: "Acquisition de terres et réinstallation involontaire",
    order: 14,
    questions: [
      {
        code: "NP5_001",
        label:
          "Est-ce que la réalisation de votre projet a entraîné le déplacement (physique ou économique) non volontaire de populations vivant sur le site (prière noter que la responsabilité de votre société comprend également les cas de réinstallations prises en charge par le gouvernement) ?",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
        isFilterQuestion: true,
      },
      {
        code: "NP5_001_DETAILS",
        label:
          "Si oui, quelles sont les mesures d’atténuation que votre société a prises pour réduire l’impact économique et social pour les populations déplacées (notamment l’engagement des communautés, leur réinstallation et la restauration de leurs moyens de subsistance) ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        options: [],
      },
    ].map((question, index) => ({
      requiresAttachment: false,
      isRequired: false,
      metadata: null,
      ...question,
      isFilterQuestion: Boolean(question.isFilterQuestion),
      order: index + 1,
    })),
  },
  {
    code: "PERFORMANCE_STANDARD_6",
    title:
      "Norme de performance 6 — Conservation de la biodiversité et gestion durable des ressources naturelles vivantes",
    description:
      "Conservation de la biodiversité et gestion durable des ressources naturelles vivantes",
    order: 15,
    questions: [
      {
        code: "NP6_001",
        label:
          "1 - Est-ce que la réalisation de votre projet a entraîné des atteintes à la protection et conservation de la biodiversité, la gestion des services écosystémiques ou à la gestion durable des ressources naturelles vivantes ?",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
        isFilterQuestion: true,
      },
      {
        code: "NP6_001_DETAILS",
        label:
          "Si oui, quelles sont les mesures d’atténuation que votre société a prises pour réduire les impacts du projet sur la conservation de la biodiversité et la gestion durable des ressources naturelles ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        options: [],
      },
      {
        code: "NP6_002",
        label:
          "2 - Est-ce que votre société achète des produits primaires (en particulier, mais pas exclusivement, des denrées alimentaires et des fibres) dont on sait qu’ils sont produits dans des régions où il existe un risque important de conversion d’habitats naturels et/ou critiques ?",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
        isFilterQuestion: true,
      },
      {
        code: "NP6_002_DETAILS",
        label:
          "Si oui, quelles sont les mesures pour limiter et réorienter la chaîne d’approvisionnement de votre société vers des fournisseurs pouvant établir qu’ils n’ont pas d’impacts négatifs importants sur ces aires ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        options: [],
      },
    ].map((question, index) => ({
      requiresAttachment: false,
      isRequired: false,
      metadata: null,
      ...question,
      isFilterQuestion: Boolean(question.isFilterQuestion),
      order: index + 1,
    })),
  },
  {
    code: "PERFORMANCE_STANDARD_7",
    title: "Norme de performance 7 — Peuples autochtones",
    description: "Peuples autochtones",
    order: 16,
    questions: [
      {
        code: "NP7_001",
        label:
          "Est-ce que la réalisation de votre projet a entraîné des atteintes à la dignité, aux droits de l’homme, aux aspirations, aux cultures et aux modes de subsistance basés sur des ressources naturelles de populations autochtones vivant sur le site ?",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
        isFilterQuestion: true,
      },
      {
        code: "NP7_001_DETAILS",
        label:
          "Si oui, quelles sont les mesures d’atténuation que votre société a prises pour réduire les impacts du projet sur les populations autochtones, ou, le cas échéant, les indemnisations de ces communautés et la fourniture d’opportunités de bénéfices développementaux culturellement appropriés ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        options: [],
      },
    ].map((question, index) => ({
      requiresAttachment: false,
      isRequired: false,
      metadata: null,
      ...question,
      isFilterQuestion: Boolean(question.isFilterQuestion),
      order: index + 1,
    })),
  },
  {
    code: "PERFORMANCE_STANDARD_8",
    title: "Norme de performance 8 — Patrimoine culturel",
    description: "Patrimoine culturel",
    order: 17,
    questions: [
      {
        code: "NP8_001",
        label: "Est-ce que votre projet se trouve sur ou à proximité d’un site culturel ?",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
        isFilterQuestion: true,
      },
      {
        code: "NP8_001_DETAILS",
        label:
          "Si oui, quelles sont les mesures d’atténuation que votre société a prises pour protéger le site culturel contre les impacts négatifs des activités du projet et soutenir sa conservation ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
        options: [],
      },
    ].map((question, index) => ({
      requiresAttachment: false,
      isRequired: false,
      metadata: null,
      ...question,
      isFilterQuestion: Boolean(question.isFilterQuestion),
      order: index + 1,
    })),
  },
  {
    code: "CLIMATE_QUESTIONS",
    title: "Questions climatiques",
    description: "Consommation énergétique, transition énergétique et exposition climatique",
    order: 18,
    questions: [
      {
        code: "CLIMATE_001",
        label: "Quelle est votre consommation énergétique globale en KWh/an ?",
        type: QuestionType.NUMBER,
        hasComment: false,
      },
      {
        code: "CLIMATE_002",
        label: "Consommation annuelle en Fuel — KWh/an",
        type: QuestionType.NUMBER,
        hasComment: false,
      },
      {
        code: "CLIMATE_003",
        label: "Consommation annuelle en Gaz naturel — KWh/an",
        type: QuestionType.NUMBER,
        hasComment: false,
      },
      {
        code: "CLIMATE_004",
        label: "Consommation annuelle en Energie renouvelable — KWh/an",
        type: QuestionType.NUMBER,
        hasComment: false,
      },
      {
        code: "CLIMATE_005",
        label: "Consommation annuelle autres sources d’énergie — KWh/an",
        type: QuestionType.NUMBER,
        hasComment: false,
      },
      {
        code: "CLIMATE_006",
        label: "Si autres, précisez",
        type: QuestionType.TEXTAREA,
        hasComment: false,
      },
      {
        code: "CLIMATE_007",
        label: "Etes-vous conscient(e) par les enjeux posés par le changement climatique ?",
        type: QuestionType.BOOLEAN,
        options: YES_NO_OPTIONS,
        hasComment: true,
      },
      {
        code: "CLIMATE_008",
        label: "Etes-vous engagé dans un plan de transition énergétique ?",
        type: QuestionType.SINGLE_CHOICE,
        options: YES_NO_PLANNED_OPTIONS,
        hasComment: true,
      },
      {
        code: "CLIMATE_009",
        label: "Année prévue",
        type: QuestionType.NUMBER,
        hasComment: false,
      },
      {
        code: "CLIMATE_010",
        label: "Si oui, de quelle manière vous êtes engagé dans un plan de transition énergétique ?",
        type: QuestionType.TEXTAREA,
        hasComment: false,
      },
      {
        code: "CLIMATE_011",
        label: "Combien avez-vous investi en transition énergétique ?",
        type: QuestionType.NUMBER,
        hasComment: false,
      },
      {
        code: "CLIMATE_012",
        label: "Impact de l’investissement sur le chiffre d’affaire",
        type: QuestionType.TEXT,
        hasComment: false,
      },
      {
        code: "CLIMATE_013",
        label: "Impact de l’investissement sur le coût",
        type: QuestionType.TEXT,
        hasComment: false,
      },
      {
        code: "CLIMATE_014",
        label: "Etes-vous une entreprise exportatrice ?",
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { value: "YES", label: "Oui" },
          { value: "NO", label: "Non" },
          { value: "PLANNED", label: "Non, mais je compte le devenir" },
        ],
        hasComment: true,
      },
      {
        code: "CLIMATE_015",
        label: "Année prévue pour devenir exportatrice",
        type: QuestionType.NUMBER,
        hasComment: false,
      },
      {
        code: "CLIMATE_016",
        label: "Destinations d’exportation",
        type: QuestionType.MULTIPLE_CHOICE,
        options: EXPORT_DESTINATION_OPTIONS,
        hasComment: true,
      },
    ].map((question, index) => ({
      requiresAttachment: false,
      isRequired: false,
      isFilterQuestion: false,
      metadata: null,
      options: question.options || [],
      ...question,
      order: index + 1,
    })),
  },
];

function buildQuestionCreateInput(question) {
  return {
    code: question.code,
    label: question.label,
    type: question.type,
    order: question.order ?? 1,
    isRequired: Boolean(question.isRequired),
    hasComment: Boolean(question.hasComment),
    isFilterQuestion: Boolean(question.isFilterQuestion),
    requiresAttachment: Boolean(question.requiresAttachment),
    helpText: question.helpText || null,
    metadata: question.metadata || null,
    options: {
      create: (question.options || []).map((option, index) => ({
        value: option.value,
        label: option.label,
        order: index + 1,
      })),
    },
  };
}

async function seedFormTemplate() {
  await prisma.formTemplate.updateMany({
    where: {
      name: TEMPLATE_NAME,
      isActive: true,
      NOT: { version: TEMPLATE_VERSION },
    },
    data: { isActive: false },
  });

  await prisma.formTemplate.deleteMany({
    where: {
      name: TEMPLATE_NAME,
      version: TEMPLATE_VERSION,
    },
  });

  await prisma.formTemplate.create({
    data: {
      name: TEMPLATE_NAME,
      version: TEMPLATE_VERSION,
      isActive: true,
      sections: {
        create: formSections.map((section) => ({
          code: section.code,
          title: section.title,
          description: section.description || null,
          order: section.order,
          questions: {
            create: section.questions.map((question, index) =>
              buildQuestionCreateInput({
                ...question,
                order: question.order ?? index + 1,
              })
            ),
          },
        })),
      },
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);
  const companyData = {
    name: "Demo Enterprise",
    legalForm: "SARL",
    sector: "Food industry",
    activityDescription: "Seafood processing and packaging",
    address: "Sfax, Tunisia",
  };

  const existingCompany = await prisma.company.findFirst({
    where: { name: companyData.name },
  });

  const company = existingCompany
    ? await prisma.company.update({
        where: { id: existingCompany.id },
        data: companyData,
      })
    : await prisma.company.create({
        data: companyData,
      });

  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      name: "Admin User",
      password: passwordHash,
      role: Role.ADMIN,
      companyId: null,
    },
    create: {
      name: "Admin User",
      email: "admin@test.com",
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "enterprise@test.com" },
    update: {
      name: "Enterprise User",
      password: passwordHash,
      role: Role.ENTERPRISE,
      companyId: company.id,
    },
    create: {
      name: "Enterprise User",
      email: "enterprise@test.com",
      password: passwordHash,
      role: Role.ENTERPRISE,
      companyId: company.id,
    },
  });

  await seedFormTemplate();

  console.log("Seed complete: admin@test.com and enterprise@test.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
