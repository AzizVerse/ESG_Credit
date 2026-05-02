const ApiResponse = require("../../utils/apiResponse");

const scoringService = require("./scoring.service");

module.exports = {
  calculate: async (req, res, next) => {
    try {
      const data = await scoringService.calculate(req.body);
      return ApiResponse.success(res, data, "Scoring calculate placeholder");
    } catch (error) {
      return next(error);
    }
  },
  getByApplicationId: async (req, res, next) => {
    try {
      const data = await scoringService.getByApplicationId(req.params.applicationId);
      return ApiResponse.success(res, data, "Scoring getByApplicationId placeholder");
    } catch (error) {
      return next(error);
    }
  },
};
