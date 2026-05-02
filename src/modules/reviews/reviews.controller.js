const ApiResponse = require("../../utils/apiResponse");

const reviewsService = require("./reviews.service");

module.exports = {
  list: async (req, res, next) => {
    try {
      const data = await reviewsService.list();
      return ApiResponse.success(res, data, "Reviews list placeholder");
    } catch (error) {
      return next(error);
    }
  },
  create: async (req, res, next) => {
    try {
      const data = await reviewsService.create(req.body);
      return ApiResponse.success(res, data, "Reviews create placeholder", 201);
    } catch (error) {
      return next(error);
    }
  },
};
