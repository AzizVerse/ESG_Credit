const ApiResponse = require("../../utils/apiResponse");

const decisionsService = require("./decisions.service");

module.exports = {
  list: async (req, res, next) => {
    try {
      const data = await decisionsService.list();
      return ApiResponse.success(res, data, "Decisions list placeholder");
    } catch (error) {
      return next(error);
    }
  },
  create: async (req, res, next) => {
    try {
      const data = await decisionsService.create(req.body);
      return ApiResponse.success(res, data, "Decisions create placeholder", 201);
    } catch (error) {
      return next(error);
    }
  },
};
