const fs = require("fs");
const path = require("path");
const { PrismaClient, Role } = require("@prisma/client");

const ApiError = require("../../utils/apiError");

const prisma = new PrismaClient();
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "attachments");
const ALLOWED_DOCUMENT_TYPES = new Set([
  "PROJECT_PROFILE",
  "REGULATORY_COMPLIANCE",
  "CERTIFICATIONS",
  "PERFORMANCE_STANDARD_1",
  "PERFORMANCE_STANDARD_2_HS",
  "PERFORMANCE_STANDARD_2_HR",
  "PERFORMANCE_STANDARD_3_LIQUID_WASTE",
  "PERFORMANCE_STANDARD_3_SOLID_WASTE",
  "PERFORMANCE_STANDARD_3_AIR_EMISSIONS",
  "PERFORMANCE_STANDARD_3_HAZARDOUS_MATERIALS",
  "PERFORMANCE_STANDARD_3_EMERGENCY_PREPAREDNESS",
]);

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function toAttachmentResponse(attachment) {
  return {
    id: attachment.id,
    applicationId: attachment.applicationId,
    originalName: attachment.originalName || attachment.fileName,
    fileName: attachment.fileName,
    fileType: attachment.fileType || attachment.mimeType || null,
    fileSize: attachment.fileSize,
    documentType: attachment.documentType,
    uploadedAt: attachment.uploadedAt || attachment.createdAt,
  };
}

async function getOwnedApplication(user, applicationId) {
  if (!user?.companyId) {
    throw new ApiError("Entreprise introuvable", 400);
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      companyId: user.companyId,
    },
  });

  if (!application) {
    throw new ApiError("Demande introuvable", 404);
  }

  return application;
}

async function getApplicationOrThrow(applicationId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new ApiError("Demande introuvable", 404);
  }

  return application;
}

function validateDocumentType(documentType) {
  const normalized = String(documentType || "").trim().toUpperCase();

  if (!ALLOWED_DOCUMENT_TYPES.has(normalized)) {
    throw new ApiError("documentType invalide", 400);
  }

  return normalized;
}

async function uploadMyAttachment(user, applicationId, file, body) {
  await getOwnedApplication(user, applicationId);

  if (!file) {
    throw new ApiError("Fichier requis", 400);
  }

  ensureUploadDir();
  const documentType = validateDocumentType(body?.documentType);

  const attachment = await prisma.applicationAttachment.create({
    data: {
      applicationId,
      uploadedById: user.id,
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      documentType,
      mimeType: file.mimetype,
      description: null,
    },
  });

  return toAttachmentResponse(attachment);
}

async function getMyAttachments(user, applicationId) {
  await getOwnedApplication(user, applicationId);

  const attachments = await prisma.applicationAttachment.findMany({
    where: { applicationId },
    orderBy: [{ documentType: "asc" }, { uploadedAt: "desc" }],
  });

  return attachments.map(toAttachmentResponse);
}

async function getApplicationAttachments(applicationId) {
  await getApplicationOrThrow(applicationId);

  const attachments = await prisma.applicationAttachment.findMany({
    where: { applicationId },
    orderBy: [{ documentType: "asc" }, { uploadedAt: "desc" }],
  });

  return attachments.map(toAttachmentResponse);
}

async function getDownloadPayload(user, attachmentId) {
  const attachment = await prisma.applicationAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      application: true,
    },
  });

  if (!attachment) {
    throw new ApiError("Piece justificative introuvable", 404);
  }

  if (user?.role === Role.ENTERPRISE) {
    if (!user.companyId || user.companyId !== attachment.application.companyId) {
      throw new ApiError("Acces refuse", 403);
    }
  } else if (user?.role !== Role.ADMIN) {
    throw new ApiError("Acces refuse", 403);
  }

  const absolutePath = path.resolve(attachment.filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new ApiError("Fichier introuvable", 404);
  }

  return {
    absolutePath,
    downloadName: attachment.originalName || attachment.fileName,
  };
}

module.exports = {
  uploadMyAttachment,
  getMyAttachments,
  getApplicationAttachments,
  getDownloadPayload,
};
