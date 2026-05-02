const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const controller = require("./questionnaire.controller");

const router = express.Router();

router.use(authMiddleware);

router.put(
  "/applications/my/:id/answers",
  roleMiddleware("ENTERPRISE"),
  controller.saveMyAnswers
);
router.get(
  "/applications/my/:id/answers",
  roleMiddleware("ENTERPRISE"),
  controller.getMyAnswers
);
router.get(
  "/applications/:id/answers",
  roleMiddleware("ADMIN"),
  controller.getAnswersByApplication
);

module.exports = router;
