const ApiResponse = require("../../utils/apiResponse");

const formsService = require("./forms.service");

module.exports = {
  getActiveForm: async (req, res, next) => {
    try {
      const data = await formsService.getActiveForm();
      return ApiResponse.success(res, data, "Formulaire actif recupere avec succes");
    } catch (error) {
      return next(error);
    }
  },
  getSections: async (req, res, next) => {
    try {
      const data = await formsService.getSections();
      return ApiResponse.success(res, data, "Sections du formulaire recuperees avec succes");
    } catch (error) {
      return next(error);
    }
  },
  getSectionQuestions: async (req, res, next) => {
    try {
      const data = await formsService.getSectionQuestions(req.params.sectionId);
      return ApiResponse.success(res, data, "Questions de la section recuperees avec succes");
    } catch (error) {
      return next(error);
    }
  },
};
