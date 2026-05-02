const fs = require("fs");
const path = require("path");
const multer = require("multer");

const ApiError = require("../../utils/apiError");

const uploadDir = path.resolve(process.cwd(), "uploads", "attachments");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new ApiError("Format de fichier non autorise", 400));
      return;
    }

    cb(null, true);
  },
});

module.exports = {
  uploadSingleAttachment: upload.single("file"),
};
