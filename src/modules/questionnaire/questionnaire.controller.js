const ApiResponse = require("../../utils/apiResponse");

const questionnaireService = require("./questionnaire.service");

module.exports = {
  saveMyAnswers: async (req, res, next) => {
    try {
      const answers = req.body?.answers ?? req.body;
      const data = await questionnaireService.saveMyAnswers(req.user, req.params.id, answers);
      return ApiResponse.success(res, data, "Answers saved successfully");
    } catch (error) {
      return next(error);
    }
  },
  getMyAnswers: async (req, res, next) => {
    try {
      const data = await questionnaireService.getMyAnswers(req.user, req.params.id);
      return ApiResponse.success(res, data, "Answers fetched successfully");
    } catch (error) {
      return next(error);
    }
  },
  getAnswersByApplication: async (req, res, next) => {
    try {
      const data = await questionnaireService.getAnswersByApplication(req.params.id);
      return ApiResponse.success(res, data, "Answers fetched successfully");
    } catch (error) {
      return next(error);
    }
  },
};
