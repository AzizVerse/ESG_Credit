const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const controller = require("./applications.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/", roleMiddleware("ENTERPRISE"), controller.createApplication);
router.get("/my", roleMiddleware("ENTERPRISE"), controller.getMyApplications);
router.get("/my/:id", roleMiddleware("ENTERPRISE"), controller.getMyApplicationById);
router.put("/my/:id", roleMiddleware("ENTERPRISE"), controller.updateMyApplication);
router.post("/my/:id/submit", roleMiddleware("ENTERPRISE"), controller.submitApplication);

router.get("/", roleMiddleware("ADMIN"), controller.getAllApplications);
router.get("/:id", roleMiddleware("ADMIN"), controller.getApplicationById);

module.exports = router;
