const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient, Role } = require("@prisma/client");

const env = require("../../config/env");
const ApiError = require("../../utils/apiError");

const prisma = new PrismaClient();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email || "").trim().toLowerCase());
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

async function register(userData) {
  const name = String(userData?.name || "").trim();
  const email = String(userData?.email || "").trim().toLowerCase();
  const password = String(userData?.password || "");
  const role = String(userData?.role || "").trim().toUpperCase();
  const companyId = userData?.companyId || null;

  if (!name) {
    throw new ApiError("Name is required", 400);
  }

  if (!isValidEmail(email)) {
    throw new ApiError("Valid email is required", 400);
  }

  if (!password) {
    throw new ApiError("Password is required", 400);
  }

  if (!Object.values(Role).includes(role)) {
    throw new ApiError("Role must be ADMIN or ENTERPRISE", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError("User already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      companyId,
    },
  });

  return {
    token: createToken(user),
    user: sanitizeUser(user),
  };
}

async function login(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const plainPassword = String(password || "");

  if (!isValidEmail(normalizedEmail)) {
    throw new ApiError("Valid email is required", 400);
  }

  if (!plainPassword) {
    throw new ApiError("Password is required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new ApiError("Invalid credentials", 401);
  }

  const passwordMatches = await bcrypt.compare(plainPassword, user.password);

  if (!passwordMatches) {
    throw new ApiError("Invalid credentials", 401);
  }

  return {
    token: createToken(user),
    user: sanitizeUser(user),
  };
}

async function getProfile(userId) {
  if (!userId) {
    throw new ApiError("Authentication required", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return sanitizeUser(user);
}

module.exports = {
  register,
  login,
  getProfile,
};
