const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.getProfile);

module.exports = router;
