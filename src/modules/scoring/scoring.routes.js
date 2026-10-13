const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const controller = require("./scoring.controller");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

router.get("/admin/dashboard-summary", controller.getDashboardSummary);
router.get("/admin/sector-settings", controller.getSectorSettings);
router.put("/admin/sector-settings", controller.saveSectorSettings);
router.get("/admin/calculation-check", controller.getCalculationCheck);
router.post("/admin/calculate-missing", controller.calculateMissing);
router.post("/admin/recalculate-all", controller.recalculateAll);
router.post("/applications/:applicationId/calculate", controller.calculate);
router.get("/applications/:applicationId/result", controller.getByApplicationId);

module.exports = router;
