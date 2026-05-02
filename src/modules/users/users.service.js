const bcrypt = require("bcryptjs");
const { PrismaClient, Role } = require("@prisma/client");

const ApiError = require("../../utils/apiError");

const prisma = new PrismaClient();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email || "").trim().toLowerCase());
}

function buildCompanyNameFromEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const [prefix] = normalized.split("@");
  const safeName = prefix.replace(/[^a-z0-9._-]/gi, " ").trim();
  return safeName || "entreprise";
}

function sanitizeEnterpriseUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: user.company?.name || null,
    createdAt: user.createdAt,
    applicationsCount: user._count?.company?.applications ?? user.company?._count?.applications ?? 0,
  };
}

async function createEnterpriseAccount(payload) {
  const email = String(payload?.email || "").trim().toLowerCase();
  const password = String(payload?.password || "");

  if (!isValidEmail(email)) {
    throw new ApiError("Adresse email invalide.", 400);
  }

  if (!password || password.length < 6) {
    throw new ApiError("Le mot de passe doit contenir au moins 6 caractères.", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError("Cet email existe déjà.", 409);
  }

  const companyName = buildCompanyNameFromEmail(email);
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        legalForm: "À compléter",
        sector: "À compléter",
        activityDescription: "À compléter",
        address: "À compléter",
      },
    });

    return tx.user.create({
      data: {
        name: companyName,
        email,
        password: hashedPassword,
        role: Role.ENTERPRISE,
        companyId: company.id,
      },
      include: {
        company: {
          include: {
            _count: {
              select: { applications: true },
            },
          },
        },
      },
    });
  });

  return sanitizeEnterpriseUser(user);
}

async function listEnterpriseAccounts() {
  const users = await prisma.user.findMany({
    where: { role: Role.ENTERPRISE },
    include: {
      company: {
        include: {
          _count: {
            select: { applications: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map(sanitizeEnterpriseUser);
}

async function getEnterpriseAccountById(userId) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: Role.ENTERPRISE,
    },
    include: {
      company: {
        include: {
          applications: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              projectName: true,
              status: true,
              projectType: true,
              financingAmount: true,
              location: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ApiError("Compte entreprise introuvable.", 404);
  }

  return {
    ...sanitizeEnterpriseUser(user),
    applications: user.company?.applications || [],
  };
}

module.exports = {
  createEnterpriseAccount,
  listEnterpriseAccounts,
  getEnterpriseAccountById,
};
