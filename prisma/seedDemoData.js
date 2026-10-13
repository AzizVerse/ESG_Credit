const {
  PrismaClient,
  Role,
  ApplicationStatus,
  ProjectNature,
  ZoneType,
  MarketType,
  QuestionType,
} = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const DEMO_PASSWORD = "123456";
const DEMO_EMAILS = [
  "textile.demo@test.com",
  "ciment.demo@test.com",
  "agro.demo@test.com",
  "tourisme.demo@test.com",
  "it.demo@test.com",
  "btp.demo@test.com",
  "consulting.demo@test.com",
  "transport.demo@test.com",
  "bancaire.demo@test.com",
  "manufacturing.demo@test.com",
];

const PROFILE_LIBRARY = {
  TEXTILE: {
    scenario: "TEXTILE",
    category: "B+",
    marketType: MarketType.PME,
    industrial: true,
    serviceCompany: false,
    financialIntermediary: false,
    infrastructure: false,
    waterUse: true,
    energyUse: true,
    liquidWaste: true,
    solidWaste: true,
    airEmissions: false,
    noise: true,
    hazardous: true,
    permits: true,
    ozone: false,
    soilContamination: false,
    communityImpact: false,
    biodiversity: false,
    culturalSite: false,
    displacement: false,
    irreversibleImpact: false,
    climateAwareness: true,
    transitionPlan: "PLANNED",
    exporterStatus: "YES",
    exportDestinations: ["EUROPE", "NORTH_AFRICA"],
    esgMaturity: "medium",
    hrMaturity: "mixed",
    totalEnergy: 980000,
    fuelEnergy: 180000,
    gasEnergy: 210000,
    renewableEnergy: 45000,
    otherEnergy: 0,
    climateInvestment: 180000,
    climateRevenueImpact: "Amélioration attendue des marges export grâce à la baisse des coûts.",
    climateCostImpact: "Réduction progressive du coût unitaire de production.",
    climatePlannedYear: "2027",
    exporterPlannedYear: "",
    certifications: {
      international: "YES",
      details: "ISO 9001 en exploitation, démarche ISO 14001 en préparation.",
      cert003: false,
      cert004: false,
      cert005: false,
      cert006: false,
      cert007: true,
      cert008: false,
      cert009: false,
      cert010: false,
      others: "Audit social client export et référentiel qualité interne.",
    },
    regulatory: {
      eia: "YES",
      eiaStatus: "UNDER_APPROVAL",
      buildPermit: "YES",
      classifiedSite: "YES",
      otherPermit: "YES",
      date: "2025-11-18",
      authorities: "ANPE, municipalité, protection civile",
    },
    hrHeadcount: {
      cadresHommes: 12,
      cadresFemmes: 8,
      maitriseHommes: 38,
      maitriseFemmes: 42,
      agentsHommes: 110,
      agentsFemmes: 165,
      permanentHommes: 132,
      permanentFemmes: 182,
      interimHommes: 28,
      interimFemmes: 33,
    },
    shifts: 2,
    workHours: "08h-16h et 16h-00h selon l’atelier.",
    workDays: 6,
    accidents: [
      { nature: "Glissade atelier humide", occurrence: 2 },
      { nature: "Petite coupure en zone de conditionnement", occurrence: 1 },
    ],
  },
  CEMENT: {
    scenario: "HIGH_RISK_CEMENT",
    category: "A",
    marketType: MarketType.CORPORATE,
    industrial: true,
    serviceCompany: false,
    financialIntermediary: false,
    infrastructure: false,
    waterUse: true,
    energyUse: true,
    liquidWaste: true,
    solidWaste: true,
    airEmissions: true,
    noise: true,
    hazardous: true,
    permits: true,
    ozone: false,
    soilContamination: true,
    communityImpact: true,
    biodiversity: false,
    culturalSite: false,
    displacement: false,
    irreversibleImpact: true,
    climateAwareness: true,
    transitionPlan: "PLANNED",
    exporterStatus: "NO",
    exportDestinations: [],
    esgMaturity: "medium",
    hrMaturity: "mixed",
    totalEnergy: 16400000,
    fuelEnergy: 11200000,
    gasEnergy: 3500000,
    renewableEnergy: 250000,
    otherEnergy: 0,
    climateInvestment: 1600000,
    climateRevenueImpact: "Gain de productivité attendu après modernisation des filtres et fours.",
    climateCostImpact: "Réduction progressive de la facture énergétique unitaire.",
    climatePlannedYear: "2028",
    exporterPlannedYear: "",
    certifications: {
      international: "YES",
      details: "ISO 9001 en place, audit ISO 14001 programmé.",
      cert003: false,
      cert004: false,
      cert005: false,
      cert006: false,
      cert007: true,
      cert008: false,
      cert009: false,
      cert010: true,
      others: "Certification laboratoire interne des matériaux.",
    },
    regulatory: {
      eia: "YES",
      eiaStatus: "APPROVED_WITH_RESERVES",
      buildPermit: "YES",
      classifiedSite: "YES",
      otherPermit: "YES",
      date: "2025-08-03",
      authorities: "ANPE, ministère de l’Industrie, protection civile",
    },
    hrHeadcount: {
      cadresHommes: 28,
      cadresFemmes: 6,
      maitriseHommes: 72,
      maitriseFemmes: 9,
      agentsHommes: 240,
      agentsFemmes: 22,
      permanentHommes: 310,
      permanentFemmes: 30,
      interimHommes: 30,
      interimFemmes: 7,
    },
    shifts: 3,
    workHours: "Rotation continue 3x8 sur les unités de production.",
    workDays: 7,
    accidents: [
      { nature: "Exposition poussière clinker", occurrence: 1 },
      { nature: "Heurt matériel carrière", occurrence: 2 },
      { nature: "Entorse lors d’une maintenance", occurrence: 1 },
    ],
  },
  AGRO: {
    scenario: "FOOD_PROCESSING_MEDIUM",
    category: "B",
    marketType: MarketType.PME,
    industrial: true,
    serviceCompany: false,
    financialIntermediary: false,
    infrastructure: false,
    waterUse: true,
    energyUse: true,
    liquidWaste: true,
    solidWaste: true,
    airEmissions: false,
    noise: true,
    hazardous: false,
    permits: true,
    ozone: false,
    soilContamination: false,
    communityImpact: false,
    biodiversity: false,
    culturalSite: false,
    displacement: false,
    irreversibleImpact: false,
    climateAwareness: true,
    transitionPlan: "YES",
    exporterStatus: "YES",
    exportDestinations: ["EUROPE", "NORTH_AFRICA", "SUB_SAHARAN_AFRICA"],
    esgMaturity: "strong",
    hrMaturity: "strong",
    totalEnergy: 1240000,
    fuelEnergy: 220000,
    gasEnergy: 310000,
    renewableEnergy: 90000,
    otherEnergy: 0,
    climateInvestment: 260000,
    climateRevenueImpact: "Renforcement de l’accès aux marchés export et réduction des pertes.",
    climateCostImpact: "Baisse attendue des consommations de froid et de vapeur.",
    climatePlannedYear: "2026",
    exporterPlannedYear: "",
    certifications: {
      international: "YES",
      details: "HACCP et ISO 9001 appliqués sur les lignes de production.",
      cert003: false,
      cert004: false,
      cert005: true,
      cert006: false,
      cert007: true,
      cert008: false,
      cert009: false,
      cert010: false,
      others: "Certification fournisseur grande distribution régionale.",
    },
    regulatory: {
      eia: "YES",
      eiaStatus: "APPROVED_WITHOUT_RESERVES",
      buildPermit: "YES",
      classifiedSite: "NO",
      otherPermit: "YES",
      date: "2025-05-16",
      authorities: "ANPE, municipalité, services vétérinaires",
    },
    hrHeadcount: {
      cadresHommes: 10,
      cadresFemmes: 9,
      maitriseHommes: 24,
      maitriseFemmes: 27,
      agentsHommes: 68,
      agentsFemmes: 74,
      permanentHommes: 86,
      permanentFemmes: 92,
      interimHommes: 16,
      interimFemmes: 18,
    },
    shifts: 2,
    workHours: "Deux équipes en production, horaire administratif en journée.",
    workDays: 6,
    accidents: [
      { nature: "Brûlure légère en cuisson", occurrence: 1 },
    ],
  },
  TOURISM: {
    scenario: "TOURISM_RESOURCE_INTENSIVE",
    category: "C",
    marketType: MarketType.PME,
    industrial: false,
    serviceCompany: true,
    financialIntermediary: false,
    infrastructure: false,
    waterUse: true,
    energyUse: true,
    liquidWaste: true,
    solidWaste: true,
    airEmissions: false,
    noise: false,
    hazardous: false,
    permits: true,
    ozone: false,
    soilContamination: false,
    communityImpact: false,
    biodiversity: true,
    culturalSite: false,
    displacement: false,
    irreversibleImpact: false,
    climateAwareness: true,
    transitionPlan: "PLANNED",
    exporterStatus: "NO",
    exportDestinations: [],
    esgMaturity: "medium",
    hrMaturity: "mixed",
    totalEnergy: 760000,
    fuelEnergy: 120000,
    gasEnergy: 0,
    renewableEnergy: 35000,
    otherEnergy: 0,
    climateInvestment: 90000,
    climateRevenueImpact: "Amélioration de l’image et baisse des charges d’exploitation.",
    climateCostImpact: "Réduction attendue des coûts eau chaude et climatisation.",
    climatePlannedYear: "2027",
    exporterPlannedYear: "",
    certifications: {
      international: "NO",
      details: "",
      cert003: false,
      cert004: false,
      cert005: false,
      cert006: false,
      cert007: false,
      cert008: false,
      cert009: false,
      cert010: false,
      others: "",
    },
    regulatory: {
      eia: "NA",
      eiaStatus: "UNDER_APPROVAL",
      buildPermit: "YES",
      classifiedSite: "NO",
      otherPermit: "YES",
      date: "2025-07-09",
      authorities: "municipalité, ONTT, protection civile",
    },
    hrHeadcount: {
      cadresHommes: 7,
      cadresFemmes: 6,
      maitriseHommes: 18,
      maitriseFemmes: 21,
      agentsHommes: 44,
      agentsFemmes: 58,
      permanentHommes: 55,
      permanentFemmes: 69,
      interimHommes: 14,
      interimFemmes: 16,
    },
    shifts: 3,
    workHours: "Rotation par service avec pointe saisonnière.",
    workDays: 7,
    accidents: [{ nature: "Glissade cuisine", occurrence: 1 }],
  },
  IT: {
    scenario: "IT_DIGITAL_LOW_PHYSICAL_RISK",
    category: "C",
    marketType: MarketType.PME,
    industrial: false,
    serviceCompany: true,
    financialIntermediary: false,
    infrastructure: false,
    waterUse: false,
    energyUse: true,
    liquidWaste: false,
    solidWaste: false,
    airEmissions: false,
    noise: false,
    hazardous: false,
    permits: false,
    ozone: false,
    soilContamination: false,
    communityImpact: false,
    biodiversity: false,
    culturalSite: false,
    displacement: false,
    irreversibleImpact: false,
    climateAwareness: true,
    transitionPlan: "YES",
    exporterStatus: "YES",
    exportDestinations: ["EUROPE", "NORTH_AFRICA"],
    esgMaturity: "strong",
    hrMaturity: "strong",
    totalEnergy: 185000,
    fuelEnergy: 0,
    gasEnergy: 0,
    renewableEnergy: 12000,
    otherEnergy: 0,
    climateInvestment: 45000,
    climateRevenueImpact: "Amélioration de la compétitivité sur les appels d’offres européens.",
    climateCostImpact: "Réduction de la facture électrique du datacenter.",
    climatePlannedYear: "2026",
    exporterPlannedYear: "",
    certifications: {
      international: "YES",
      details: "ISO 9001 et référentiels cybersécurité appliqués.",
      cert003: false,
      cert004: false,
      cert005: false,
      cert006: false,
      cert007: true,
      cert008: false,
      cert009: false,
      cert010: false,
      others: "Référentiel sécurité de l’information client.",
    },
    regulatory: {
      eia: "NA",
      eiaStatus: "IN_PROGRESS",
      buildPermit: "NA",
      classifiedSite: "NO",
      otherPermit: "NA",
      date: "2025-03-30",
      authorities: "aucune autorité spécifique requise",
    },
    hrHeadcount: {
      cadresHommes: 16,
      cadresFemmes: 13,
      maitriseHommes: 20,
      maitriseFemmes: 18,
      agentsHommes: 8,
      agentsFemmes: 7,
      permanentHommes: 41,
      permanentFemmes: 34,
      interimHommes: 3,
      interimFemmes: 4,
    },
    shifts: 1,
    workHours: "09h-18h avec astreinte technique ponctuelle.",
    workDays: 5,
    accidents: [],
  },
  BTP: {
    scenario: "CONSTRUCTION_BTP_RISK",
    category: "B+",
    marketType: MarketType.CORPORATE,
    industrial: true,
    serviceCompany: false,
    financialIntermediary: false,
    infrastructure: true,
    waterUse: true,
    energyUse: true,
    liquidWaste: false,
    solidWaste: true,
    airEmissions: true,
    noise: true,
    hazardous: true,
    permits: true,
    ozone: false,
    soilContamination: true,
    communityImpact: true,
    biodiversity: false,
    culturalSite: false,
    displacement: true,
    irreversibleImpact: false,
    climateAwareness: true,
    transitionPlan: "PLANNED",
    exporterStatus: "NO",
    exportDestinations: [],
    esgMaturity: "medium",
    hrMaturity: "mixed",
    totalEnergy: 2150000,
    fuelEnergy: 1450000,
    gasEnergy: 0,
    renewableEnergy: 15000,
    otherEnergy: 0,
    climateInvestment: 210000,
    climateRevenueImpact: "Meilleure compétitivité sur les appels d’offres publics.",
    climateCostImpact: "Réduction attendue du coût carburant grâce au renouvellement d’engins.",
    climatePlannedYear: "2027",
    exporterPlannedYear: "",
    certifications: {
      international: "NO",
      details: "",
      cert003: false,
      cert004: false,
      cert005: false,
      cert006: false,
      cert007: false,
      cert008: false,
      cert009: false,
      cert010: true,
      others: "Procédures HSE chantier internes.",
    },
    regulatory: {
      eia: "YES",
      eiaStatus: "UNDER_APPROVAL",
      buildPermit: "YES",
      classifiedSite: "NO",
      otherPermit: "YES",
      date: "2025-10-14",
      authorities: "ANPE, urbanisme, protection civile",
    },
    hrHeadcount: {
      cadresHommes: 20,
      cadresFemmes: 4,
      maitriseHommes: 48,
      maitriseFemmes: 6,
      agentsHommes: 185,
      agentsFemmes: 14,
      permanentHommes: 210,
      permanentFemmes: 18,
      interimHommes: 43,
      interimFemmes: 6,
    },
    shifts: 2,
    workHours: "06h-14h et 14h-22h selon le chantier.",
    workDays: 6,
    accidents: [
      { nature: "Heurt engin chantier", occurrence: 2 },
      { nature: "Projection poussière", occurrence: 3 },
    ],
  },
  CONSULTING: {
    scenario: "LOW_RISK_SERVICE",
    category: "C",
    marketType: MarketType.PME,
    industrial: false,
    serviceCompany: true,
    financialIntermediary: false,
    infrastructure: false,
    waterUse: false,
    energyUse: true,
    liquidWaste: false,
    solidWaste: false,
    airEmissions: false,
    noise: false,
    hazardous: false,
    permits: false,
    ozone: false,
    soilContamination: false,
    communityImpact: false,
    biodiversity: false,
    culturalSite: false,
    displacement: false,
    irreversibleImpact: false,
    climateAwareness: true,
    transitionPlan: "PLANNED",
    exporterStatus: "NO",
    exportDestinations: [],
    esgMaturity: "medium",
    hrMaturity: "strong",
    totalEnergy: 98000,
    fuelEnergy: 0,
    gasEnergy: 0,
    renewableEnergy: 0,
    otherEnergy: 0,
    climateInvestment: 22000,
    climateRevenueImpact: "Renforcement de l’attractivité commerciale auprès des clients ESG.",
    climateCostImpact: "Baisse limitée des charges via efficacité bureautique.",
    climatePlannedYear: "2027",
    exporterPlannedYear: "",
    certifications: {
      international: "NO",
      details: "",
      cert003: false,
      cert004: false,
      cert005: false,
      cert006: false,
      cert007: false,
      cert008: false,
      cert009: false,
      cert010: false,
      others: "",
    },
    regulatory: {
      eia: "NA",
      eiaStatus: "IN_PROGRESS",
      buildPermit: "NA",
      classifiedSite: "NO",
      otherPermit: "NA",
      date: "2025-02-20",
      authorities: "aucune autorité spécifique requise",
    },
    hrHeadcount: {
      cadresHommes: 9,
      cadresFemmes: 8,
      maitriseHommes: 7,
      maitriseFemmes: 10,
      agentsHommes: 2,
      agentsFemmes: 5,
      permanentHommes: 15,
      permanentFemmes: 19,
      interimHommes: 1,
      interimFemmes: 4,
    },
    shifts: 1,
    workHours: "08h30-17h30",
    workDays: 5,
    accidents: [],
  },
  TRANSPORT: {
    scenario: "TRANSPORT_EMISSIONS_RISK",
    category: "B+",
    marketType: MarketType.PME,
    industrial: true,
    serviceCompany: false,
    financialIntermediary: false,
    infrastructure: false,
    waterUse: false,
    energyUse: true,
    liquidWaste: false,
    solidWaste: true,
    airEmissions: true,
    noise: true,
    hazardous: true,
    permits: true,
    ozone: false,
    soilContamination: true,
    communityImpact: true,
    biodiversity: false,
    culturalSite: false,
    displacement: false,
    irreversibleImpact: false,
    climateAwareness: true,
    transitionPlan: "PLANNED",
    exporterStatus: "NO",
    exportDestinations: [],
    esgMaturity: "medium",
    hrMaturity: "mixed",
    totalEnergy: 2760000,
    fuelEnergy: 2550000,
    gasEnergy: 0,
    renewableEnergy: 0,
    otherEnergy: 0,
    climateInvestment: 320000,
    climateRevenueImpact: "Meilleure efficacité logistique et fidélisation des clients export.",
    climateCostImpact: "Réduction attendue des coûts de maintenance et de carburant.",
    climatePlannedYear: "2028",
    exporterPlannedYear: "",
    certifications: {
      international: "NO",
      details: "",
      cert003: false,
      cert004: false,
      cert005: false,
      cert006: false,
      cert007: false,
      cert008: false,
      cert009: false,
      cert010: true,
      others: "Procédures sécurité flotte et suivi GPS.",
    },
    regulatory: {
      eia: "NO",
      eiaStatus: "IN_PROGRESS",
      buildPermit: "NA",
      classifiedSite: "NO",
      otherPermit: "YES",
      date: "2025-04-12",
      authorities: "ministère du Transport, municipalité, protection civile",
    },
    hrHeadcount: {
      cadresHommes: 11,
      cadresFemmes: 3,
      maitriseHommes: 36,
      maitriseFemmes: 5,
      agentsHommes: 94,
      agentsFemmes: 8,
      permanentHommes: 118,
      permanentFemmes: 10,
      interimHommes: 23,
      interimFemmes: 6,
    },
    shifts: 3,
    workHours: "Rotation continue selon les tournées et dépôts.",
    workDays: 7,
    accidents: [
      { nature: "Accrochage mineur de quai", occurrence: 2 },
      { nature: "Blessure légère lors d’arrimage", occurrence: 2 },
    ],
  },
  FINANCIAL: {
    scenario: "FINANCIAL_INTERMEDIARY",
    category: "FI",
    marketType: MarketType.CORPORATE,
    industrial: false,
    serviceCompany: true,
    financialIntermediary: true,
    infrastructure: false,
    waterUse: false,
    energyUse: false,
    liquidWaste: false,
    solidWaste: false,
    airEmissions: false,
    noise: false,
    hazardous: false,
    permits: false,
    ozone: false,
    soilContamination: false,
    communityImpact: false,
    biodiversity: false,
    culturalSite: false,
    displacement: false,
    irreversibleImpact: false,
    climateAwareness: true,
    transitionPlan: "YES",
    exporterStatus: "NO",
    exportDestinations: [],
    esgMaturity: "strong",
    hrMaturity: "strong",
    totalEnergy: 145000,
    fuelEnergy: 0,
    gasEnergy: 0,
    renewableEnergy: 10000,
    otherEnergy: 0,
    climateInvestment: 65000,
    climateRevenueImpact: "Renforcement de l’offre verte et de la relation clientèle.",
    climateCostImpact: "Baisse modérée des charges immobilières.",
    climatePlannedYear: "2026",
    exporterPlannedYear: "",
    certifications: {
      international: "YES",
      details: "Référentiels conformité et gouvernance internes renforcés.",
      cert003: false,
      cert004: false,
      cert005: false,
      cert006: false,
      cert007: true,
      cert008: false,
      cert009: false,
      cert010: false,
      others: "Charte E&S de financement interne.",
    },
    regulatory: {
      eia: "NA",
      eiaStatus: "APPROVED_WITHOUT_RESERVES",
      buildPermit: "NA",
      classifiedSite: "NO",
      otherPermit: "NA",
      date: "2025-01-15",
      authorities: "aucune autorité spécifique requise",
    },
    hrHeadcount: {
      cadresHommes: 14,
      cadresFemmes: 15,
      maitriseHommes: 20,
      maitriseFemmes: 22,
      agentsHommes: 9,
      agentsFemmes: 12,
      permanentHommes: 39,
      permanentFemmes: 45,
      interimHommes: 4,
      interimFemmes: 4,
    },
    shifts: 1,
    workHours: "08h30-17h00",
    workDays: 5,
    accidents: [],
  },
  MANUFACTURING: {
    scenario: "MEDIUM_INDUSTRIAL",
    category: "B",
    marketType: MarketType.GE,
    industrial: true,
    serviceCompany: false,
    financialIntermediary: false,
    infrastructure: false,
    waterUse: true,
    energyUse: true,
    liquidWaste: false,
    solidWaste: true,
    airEmissions: true,
    noise: true,
    hazardous: true,
    permits: true,
    ozone: false,
    soilContamination: false,
    communityImpact: false,
    biodiversity: false,
    culturalSite: false,
    displacement: false,
    irreversibleImpact: false,
    climateAwareness: true,
    transitionPlan: "PLANNED",
    exporterStatus: "YES",
    exportDestinations: ["EUROPE", "NORTH_AFRICA"],
    esgMaturity: "medium",
    hrMaturity: "mixed",
    totalEnergy: 1850000,
    fuelEnergy: 250000,
    gasEnergy: 510000,
    renewableEnergy: 40000,
    otherEnergy: 0,
    climateInvestment: 230000,
    climateRevenueImpact: "Amélioration de la qualité et de la continuité de production.",
    climateCostImpact: "Réduction progressive des coûts de gaz et de maintenance.",
    climatePlannedYear: "2027",
    exporterPlannedYear: "",
    certifications: {
      international: "YES",
      details: "ISO 9001 en place, ISO 14001 envisagée.",
      cert003: false,
      cert004: false,
      cert005: false,
      cert006: false,
      cert007: true,
      cert008: false,
      cert009: false,
      cert010: false,
      others: "Audit client automobile annuel.",
    },
    regulatory: {
      eia: "YES",
      eiaStatus: "APPROVED_WITHOUT_RESERVES",
      buildPermit: "YES",
      classifiedSite: "YES",
      otherPermit: "YES",
      date: "2025-06-22",
      authorities: "ANPE, municipalité, protection civile",
    },
    hrHeadcount: {
      cadresHommes: 13,
      cadresFemmes: 5,
      maitriseHommes: 30,
      maitriseFemmes: 12,
      agentsHommes: 104,
      agentsFemmes: 28,
      permanentHommes: 128,
      permanentFemmes: 36,
      interimHommes: 19,
      interimFemmes: 9,
    },
    shifts: 2,
    workHours: "Deux équipes de production et maintenance en journée.",
    workDays: 6,
    accidents: [
      { nature: "Coupure légère au montage", occurrence: 2 },
    ],
  },
};

const DEMO_COMPANIES = [
  {
    email: "it.demo@test.com",
    companyName: "DEMO - Technology Solutions",
    legalForm: "SA",
    sector: "Technology",
    activityDescription: "Software development, cloud services and enterprise digital platforms.",
    address: "Avenue Mohamed V, Tunis, Tunisie",
    userName: "Technology Solutions",
    apps: [
      {
        projectName: "Cloud platform modernization",
        status: ApplicationStatus.SUBMITTED,
        projectNature: ProjectNature.MODERNIZATION,
        zoneType: ZoneType.URBAN,
        isIndustrialZone: false,
        contactName: "Leila Mansour",
        contactPosition: "Technology Director",
        creationDate: "2011-12-05",
        totalSurface: 3200,
        coveredSurface: 3200,
        projectDescription:
          "Modernization of a software and cloud services platform with energy efficiency improvements.",
        financingAmount: 650000,
        location: "Tunis Centre",
        profile: "IT",
      },
    ],
  },
  {
    email: "ciment.demo@test.com",
    companyName: "DEMO - Industrie Lourde Nord",
    legalForm: "SA",
    sector: "Industrie lourde",
    activityDescription: "Production de clinker, ciment et matériaux lourds avec carrière attenante.",
    address: "Zone industrielle de Menzel Bourguiba, Bizerte, Tunisie",
    userName: "Industrie Lourde Nord",
    apps: [
      {
        projectName: "Extension unité clinker",
        status: ApplicationStatus.UNDER_REVIEW,
        projectNature: ProjectNature.EXTENSION,
        zoneType: ZoneType.RURAL,
        isIndustrialZone: true,
        contactName: "Hatem Gharbi",
        contactPosition: "Directeur exploitation",
        creationDate: "2009-02-10",
        totalSurface: 185000,
        coveredSurface: 46000,
        projectDescription:
          "Extension de la ligne clinker pour répondre à la demande régionale avec adaptation des filtres.",
        financingAmount: 11200000,
        location: "Menzel Bourguiba, Bizerte",
        profile: "CEMENT",
      },
    ],
  },
  {
    email: "textile.demo@test.com",
    companyName: "DEMO - Textile Sahel",
    legalForm: "SARL",
    sector: "Textile",
    activityDescription: "Teinture, confection et finition de textiles destinés à l’export.",
    address: "Zone industrielle de Monastir, Monastir, Tunisie",
    userName: "Textile Sahel",
    apps: [
      {
        projectName: "Extension ligne de confection export",
        status: ApplicationStatus.SUBMITTED,
        projectNature: ProjectNature.EXTENSION,
        zoneType: ZoneType.URBAN,
        isIndustrialZone: true,
        contactName: "Sonia Ben Salem",
        contactPosition: "Responsable HSE",
        creationDate: "2018-04-22",
        totalSurface: 12000,
        coveredSurface: 8800,
        projectDescription:
          "Extension des ateliers de confection avec renforcement des capacités export vers l’Europe.",
        financingAmount: 1250000,
        location: "Zone industrielle de Monastir, Monastir",
        profile: "TEXTILE",
        overrides: { esgMaturity: "medium", hrMaturity: "mixed" },
      },
    ],
  },
  {
    email: "agro.demo@test.com",
    companyName: "DEMO - Agro Food Tunis",
    legalForm: "SARL",
    sector: "Agroalimentaire",
    activityDescription: "Transformation agroalimentaire, conditionnement et stockage frigorifique.",
    address: "Zone industrielle de Sidi Salem, Nabeul, Tunisie",
    userName: "Agro Food Tunis",
    apps: [
      {
        projectName: "Modernisation ligne de conserve",
        status: ApplicationStatus.UNDER_REVIEW,
        projectNature: ProjectNature.MODERNIZATION,
        zoneType: ZoneType.URBAN,
        isIndustrialZone: true,
        contactName: "Moez Khlifi",
        contactPosition: "Responsable qualité",
        creationDate: "2016-09-01",
        totalSurface: 9800,
        coveredSurface: 7100,
        projectDescription:
          "Automatisation de la ligne de conserve et amélioration du prétraitement des effluents.",
        financingAmount: 980000,
        location: "Sidi Salem, Nabeul",
        profile: "AGRO",
      },
    ],
  },
  {
    email: "btp.demo@test.com",
    companyName: "DEMO - Construction Carthage",
    legalForm: "SA",
    sector: "BTP / construction",
    activityDescription: "Travaux publics, ouvrages d’infrastructure et centrale à béton.",
    address: "Zone industrielle Ben Arous, Tunisie",
    userName: "Construction Carthage",
    apps: [
      {
        projectName: "Construction échangeur urbain",
        status: ApplicationStatus.SUBMITTED,
        projectNature: ProjectNature.NEW_PROJECT,
        zoneType: ZoneType.URBAN,
        isIndustrialZone: false,
        contactName: "Walid Saidi",
        contactPosition: "Responsable exploitation",
        creationDate: "2012-03-15",
        totalSurface: 68000,
        coveredSurface: 9200,
        projectDescription:
          "Réalisation d’un échangeur urbain avec flux routiers importants et interactions riveraines.",
        financingAmount: 2800000,
        location: "Grand Tunis",
        profile: "BTP",
      },
    ],
  },
  {
    email: "transport.demo@test.com",
    companyName: "DEMO - Transport Logistique Sud",
    legalForm: "SARL",
    sector: "Transport",
    activityDescription: "Transport routier, logistique, flotte et gestion de dépôts régionaux.",
    address: "Zone logistique de Sfax, Tunisie",
    userName: "Transport Logistique Sud",
    apps: [
      {
        projectName: "Renouvellement flotte région sud",
        status: ApplicationStatus.UNDER_REVIEW,
        projectNature: ProjectNature.MODERNIZATION,
        zoneType: ZoneType.URBAN,
        isIndustrialZone: true,
        contactName: "Karim Ayadi",
        contactPosition: "Responsable exploitation",
        creationDate: "2015-10-20",
        totalSurface: 14500,
        coveredSurface: 4100,
        projectDescription:
          "Renouvellement d’une partie de la flotte et mise à niveau du suivi sécurité des chauffeurs.",
        financingAmount: 1800000,
        location: "Sfax",
        profile: "TRANSPORT",
      },
    ],
  },
];
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatNumber(value) {
  return String(value);
}

function labelForValue(question, value) {
  const option = (question.options || []).find((item) => item.value === value);
  return option?.label || value;
}

function choiceAnswer(question, value, comment = null) {
  return {
    answerValue: value,
    answerLabel: labelForValue(question, value),
    comment,
  };
}

function textAnswer(value, comment = null) {
  return {
    answerValue: value,
    answerLabel: value,
    comment,
  };
}

function numberAnswer(value, comment = null) {
  const normalized = formatNumber(value);
  return {
    answerValue: normalized,
    answerLabel: normalized,
    comment,
  };
}

function tableAnswer(rows) {
  return {
    answerValue: JSON.stringify(rows),
    answerLabel: "Tableau renseigné",
    comment: null,
  };
}

function multipleChoiceAnswer(question, values, comment = null) {
  const labels = (question.options || [])
    .filter((option) => values.includes(option.value))
    .map((option) => option.label);

  return {
    answerValue: JSON.stringify(values),
    answerLabel: labels.join(", "),
    comment,
  };
}

function buildProfile(baseKey, overrides = {}) {
  return {
    ...clone(PROFILE_LIBRARY[baseKey]),
    ...clone(overrides),
    certifications: {
      ...clone(PROFILE_LIBRARY[baseKey].certifications),
      ...(overrides.certifications || {}),
    },
    regulatory: {
      ...clone(PROFILE_LIBRARY[baseKey].regulatory),
      ...(overrides.regulatory || {}),
    },
    hrHeadcount: {
      ...clone(PROFILE_LIBRARY[baseKey].hrHeadcount),
      ...(overrides.hrHeadcount || {}),
    },
    accidents: overrides.accidents ? clone(overrides.accidents) : clone(PROFILE_LIBRARY[baseKey].accidents),
    exportDestinations: overrides.exportDestinations
      ? clone(overrides.exportDestinations)
      : clone(PROFILE_LIBRARY[baseKey].exportDestinations),
  };
}

function buildProjectProfileDetails(company, app) {
  return {
    legalName: company.companyName,
    address: app.location,
    zoneType: app.zoneType,
    isIndustrialZone: app.isIndustrialZone,
    contactName: app.contactName,
    contactPosition: app.contactPosition,
    creationDate: app.creationDate,
    totalSurface: app.totalSurface,
    coveredSurface: app.coveredSurface,
    projectNature: app.projectNature,
    activitySector: company.sector,
    projectDescription: app.projectDescription,
  };
}

function buildBooleanComment(questionCode, answerValue, profile) {
  const yes = answerValue === "YES";

  if (!yes) {
    if (profile.esgMaturity === "strong") {
      return "Aucun enjeu significatif identifié au regard de l’activité déclarée.";
    }

    if (profile.hrMaturity === "weak" && questionCode.startsWith("NP2_HR_")) {
      return "Dispositif non formalisé ou application partielle à renforcer.";
    }

    return "Sans objet ou non observé dans le périmètre actuel du projet.";
  }

  if (questionCode.startsWith("CAT_")) {
    return "Enjeu identifié dans le profil inhérent du projet.";
  }

  if (questionCode.startsWith("NP1_")) {
    return profile.esgMaturity === "strong"
      ? "Dispositif formalisé avec suivi régulier."
      : "Dispositif existant mais nécessitant un renforcement documentaire.";
  }

  if (questionCode.startsWith("NP2_HR_")) {
    return profile.hrMaturity === "strong"
      ? "Procédure RH en place et appliquée."
      : "Pratique en place avec formalisation partielle.";
  }

  if (questionCode.startsWith("NP2_HS_")) {
    return "Mesure opérationnelle présente sur site.";
  }

  if (questionCode.startsWith("NP4_") || questionCode.startsWith("NP5_") || questionCode.startsWith("NP6_")) {
    return "Mesures d’encadrement prévues dans le dispositif projet.";
  }

  if (questionCode.startsWith("CLIMATE_")) {
    return "Le sujet climatique est identifié dans la stratégie de l’entreprise.";
  }

  return "Dispositif déclaré par l’entreprise.";
}

function buildHrBooleanMap(profile) {
  if (profile.hrMaturity === "strong") {
    return {
      NP2_HR_Q001: true,
      NP2_HR_Q002: true,
      NP2_HR_Q003: false,
      NP2_HR_Q004: false,
      NP2_HR_Q005: true,
      NP2_HR_Q006: true,
      NP2_HR_Q007: true,
      NP2_HR_Q008: true,
      NP2_HR_Q009: true,
      NP2_HR_Q010: true,
      NP2_HR_Q011: true,
      NP2_HR_Q012: true,
      NP2_HR_Q013: true,
      NP2_HR_Q014: true,
      NP2_HR_Q015: false,
      NP2_HR_Q016: true,
      NP2_HR_SUPPLIERS_001: true,
    };
  }

  if (profile.hrMaturity === "weak") {
    return {
      NP2_HR_Q001: false,
      NP2_HR_Q002: false,
      NP2_HR_Q003: false,
      NP2_HR_Q004: false,
      NP2_HR_Q005: false,
      NP2_HR_Q006: false,
      NP2_HR_Q007: false,
      NP2_HR_Q008: false,
      NP2_HR_Q009: false,
      NP2_HR_Q010: false,
      NP2_HR_Q011: false,
      NP2_HR_Q012: false,
      NP2_HR_Q013: false,
      NP2_HR_Q014: true,
      NP2_HR_Q015: true,
      NP2_HR_Q016: true,
      NP2_HR_SUPPLIERS_001: false,
    };
  }

  return {
    NP2_HR_Q001: true,
    NP2_HR_Q002: true,
    NP2_HR_Q003: false,
    NP2_HR_Q004: false,
    NP2_HR_Q005: true,
    NP2_HR_Q006: true,
    NP2_HR_Q007: true,
    NP2_HR_Q008: true,
    NP2_HR_Q009: true,
    NP2_HR_Q010: true,
    NP2_HR_Q011: true,
    NP2_HR_Q012: true,
    NP2_HR_Q013: false,
    NP2_HR_Q014: true,
    NP2_HR_Q015: false,
    NP2_HR_Q016: true,
    NP2_HR_SUPPLIERS_001: true,
  };
}

function buildNp1Map(profile) {
  if (profile.esgMaturity === "strong") {
    return {
      NP1_001: true,
      NP1_002: true,
      NP1_003: true,
      NP1_004: true,
      NP1_005: true,
      NP1_006: true,
      NP1_007: true,
      NP1_008: true,
    };
  }

  if (profile.esgMaturity === "weak") {
    return {
      NP1_001: false,
      NP1_002: false,
      NP1_003: false,
      NP1_004: false,
      NP1_005: false,
      NP1_006: false,
      NP1_007: false,
      NP1_008: false,
    };
  }

  return {
    NP1_001: true,
    NP1_002: true,
    NP1_003: true,
    NP1_004: false,
    NP1_005: true,
    NP1_006: true,
    NP1_007: false,
    NP1_008: true,
  };
}

function buildHsBloc2Map(profile) {
  if (profile.esgMaturity === "strong") {
    return {
      NP2_HS_B2_001: true,
      NP2_HS_B2_002: true,
      NP2_HS_B2_003: true,
      NP2_HS_B2_004: true,
      NP2_HS_B2_005: true,
      NP2_HS_B2_006: true,
      NP2_HS_B2_007: true,
      NP2_HS_B2_008: true,
      NP2_HS_B2_009: true,
      NP2_HS_B2_010: true,
      NP2_HS_B2_011: true,
      NP2_HS_B2_012: true,
      NP2_HS_B2_013: false,
      NP2_HS_B2_014: true,
      NP2_HS_B2_016: true,
      NP2_HS_B2_019: true,
      NP2_HS_B2_020: true,
      NP2_HS_B2_021: true,
      NP2_HS_B2_022: true,
    };
  }

  return {
    NP2_HS_B2_001: true,
    NP2_HS_B2_002: true,
    NP2_HS_B2_003: true,
    NP2_HS_B2_004: true,
    NP2_HS_B2_005: false,
    NP2_HS_B2_006: true,
    NP2_HS_B2_007: true,
    NP2_HS_B2_008: false,
    NP2_HS_B2_009: false,
    NP2_HS_B2_010: true,
    NP2_HS_B2_011: false,
    NP2_HS_B2_012: false,
    NP2_HS_B2_013: false,
    NP2_HS_B2_014: false,
    NP2_HS_B2_016: true,
    NP2_HS_B2_019: true,
    NP2_HS_B2_020: false,
    NP2_HS_B2_021: true,
    NP2_HS_B2_022: false,
  };
}

function buildTableRows(questionCode, profile) {
  if (questionCode === "NP2_HR_ACCIDENT_TABLE") {
    return profile.accidents.length ? profile.accidents : [{ nature: "", occurrence: "" }];
  }

  if (questionCode === "NP3_LIQUID_WASTE_TABLE") {
    if (!profile.liquidWaste) {
      return [
        { label: "Est-ce que l’usine ou le projet produit des déchets liquides ?", response: "NO", value: "" },
        { label: "Existence d’un raccordement au réseau public d’assainissement ?", response: "NSP", value: "" },
        { label: "Existence d’une station de prétraitement avant rejet extérieur ?", response: "NSP", value: "" },
        { label: "Est-ce qu’il existe un contrôle régulier et un suivi des rejets des eaux usées et pluviales ?", response: "NSP", value: "" },
      ];
    }

    return [
      { label: "Est-ce que l’usine ou le projet produit des déchets liquides ?", response: "YES", value: profile.waterUse ? "Effluents industriels ou eaux de process" : "Eaux sanitaires" },
      { label: "Existence d’un raccordement au réseau public d’assainissement ?", response: profile.serviceCompany ? "YES" : "YES", value: "Raccordement opérationnel" },
      { label: "Existence d’une station de prétraitement avant rejet extérieur ?", response: profile.esgMaturity === "strong" || profile.scenario === "AGRO" ? "YES" : "NO", value: profile.esgMaturity === "strong" || profile.scenario === "AGRO" ? "Prétraitement physico-chimique" : "" },
      { label: "Est-ce qu’il existe un contrôle régulier et un suivi des rejets des eaux usées et pluviales ?", response: profile.esgMaturity === "strong" ? "YES" : "NO", value: profile.esgMaturity === "strong" ? "Analyses trimestrielles" : "" },
    ];
  }

  if (questionCode === "NP3_SOLID_WASTE_TABLE") {
    if (!profile.solidWaste) {
      return [
        { label: "Est-ce que l’usine ou le projet produit des déchets solides ?", response: "NO", value: "" },
        { label: "Est-ce que l’usine ou le projet procède à la collecte séparative de ses déchets solides (déchets recyclables, déchets organiques, déchets dangereux, etc.) ?", response: "NSP", value: "" },
        { label: "Est-ce que l’usine ou le projet procède à la valorisation ou au recyclage de ses déchets ?", response: "NSP", value: "" },
        { label: "Existe-il un contrôle et un suivi de la collecte et de l’élimination des déchets solides de l’usine ou du projet ?", response: "NSP", value: "" },
      ];
    }

    return [
      { label: "Est-ce que l’usine ou le projet produit des déchets solides ?", response: "YES", value: profile.serviceCompany ? "Déchets de bureau et cartons" : "Déchets de production et emballages" },
      { label: "Est-ce que l’usine ou le projet procède à la collecte séparative de ses déchets solides (déchets recyclables, déchets organiques, déchets dangereux, etc.) ?", response: profile.esgMaturity === "weak" ? "NO" : "YES", value: profile.esgMaturity === "weak" ? "" : "Bacs dédiés sur site" },
      { label: "Est-ce que l’usine ou le projet procède à la valorisation ou au recyclage de ses déchets ?", response: profile.serviceCompany ? "NO" : profile.esgMaturity === "strong" ? "YES" : "NO", value: profile.esgMaturity === "strong" ? "Carton, plastique et rebuts métalliques" : "" },
      { label: "Existe-il un contrôle et un suivi de la collecte et de l’élimination des déchets solides de l’usine ou du projet ?", response: profile.esgMaturity === "strong" ? "YES" : "NO", value: profile.esgMaturity === "strong" ? "Bordereaux mensuels" : "" },
    ];
  }

  if (questionCode === "NP3_AIR_EMISSIONS_TABLE") {
    if (!profile.airEmissions) {
      return [
        { label: "Est-ce que le process industriel ou le projet conduit à l’émission de gaz, de poussières ou de particules dans l’atmosphère ?", response: "NO", value: "" },
        { label: "Émission de COV (composés organiques volatiles) ?", response: "NSP", value: "" },
        { label: "Émission de particules en suspension ?", response: "NSP", value: "" },
        { label: "Autres émissions gazeuses ?", response: "NSP", value: "" },
        { label: "Existe-il un contrôle et un suivi des émissions de gaz, poussières ou particules dans l’atmosphère ?", response: "NSP", value: "" },
        { label: "Est-ce que vos locaux de production ou de stockage sont équipés d’un système de ventilation forcée ?", response: "NSP", value: "" },
        { label: "Est-ce que vos locaux de production ou de stockage ou les machines sont équipés de systèmes de traitement d’air appropriés et dédiés, comportant un ensemble de filtres propres à capter les gaz, poussières ou particules émis dans l’atmosphère ?", response: "NSP", value: "" },
      ];
    }

    return [
      { label: "Est-ce que le process industriel ou le projet conduit à l’émission de gaz, de poussières ou de particules dans l’atmosphère ?", response: "YES", value: profile.scenario === "CEMENT" ? "Poussières et gaz de combustion" : "Poussières, gaz d’échappement ou fumées" },
      { label: "Émission de COV (composés organiques volatiles) ?", response: profile.scenario === "MANUFACTURING" ? "YES" : "NO", value: profile.scenario === "MANUFACTURING" ? "Présence ponctuelle sur solvants de nettoyage" : "" },
      { label: "Émission de particules en suspension ?", response: "YES", value: profile.scenario === "CEMENT" ? "Élevée" : "Modérée" },
      { label: "Autres émissions gazeuses ?", response: profile.scenario === "TRANSPORT" ? "YES" : "NO", value: profile.scenario === "TRANSPORT" ? "Gaz d’échappement diesel" : "" },
      { label: "Existe-il un contrôle et un suivi des émissions de gaz, poussières ou particules dans l’atmosphère ?", response: profile.esgMaturity === "strong" ? "YES" : "NO", value: profile.esgMaturity === "strong" ? "Mesures périodiques et registre HSE" : "" },
      { label: "Est-ce que vos locaux de production ou de stockage sont équipés d’un système de ventilation forcée ?", response: profile.scenario === "TRANSPORT" ? "NO" : "YES", value: profile.scenario === "TRANSPORT" ? "" : "Ventilation dédiée atelier" },
      { label: "Est-ce que vos locaux de production ou de stockage ou les machines sont équipés de systèmes de traitement d’air appropriés et dédiés, comportant un ensemble de filtres propres à capter les gaz, poussières ou particules émis dans l’atmosphère ?", response: profile.esgMaturity === "strong" || profile.scenario === "CEMENT" ? "YES" : "NO", value: profile.esgMaturity === "strong" || profile.scenario === "CEMENT" ? "Cyclones et filtres à manches" : "" },
    ];
  }

  if (questionCode === "NP3_HAZARDOUS_MATERIALS_TABLE") {
    if (!profile.hazardous) {
      return [
        { label: "Est-ce que le process industriel ou le projet conduit à l’utilisation de matières dangereuses ou/et à la production de déchets dangereux ?", response: "NO", value: "" },
        { label: "Utilisation d’amiante ?", response: "NSP", value: "" },
        { label: "Utilisation de PCB ?", response: "NSP", value: "" },
        { label: "Utilisation de substances détruisant la couche d’ozone (CFC, réfrigérants…) ?", response: "NSP", value: "" },
        { label: "Utilisation de métaux lourds ?", response: "NSP", value: "" },
        { label: "Utilisation ou production de matières dangereuses ?", response: "NSP", value: "" },
        { label: "Existe-il un contrôle et un suivi de l’utilisation des matières dangereuses et de la collecte et de l’élimination des déchets dangereux de l’usine ou du projet ?", response: "NSP", value: "" },
        { label: "Existe-il des mesures visant à prévenir la production de déchets dangereux ?", response: "NSP", value: "" },
      ];
    }

    return [
      { label: "Est-ce que le process industriel ou le projet conduit à l’utilisation de matières dangereuses ou/et à la production de déchets dangereux ?", response: "YES", value: profile.scenario === "TEXTILE" ? "Colorants et auxiliaires chimiques" : "Huiles, solvants ou produits de maintenance" },
      { label: "Utilisation d’amiante ?", response: "NO", value: "" },
      { label: "Utilisation de PCB ?", response: "NO", value: "" },
      { label: "Utilisation de substances détruisant la couche d’ozone (CFC, réfrigérants…) ?", response: profile.ozone ? "YES" : "NO", value: "" },
      { label: "Utilisation de métaux lourds ?", response: profile.scenario === "MANUFACTURING" ? "YES" : "NO", value: profile.scenario === "MANUFACTURING" ? "Usage ponctuel dans certains composants" : "" },
      { label: "Utilisation ou production de matières dangereuses ?", response: "YES", value: "Produits chimiques de production ou maintenance" },
      { label: "Existe-il un contrôle et un suivi de l’utilisation des matières dangereuses et de la collecte et de l’élimination des déchets dangereux de l’usine ou du projet ?", response: profile.esgMaturity === "strong" ? "YES" : "NO", value: profile.esgMaturity === "strong" ? "Registre HSE et prestataire agréé" : "" },
      { label: "Existe-il des mesures visant à prévenir la production de déchets dangereux ?", response: profile.esgMaturity === "strong" ? "YES" : "NO", value: profile.esgMaturity === "strong" ? "Substitution progressive et maintenance préventive" : "" },
    ];
  }

  if (questionCode === "NP3_EMERGENCY_PREPAREDNESS_TABLE") {
    return [
      { label: "Existe-il des précautions à suivre en cas d’accident / d’incident et des procédures d’urgence ?", response: profile.esgMaturity === "strong" ? "YES" : "NO" },
      { label: "Est-ce que les installations de stockage, systèmes de canalisations, réseaux de drainage sont en bon état ?", response: profile.industrial ? "YES" : "NSP" },
      { label: "Existence de normes internes de surveillance et d’entretien des installations de stockage, systèmes de canalisations, réseaux de drainage", response: profile.industrial && profile.esgMaturity === "strong" ? "YES" : profile.industrial ? "NO" : "NSP" },
      { label: "Cas de pollution des sols et des eaux souterraines au niveau et aux alentours des sites de stockage ou du projet", response: profile.soilContamination ? "YES" : "NO" },
    ];
  }

  return [];
}

function buildAnswerForQuestion(question, profile, app, company) {
  const hrMap = buildHrBooleanMap(profile);
  const np1Map = buildNp1Map(profile);
  const hsBloc2Map = buildHsBloc2Map(profile);

  if (question.type === QuestionType.TABLE) {
    return tableAnswer(buildTableRows(question.code, profile));
  }

  if (question.code.startsWith("CAT_")) {
    const flagMap = {
      CAT_A_001: profile.scenario === "CEMENT",
      CAT_A_002: profile.infrastructure,
      CAT_A_003: false,
      CAT_A_004: profile.culturalSite,
      CAT_A_005: false,
      CAT_A_006: profile.displacement,
      CAT_A_007: false,
      CAT_A_008: false,
      CAT_A_009: profile.biodiversity,
      CAT_A_010: false,
      CAT_A_011: profile.irreversibleImpact,
      CAT_BP_001: profile.hazardous,
      CAT_BP_002: profile.solidWaste,
      CAT_BP_003: profile.ozone,
      CAT_BP_004: false,
      CAT_BP_005: profile.permits,
      CAT_BP_006: profile.soilContamination,
      CAT_B_001: profile.industrial || profile.scenario === "TRANSPORT",
      CAT_B_002: profile.noise,
      CAT_B_003: profile.liquidWaste,
      CAT_B_004: profile.airEmissions,
      CAT_B_005: profile.waterUse,
      CAT_B_006: profile.energyUse,
      CAT_C_001: profile.serviceCompany,
      CAT_FI_001: profile.financialIntermediary,
    };

    const answerValue = flagMap[question.code] ? "YES" : "NO";
    return choiceAnswer(
      question,
      answerValue,
      question.hasComment ? buildBooleanComment(question.code, answerValue, profile) : null
    );
  }

  const handlers = {
    REG_001: () => choiceAnswer(question, profile.regulatory.eia, buildBooleanComment(question.code, profile.regulatory.eia, profile)),
    REG_002: () => choiceAnswer(question, profile.regulatory.eiaStatus, "Statut issu du suivi réglementaire interne."),
    REG_003: () => choiceAnswer(question, profile.regulatory.buildPermit, question.hasComment ? "Autorisation liée au projet disponible ou en cours." : null),
    REG_004: () => choiceAnswer(question, profile.regulatory.classifiedSite, question.hasComment ? "Classement selon l’activité déclarée." : null),
    REG_005: () => choiceAnswer(question, profile.regulatory.otherPermit, question.hasComment ? "Autorisations spécifiques sectorielles identifiées." : null),
    REG_006: () => textAnswer(profile.regulatory.date),
    REG_007: () => textAnswer(profile.regulatory.authorities),
    CERT_001: () => choiceAnswer(question, profile.certifications.international, question.hasComment ? "Référentiels internationaux selon le positionnement commercial." : null),
    CERT_002: () => textAnswer(profile.certifications.details || "Aucune norme internationale formalisée à ce stade."),
    CERT_003: () => choiceAnswer(question, profile.certifications.cert003 ? "YES" : "NO", question.hasComment ? buildBooleanComment(question.code, profile.certifications.cert003 ? "YES" : "NO", profile) : null),
    CERT_004: () => choiceAnswer(question, profile.certifications.cert004 ? "YES" : "NO", question.hasComment ? buildBooleanComment(question.code, profile.certifications.cert004 ? "YES" : "NO", profile) : null),
    CERT_005: () => choiceAnswer(question, profile.certifications.cert005 ? "YES" : "NO", question.hasComment ? buildBooleanComment(question.code, profile.certifications.cert005 ? "YES" : "NO", profile) : null),
    CERT_006: () => choiceAnswer(question, profile.certifications.cert006 ? "YES" : "NO", question.hasComment ? buildBooleanComment(question.code, profile.certifications.cert006 ? "YES" : "NO", profile) : null),
    CERT_007: () => choiceAnswer(question, profile.certifications.cert007 ? "YES" : "NO", question.hasComment ? buildBooleanComment(question.code, profile.certifications.cert007 ? "YES" : "NO", profile) : null),
    CERT_008: () => choiceAnswer(question, profile.certifications.cert008 ? "YES" : "NO", question.hasComment ? buildBooleanComment(question.code, profile.certifications.cert008 ? "YES" : "NO", profile) : null),
    CERT_009: () => choiceAnswer(question, profile.certifications.cert009 ? "YES" : "NO", question.hasComment ? buildBooleanComment(question.code, profile.certifications.cert009 ? "YES" : "NO", profile) : null),
    CERT_010: () => choiceAnswer(question, profile.certifications.cert010 ? "YES" : "NO", question.hasComment ? buildBooleanComment(question.code, profile.certifications.cert010 ? "YES" : "NO", profile) : null),
    CERT_011: () => textAnswer(profile.certifications.others || "Aucune autre certification déclarée."),
    NP2_HS_B2_015: () => textAnswer("2025-09-15"),
    NP2_HS_B2_017: () => choiceAnswer(question, profile.esgMaturity === "strong" ? "QUARTERLY" : "ANNUAL"),
    NP2_HS_B2_018: () => textAnswer("2025-10-01"),
    NP2_HR_ORG_001: () => numberAnswer(profile.shifts),
    NP2_HR_ORG_002: () => textAnswer(profile.workHours),
    NP2_HR_ORG_003: () => numberAnswer(profile.workDays),
    NP2_HR_EFFECTIFS_CADRES_HOMMES: () => numberAnswer(profile.hrHeadcount.cadresHommes),
    NP2_HR_EFFECTIFS_CADRES_FEMMES: () => numberAnswer(profile.hrHeadcount.cadresFemmes),
    NP2_HR_EFFECTIFS_MAITRISE_HOMMES: () => numberAnswer(profile.hrHeadcount.maitriseHommes),
    NP2_HR_EFFECTIFS_MAITRISE_FEMMES: () => numberAnswer(profile.hrHeadcount.maitriseFemmes),
    NP2_HR_EFFECTIFS_AGENTS_HOMMES: () => numberAnswer(profile.hrHeadcount.agentsHommes),
    NP2_HR_EFFECTIFS_AGENTS_FEMMES: () => numberAnswer(profile.hrHeadcount.agentsFemmes),
    NP2_HR_EFFECTIFS_PERMANENT_HOMMES: () => numberAnswer(profile.hrHeadcount.permanentHommes),
    NP2_HR_EFFECTIFS_PERMANENT_FEMMES: () => numberAnswer(profile.hrHeadcount.permanentFemmes),
    NP2_HR_EFFECTIFS_INTERIMAIRE_HOMMES: () => numberAnswer(profile.hrHeadcount.interimHommes),
    NP2_HR_EFFECTIFS_INTERIMAIRE_FEMMES: () => numberAnswer(profile.hrHeadcount.interimFemmes),
    NP2_HR_Q001_DETAILS: () =>
      textAnswer(
        hrMap.NP2_HR_Q001
          ? "Politique anti-discrimination intégrée au règlement intérieur, sensibilisation managers et suivi RH."
          : "Aucune politique formalisée, pratiques en cours de structuration."
      ),
    NP2_HR_Q002_DETAILS: () =>
      textAnswer(
        hrMap.NP2_HR_Q002
          ? "Plans de prévention, formation sécurité et suivi des incidents par le responsable HSE."
          : "Mesures ponctuelles sans dispositif formalisé complet."
      ),
    NP2_HR_Q006_DETAILS: () =>
      textAnswer(
        hrMap.NP2_HR_Q006
          ? "Convention collective sectorielle appliquée et communiquée au personnel."
          : "Aucune convention collective explicitement déployée."
      ),
    NP2_HR_SUPPLIERS_001_DETAILS: () =>
      textAnswer(
        hrMap.NP2_HR_SUPPLIERS_001
          ? "Clauses contractuelles HSE et contrôles documentaires auprès des sous-traitants critiques."
          : "Aucun dispositif spécifique autre que les obligations contractuelles générales."
      ),
    NP4_001_DETAILS: () =>
      textAnswer(
        profile.communityImpact
          ? "Plan de circulation, horaires maîtrisés, information des riverains et suivi des incidents."
          : "Aucune mesure spécifique au-delà des pratiques opérationnelles courantes."
      ),
    NP4_002_DETAILS: () =>
      textAnswer(
        profile.communityImpact
          ? "Réunions avec riverains, point focal réclamations et communication de chantier."
          : "Consultation limitée aux autorités locales et échanges ponctuels avec les parties prenantes."
      ),
    NP4_003_DETAILS: () =>
      textAnswer(
        profile.communityImpact
          ? "Affichage sur site, téléphone de contact et réunions périodiques avec les parties concernées."
          : "Information transmise au besoin via le point de contact projet."
      ),
    NP5_001_DETAILS: () =>
      textAnswer(
        profile.displacement
          ? "Mesures prévues d’indemnisation et de dialogue avec les ménages affectés selon le planning des travaux."
          : "Aucun déplacement involontaire identifié."
      ),
    NP6_001_DETAILS: () =>
      textAnswer(
        profile.biodiversity
          ? "Mesures de limitation des nuisances, contrôle des rejets et encadrement des travaux en zone sensible."
          : "Impacts biodiversité jugés limités au regard du périmètre actuel."
      ),
    NP6_002_DETAILS: () =>
      textAnswer(
        ["TEXTILE", "AGRO", "MANUFACTURING"].includes(profile.scenario)
          ? "Sélection progressive de fournisseurs tracés et exigence documentaire sur l’origine des intrants."
          : "Chaîne d’approvisionnement peu exposée à ce risque."
      ),
    NP7_001_DETAILS: () => textAnswer("Aucune population autochtone identifiée dans le périmètre d’implantation."),
    NP8_001_DETAILS: () =>
      textAnswer(
        profile.culturalSite
          ? "Coordination prévue avec les autorités locales pour préserver le site et limiter les nuisances."
          : "Aucun site culturel sensible identifié à proximité immédiate."
      ),
    CLIMATE_001: () => numberAnswer(profile.totalEnergy),
    CLIMATE_002: () => numberAnswer(profile.fuelEnergy),
    CLIMATE_003: () => numberAnswer(profile.gasEnergy),
    CLIMATE_004: () => numberAnswer(profile.renewableEnergy),
    CLIMATE_005: () => numberAnswer(profile.otherEnergy),
    CLIMATE_006: () => textAnswer(profile.otherEnergy ? "Électricité achetée via contrat spécifique." : "Aucune autre source significative."),
    CLIMATE_007: () => choiceAnswer(question, profile.climateAwareness ? "YES" : "NO", question.hasComment ? buildBooleanComment(question.code, profile.climateAwareness ? "YES" : "NO", profile) : null),
    CLIMATE_008: () => choiceAnswer(question, profile.transitionPlan, question.hasComment ? "Positionnement climatique cohérent avec la trajectoire d’investissement." : null),
    CLIMATE_009: () => numberAnswer(profile.climatePlannedYear || ""),
    CLIMATE_010: () =>
      textAnswer(
        profile.transitionPlan === "YES"
          ? "Modernisation énergétique, suivi de consommation et investissement progressif dans des équipements sobres."
          : profile.transitionPlan === "PLANNED"
            ? "Feuille de route de transition en préparation avec priorisation des investissements énergétiques."
            : "Aucun plan structuré à ce stade."
      ),
    CLIMATE_011: () => numberAnswer(profile.climateInvestment),
    CLIMATE_012: () => textAnswer(profile.climateRevenueImpact),
    CLIMATE_013: () => textAnswer(profile.climateCostImpact),
    CLIMATE_014: () => choiceAnswer(question, profile.exporterStatus, question.hasComment ? "Positionnement commercial régional ou international selon le secteur." : null),
    CLIMATE_015: () => numberAnswer(profile.exporterStatus === "PLANNED" ? profile.exporterPlannedYear || "2028" : profile.exporterPlannedYear || ""),
    CLIMATE_016: () => multipleChoiceAnswer(question, profile.exportDestinations, question.hasComment ? "Destinations cohérentes avec le portefeuille commercial visé." : null),
  };

  if (handlers[question.code]) {
    return handlers[question.code]();
  }

  if (question.code.startsWith("NP1_")) {
    const answerValue = np1Map[question.code] ? "YES" : "NO";
    return choiceAnswer(question, answerValue, question.hasComment ? buildBooleanComment(question.code, answerValue, profile) : null);
  }

  if (question.code.startsWith("NP2_HS_B1_")) {
    const nuisances = {
      NP2_HS_B1_001: profile.noise,
      NP2_HS_B1_002: profile.airEmissions || profile.infrastructure,
      NP2_HS_B1_003: profile.airEmissions,
      NP2_HS_B1_004: profile.scenario === "AGRO",
      NP2_HS_B1_005: profile.infrastructure || profile.scenario === "CEMENT",
      NP2_HS_B1_006: profile.infrastructure || profile.scenario === "TRANSPORT",
      NP2_HS_B1_007: profile.hazardous,
    };
    const answerValue = nuisances[question.code] ? "YES" : "NO";
    return choiceAnswer(question, answerValue, question.hasComment ? buildBooleanComment(question.code, answerValue, profile) : null);
  }

  if (question.code.startsWith("NP2_HS_B2_")) {
    const answerValue = hsBloc2Map[question.code] ? "YES" : "NO";
    return choiceAnswer(question, answerValue, question.hasComment ? buildBooleanComment(question.code, answerValue, profile) : null);
  }

  if (question.code.startsWith("NP2_HR_Q") || question.code === "NP2_HR_SUPPLIERS_001") {
    const answerValue = hrMap[question.code] ? "YES" : "NO";
    return choiceAnswer(question, answerValue, question.hasComment ? buildBooleanComment(question.code, answerValue, profile) : null);
  }

  if (["NP4_001", "NP4_002", "NP4_003", "NP5_001", "NP6_001", "NP6_002", "NP7_001", "NP8_001"].includes(question.code)) {
    const map = {
      NP4_001: profile.communityImpact,
      NP4_002: profile.communityImpact || profile.infrastructure,
      NP4_003: profile.communityImpact,
      NP5_001: profile.displacement,
      NP6_001: profile.biodiversity,
      NP6_002: ["TEXTILE", "AGRO", "MANUFACTURING"].includes(profile.scenario),
      NP7_001: false,
      NP8_001: profile.culturalSite,
    };
    const answerValue = map[question.code] ? "YES" : "NO";
    return choiceAnswer(question, answerValue, question.hasComment ? buildBooleanComment(question.code, answerValue, profile) : null);
  }

  if (question.type === QuestionType.BOOLEAN) {
    return choiceAnswer(question, "NO", question.hasComment ? buildBooleanComment(question.code, "NO", profile) : null);
  }

  if (question.type === QuestionType.SINGLE_CHOICE) {
    const defaultValue = question.options?.[0]?.value || "";
    return choiceAnswer(question, defaultValue, question.hasComment ? "Réponse fournie selon le profil sectoriel." : null);
  }

  if (question.type === QuestionType.MULTIPLE_CHOICE) {
    return multipleChoiceAnswer(question, [], question.hasComment ? "Aucune destination renseignée pour ce profil." : null);
  }

  if (question.type === QuestionType.NUMBER) {
    return numberAnswer(0);
  }

  if (question.type === QuestionType.DATE) {
    return textAnswer("2025-01-01");
  }

  return textAnswer(`Réponse de démonstration pour ${company.companyName}.`);
}

function buildQuestionnaireAnswers(formSections, company, app) {
  const profile = buildProfile(app.profile, app.overrides || {});

  return formSections.flatMap((section) =>
    (section.questions || []).map((question) => {
      const answer = buildAnswerForQuestion(question, profile, app, company);

      return {
        section: section.code,
        questionCode: question.code,
        answerValue: answer.answerValue,
        answerLabel: answer.answerLabel,
        comment: answer.comment,
      };
    })
  );
}

async function cleanupDemoData() {
  const demoCompanies = await prisma.company.findMany({
    where: {
      OR: [
        { name: { startsWith: "DEMO -" } },
        { users: { some: { email: { in: DEMO_EMAILS } } } },
      ],
    },
    select: { id: true },
  });

  const companyIds = demoCompanies.map((company) => company.id);

  if (!companyIds.length) {
    await prisma.user.deleteMany({
      where: { email: { in: DEMO_EMAILS } },
    });
    return;
  }

  const demoApplications = await prisma.application.findMany({
    where: { companyId: { in: companyIds } },
    select: { id: true },
  });
  const applicationIds = demoApplications.map((application) => application.id);

  await prisma.$transaction(async (tx) => {
    if (applicationIds.length) {
      await tx.eSGAssessmentResult.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      await tx.questionnaireAnswer.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      await tx.adminReview.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      await tx.committeeDecision.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      await tx.correctiveAction.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      await tx.applicationAttachment.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      await tx.projectProfile.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      await tx.application.deleteMany({
        where: { id: { in: applicationIds } },
      });
    }

    await tx.user.deleteMany({
      where: {
        OR: [
          { email: { in: DEMO_EMAILS } },
          { companyId: { in: companyIds } },
        ],
      },
    });

    await tx.company.deleteMany({
      where: { id: { in: companyIds } },
    });
  });
}

function buildApplicationDates(index) {
  const createdAt = new Date(Date.UTC(2026, 0, 8 + index * 3, 9, 0, 0));
  const updatedAt = new Date(createdAt);
  updatedAt.setDate(createdAt.getDate() + 12);
  return { createdAt, updatedAt };
}

async function createDemoData() {
  const activeTemplate = await prisma.formTemplate.findFirst({
    where: { isActive: true },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: {
              options: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!activeTemplate) {
    throw new Error("Aucun formulaire SGES actif trouvé. Exécutez d’abord npm run seed.");
  }

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  let applicationCounter = 0;

  for (const companyDef of DEMO_COMPANIES) {
    const company = await prisma.company.create({
      data: {
        name: companyDef.companyName,
        legalForm: companyDef.legalForm,
        sector: companyDef.sector,
        activityDescription: companyDef.activityDescription,
        address: companyDef.address,
      },
    });

    await prisma.user.create({
      data: {
        name: companyDef.userName,
        email: companyDef.email,
        password: hashedPassword,
        role: Role.ENTERPRISE,
        companyId: company.id,
      },
    });

    for (const appDef of companyDef.apps) {
      const { createdAt, updatedAt } = buildApplicationDates(applicationCounter);
      const profileDetails = buildProjectProfileDetails(companyDef, appDef);
      const builtProfile = buildProfile(appDef.profile, appDef.overrides || {});

      const application = await prisma.application.create({
        data: {
          companyId: company.id,
          status: appDef.status,
          projectName: appDef.projectName,
          projectType: appDef.projectNature,
          activityType: companyDef.sector,
          financingAmount: appDef.financingAmount,
          location: appDef.location,
          categoryAuto: builtProfile.category,
          categoryFinal: null,
          createdAt,
          updatedAt,
        },
      });

      await prisma.projectProfile.create({
        data: {
          applicationId: application.id,
          companyId: company.id,
          projectNature: appDef.projectNature,
          marketType: builtProfile.marketType,
          zoneType: appDef.zoneType,
          projectSummary: JSON.stringify(profileDetails),
          siteLocation: appDef.location,
          estimatedDuration:
            appDef.projectNature === ProjectNature.NEW_PROJECT ? "18 mois" : "9 mois",
          createdAt,
          updatedAt,
        },
      });

      const answers = buildQuestionnaireAnswers(activeTemplate.sections, companyDef, appDef);

      await prisma.questionnaireAnswer.createMany({
        data: answers.map((answer) => ({
          applicationId: application.id,
          section: answer.section,
          questionCode: answer.questionCode,
          answerValue: answer.answerValue,
          answerLabel: answer.answerLabel,
          comment: answer.comment,
          createdAt,
          updatedAt,
        })),
      });

      applicationCounter += 1;
    }
  }

  return {
    companies: DEMO_COMPANIES.length,
    applications: applicationCounter,
  };
}

async function main() {
  await cleanupDemoData();
  const counts = await createDemoData();
  console.log(
    `Demo seed complete: ${counts.companies} companies and ${counts.applications} applications created`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
