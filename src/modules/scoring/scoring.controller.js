const ApiResponse = require("../../utils/apiResponse");

const scoringService = require("./scoring.service");

module.exports = {
  calculate: async (req, res, next) => {
    try {
      const data = await scoringService.calculate(req.params.applicationId);
      return ApiResponse.success(res, data, "Bilan ESG calculé avec succès.");
    } catch (error) {
      return next(error);
    }
  },
  getByApplicationId: async (req, res, next) => {
    try {
      const data = await scoringService.getByApplicationId(req.params.applicationId);
      return ApiResponse.success(res, data, "Bilan ESG récupéré avec succès.");
    } catch (error) {
      return next(error);
    }
  },
  getDashboardSummary: async (req, res, next) => {
    try {
      const data = await scoringService.getDashboardSummary();
      return ApiResponse.success(
        res,
        data,
        "Synthèse du tableau de bord ESG récupérée avec succès."
      );
    } catch (error) {
      return next(error);
    }
  },
  calculateMissing: async (req, res, next) => {
    try {
      const data = await scoringService.calculateMissing();
      return ApiResponse.success(res, data, "Bilans ESG manquants calculés avec succès.");
    } catch (error) {
      return next(error);
    }
  },
  recalculateAll: async (req, res, next) => {
    try {
      const data = await scoringService.recalculateAll();
      return ApiResponse.success(res, data, "Tous les bilans ESG ont été recalculés avec succès.");
    } catch (error) {
      return next(error);
    }
  },
};
