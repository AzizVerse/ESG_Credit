const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  jwtSecret: process.env.JWT_SECRET || "change-me",
};
