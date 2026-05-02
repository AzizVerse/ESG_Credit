const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const env = require("../config/env");
const ApiError = require("../utils/apiError");

const prisma = new PrismaClient();

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError("Authorization token required", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      return next(new ApiError("User not found", 401));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    return next();
  } catch (error) {
    return next(new ApiError("Invalid or expired token", 401));
  }
}

module.exports = authMiddleware;
