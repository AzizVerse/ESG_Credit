const ApiResponse = require("../../utils/apiResponse");

const scoringService = require("./scoring.service");
const scoringSettings = require("./scoring.settings");

module.exports = {
  calculate: async (req, res, next) => {
    try {
      const data = await scoringService.calculate(req.params.applicationId, req.body || {});
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
      const data = await scoringService.calculateMissing(req.body || {});
      return ApiResponse.success(res, data, "Bilans ESG manquants calculés avec succès.");
    } catch (error) {
      return next(error);
    }
  },
  recalculateAll: async (req, res, next) => {
    try {
      const data = await scoringService.recalculateAll(req.body || {});
      return ApiResponse.success(res, data, "Tous les bilans ESG ont été recalculés avec succès.");
    } catch (error) {
      return next(error);
    }
  },
  getSectorSettings: async (req, res, next) => {
    try {
      return ApiResponse.success(res, scoringSettings.getSettings(), "Sector settings retrieved.");
    } catch (error) { return next(error); }
  },
  saveSectorSettings: async (req, res, next) => {
    try {
      const data = scoringSettings.saveSettings(req.body || {}, req.user.id);
      return ApiResponse.success(res, data, "Sector settings saved.");
    } catch (error) { return next(error); }
  },
  getCalculationCheck: async (req, res, next) => {
    try {
      const data = await scoringService.getCalculationCheck(req.query);
      return ApiResponse.success(res, data, "Calculation settings checked.");
    } catch (error) { return next(error); }
  },
};
