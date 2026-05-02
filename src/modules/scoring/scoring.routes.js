const express = require("express");

const controller = require("./scoring.controller");

const router = express.Router();

router.post("/calculate", controller.calculate);
router.get("/:applicationId", controller.getByApplicationId);

module.exports = router;
