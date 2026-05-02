const ApiResponse = require("../../utils/apiResponse");

const attachmentsService = require("./attachments.service");

module.exports = {
  uploadMyAttachment: async (req, res, next) => {
    try {
      const data = await attachmentsService.uploadMyAttachment(req.user, req.params.id, req.file, req.body);
      return ApiResponse.success(res, data, "Piece justificative ajoutee avec succes", 201);
    } catch (error) {
      return next(error);
    }
  },
  getMyAttachments: async (req, res, next) => {
    try {
      const data = await attachmentsService.getMyAttachments(req.user, req.params.id);
      return ApiResponse.success(res, data, "Pieces justificatives recuperees avec succes");
    } catch (error) {
      return next(error);
    }
  },
  getApplicationAttachments: async (req, res, next) => {
    try {
      const data = await attachmentsService.getApplicationAttachments(req.params.id);
      return ApiResponse.success(res, data, "Pieces justificatives recuperees avec succes");
    } catch (error) {
      return next(error);
    }
  },
  downloadAttachment: async (req, res, next) => {
    try {
      const data = await attachmentsService.getDownloadPayload(req.user, req.params.id);
      return res.download(data.absolutePath, data.downloadName);
    } catch (error) {
      return next(error);
    }
  },
};
