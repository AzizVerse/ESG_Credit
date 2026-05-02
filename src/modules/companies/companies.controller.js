const ApiResponse = require("../../utils/apiResponse");

const companiesService = require("./companies.service");

module.exports = {
  list: async (req, res, next) => {
    try {
      const data = await companiesService.list();
      return ApiResponse.success(res, data, "Companies list placeholder");
    } catch (error) {
      return next(error);
    }
  },
  create: async (req, res, next) => {
    try {
      const data = await companiesService.create(req.body);
      return ApiResponse.success(res, data, "Companies create placeholder", 201);
    } catch (error) {
      return next(error);
    }
  },
};
