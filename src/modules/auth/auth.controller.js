const ApiResponse = require("../../utils/apiResponse");

const authService = require("./auth.service");

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body);
    return ApiResponse.success(res, data, "Registration successful", 201);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body?.email, req.body?.password);
    return ApiResponse.success(res, data, "Login successful");
  } catch (error) {
    return next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const data = await authService.getProfile(req.user?.id);
    return ApiResponse.success(res, data, "Profile fetched successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile,
};
