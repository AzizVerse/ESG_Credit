const ApiResponse = require("../../utils/apiResponse");

const applicationsService = require("./applications.service");

module.exports = {
  createApplication: async (req, res, next) => {
    try {
      const data = await applicationsService.createApplication(req.user, req.body);
      return ApiResponse.success(res, data, "Application created successfully", 201);
    } catch (error) {
      return next(error);
    }
  },
  getMyApplications: async (req, res, next) => {
    try {
      const data = await applicationsService.getMyApplications(req.user);
      return ApiResponse.success(res, data, "Applications fetched successfully");
    } catch (error) {
      return next(error);
    }
  },
  getMyApplicationById: async (req, res, next) => {
    try {
      const data = await applicationsService.getMyApplicationById(req.user, req.params.id);
      return ApiResponse.success(res, data, "Application fetched successfully");
    } catch (error) {
      return next(error);
    }
  },
  updateMyApplication: async (req, res, next) => {
    try {
      const data = await applicationsService.updateMyApplication(req.user, req.params.id, req.body);
      return ApiResponse.success(res, data, "Application updated successfully");
    } catch (error) {
      return next(error);
    }
  },
  submitApplication: async (req, res, next) => {
    try {
      const data = await applicationsService.submitApplication(req.user, req.params.id);
      return ApiResponse.success(res, data, "Application submitted successfully");
    } catch (error) {
      return next(error);
    }
  },
  getAllApplications: async (req, res, next) => {
    try {
      const data = await applicationsService.getAllApplications();
      return ApiResponse.success(res, data, "Applications fetched successfully");
    } catch (error) {
      return next(error);
    }
  },
  getApplicationById: async (req, res, next) => {
    try {
      const data = await applicationsService.getApplicationById(req.params.id);
      return ApiResponse.success(res, data, "Application fetched successfully");
    } catch (error) {
      return next(error);
    }
  },
};
