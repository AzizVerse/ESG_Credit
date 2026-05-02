const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const controller = require("./attachments.controller");
const roleMiddleware = require("../../middleware/role.middleware");
const { uploadSingleAttachment } = require("./attachments.upload");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/applications/my/:id/attachments",
  roleMiddleware("ENTERPRISE"),
  uploadSingleAttachment,
  controller.uploadMyAttachment
);
router.get(
  "/applications/my/:id/attachments",
  roleMiddleware("ENTERPRISE"),
  controller.getMyAttachments
);
router.get(
  "/applications/:id/attachments",
  roleMiddleware("ADMIN"),
  controller.getApplicationAttachments
);
router.get("/attachments/:id/download", controller.downloadAttachment);

module.exports = router;
