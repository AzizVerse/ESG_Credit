const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const companiesRoutes = require("./modules/companies/companies.routes");
const applicationsRoutes = require("./modules/applications/applications.routes");
const attachmentsRoutes = require("./modules/attachments/attachments.routes");
const formsRoutes = require("./modules/forms/forms.routes");
const questionnaireRoutes = require("./modules/questionnaire/questionnaire.routes");
const scoringRoutes = require("./modules/scoring/scoring.routes");
const reviewsRoutes = require("./modules/reviews/reviews.routes");
const decisionsRoutes = require("./modules/decisions/decisions.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "ESG backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", usersRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api", attachmentsRoutes);
app.use("/api/forms", formsRoutes);
app.use("/api", questionnaireRoutes);
app.use("/api/scoring", scoringRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/decisions", decisionsRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

module.exports = app;
