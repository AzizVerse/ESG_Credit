const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const controller = require("./forms.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/active", controller.getActiveForm);
router.get("/sections", controller.getSections);
router.get("/sections/:sectionId/questions", controller.getSectionQuestions);

module.exports = router;
