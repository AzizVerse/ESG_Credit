const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const controller = require("./users.controller");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/enterprise-accounts", controller.listEnterpriseAccounts);
router.post("/enterprise-accounts", controller.createEnterpriseAccount);
router.get("/enterprise-accounts/:id", controller.getEnterpriseAccountById);

module.exports = router;
