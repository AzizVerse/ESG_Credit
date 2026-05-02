const { PrismaClient, ApplicationStatus, Role } = require("@prisma/client");

const ApiError = require("../../utils/apiError");

const prisma = new PrismaClient();
const DEFAULT_CATEGORY_AUTO = "A_DETERMINER";

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function normalizeOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

function normalizeOptionalBoolean(value) {
  if (value === true || value === false) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function normalizeOptionalDate(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function getProjectProfileDetails(data) {
  return {
    legalName: String(data?.legalName || "").trim(),
    address: String(data?.address || "").trim(),
    zoneType: normalizeOptionalString(data?.zoneType),
    isIndustrialZone: normalizeOptionalBoolean(data?.isIndustrialZone),
    contactName: normalizeOptionalString(data?.contactName),
    contactPosition: normalizeOptionalString(data?.contactPosition),
    creationDate: normalizeOptionalDate(data?.creationDate),
    totalSurface: normalizeOptionalNumber(data?.totalSurface),
    coveredSurface: normalizeOptionalNumber(data?.coveredSurface),
    projectNature: normalizeOptionalString(data?.projectNature),
    activitySector: String(data?.activitySector || "").trim(),
    projectDescription: normalizeOptionalString(data?.projectDescription),
  };
}

function validateProjectProfileDetails(details) {
  const requiredFields = ["legalName", "address", "zoneType", "projectNature", "activitySector"];

  for (const field of requiredFields) {
    if (!details[field]) {
      throw new ApiError(`${field} is required`, 400);
    }
  }

  if (![true, false].includes(details.isIndustrialZone)) {
    throw new ApiError("isIndustrialZone is required", 400);
  }
}

function getProjectProfilePayload(companyId, applicationId, details) {
  return {
    companyId,
    applicationId,
    projectNature: details.projectNature || null,
    zoneType: details.zoneType || null,
    siteLocation: details.address || null,
    estimatedDuration: null,
    projectSummary: JSON.stringify(details),
  };
}

function getApplicationInclude() {
  return {
    company: true,
    projectProfile: true,
  };
}

function toApplicationResponse(application) {
  if (!application?.projectProfile) {
    return application;
  }

  let details = null;

  if (application.projectProfile.projectSummary) {
    try {
      details = JSON.parse(application.projectProfile.projectSummary);
    } catch (error) {
      details = null;
    }
  }

  return {
    ...application,
    projectProfile: {
      ...application.projectProfile,
      details,
    },
  };
}

async function getEnterpriseCompanyId(user) {
  if (!user?.companyId) {
    throw new ApiError("Enterprise user must belong to a company", 400);
  }

  return user.companyId;
}

function getApplicationPayload(data) {
  const projectProfileDetails = getProjectProfileDetails(data);

  return {
    projectName: projectProfileDetails.legalName,
    projectType: projectProfileDetails.projectNature || "",
    activityType: projectProfileDetails.activitySector,
    financingAmount: Number(data?.financingAmount),
    location: projectProfileDetails.address,
    categoryAuto: String(data?.categoryAuto || DEFAULT_CATEGORY_AUTO).trim(),
    categoryFinal: data?.categoryFinal ? String(data.categoryFinal).trim() : null,
    projectProfileDetails,
  };
}

function validateApplicationPayload(payload) {
  const requiredFields = [
    "projectName",
    "projectType",
    "activityType",
    "location",
    "categoryAuto",
  ];

  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new ApiError(`${field} is required`, 400);
    }
  }

  if (Number.isNaN(payload.financingAmount)) {
    throw new ApiError("financingAmount must be a valid number", 400);
  }

  validateProjectProfileDetails(payload.projectProfileDetails);
}

async function createApplication(user, data) {
  if (user?.role !== Role.ENTERPRISE) {
    throw new ApiError("Access denied", 403);
  }

  const companyId = await getEnterpriseCompanyId(user);
  const payload = getApplicationPayload(data);

  validateApplicationPayload(payload);

  const application = await prisma.$transaction(async (tx) => {
    const createdApplication = await tx.application.create({
      data: {
        projectName: payload.projectName,
        projectType: payload.projectType,
        activityType: payload.activityType,
        financingAmount: payload.financingAmount,
        location: payload.location,
        categoryAuto: payload.categoryAuto,
        categoryFinal: payload.categoryFinal,
        companyId,
      },
    });

    await tx.projectProfile.create({
      data: getProjectProfilePayload(companyId, createdApplication.id, payload.projectProfileDetails),
    });

    return tx.application.findUnique({
      where: { id: createdApplication.id },
      include: getApplicationInclude(),
    });
  });

  return toApplicationResponse(application);
}

async function getMyApplications(user) {
  const companyId = await getEnterpriseCompanyId(user);

  const applications = await prisma.application.findMany({
    where: { companyId },
    include: getApplicationInclude(),
    orderBy: { createdAt: "desc" },
  });

  return applications.map(toApplicationResponse);
}

async function getMyApplicationById(user, applicationId) {
  const companyId = await getEnterpriseCompanyId(user);

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      companyId,
    },
    include: getApplicationInclude(),
  });

  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  return toApplicationResponse(application);
}

async function updateMyApplication(user, applicationId, data) {
  const existingApplication = await getMyApplicationById(user, applicationId);

  if (existingApplication.status !== ApplicationStatus.DRAFT) {
    throw new ApiError("Only draft applications can be updated", 400);
  }

  const payload = getApplicationPayload(data);

  validateApplicationPayload(payload);

  const application = await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: {
        projectName: payload.projectName,
        projectType: payload.projectType,
        activityType: payload.activityType,
        financingAmount: payload.financingAmount,
        location: payload.location,
        categoryAuto: payload.categoryAuto,
        categoryFinal: payload.categoryFinal,
      },
    });

    await tx.projectProfile.upsert({
      where: { applicationId },
      update: getProjectProfilePayload(existingApplication.companyId, applicationId, payload.projectProfileDetails),
      create: getProjectProfilePayload(existingApplication.companyId, applicationId, payload.projectProfileDetails),
    });

    return tx.application.findUnique({
      where: { id: applicationId },
      include: getApplicationInclude(),
    });
  });

  return toApplicationResponse(application);
}

async function submitApplication(user, applicationId) {
  const existingApplication = await getMyApplicationById(user, applicationId);

  if (existingApplication.status !== ApplicationStatus.DRAFT) {
    throw new ApiError("Only draft applications can be submitted", 400);
  }

  const application = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: ApplicationStatus.SUBMITTED,
    },
    include: getApplicationInclude(),
  });

  return toApplicationResponse(application);
}

async function getAllApplications() {
  const applications = await prisma.application.findMany({
    include: getApplicationInclude(),
    orderBy: { createdAt: "desc" },
  });

  return applications.map(toApplicationResponse);
}

async function getApplicationById(applicationId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: getApplicationInclude(),
  });

  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  return toApplicationResponse(application);
}

module.exports = {
  createApplication,
  getMyApplications,
  getMyApplicationById,
  updateMyApplication,
  submitApplication,
  getAllApplications,
  getApplicationById,
};
