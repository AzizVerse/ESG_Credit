const ApiResponse = require("../../utils/apiResponse");

const usersService = require("./users.service");

module.exports = {
  createEnterpriseAccount: async (req, res, next) => {
    try {
      const data = await usersService.createEnterpriseAccount(req.body);
      return ApiResponse.success(
        res,
        data,
        "Compte entreprise créé avec succès.",
        201
      );
    } catch (error) {
      return next(error);
    }
  },
  listEnterpriseAccounts: async (req, res, next) => {
    try {
      const data = await usersService.listEnterpriseAccounts();
      return ApiResponse.success(res, data, "Liste des comptes entreprises");
    } catch (error) {
      return next(error);
    }
  },
  getEnterpriseAccountById: async (req, res, next) => {
    try {
      const data = await usersService.getEnterpriseAccountById(req.params.id);
      return ApiResponse.success(res, data, "Détail du compte entreprise");
    } catch (error) {
      return next(error);
    }
  },
};
