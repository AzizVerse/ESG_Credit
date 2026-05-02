class ApiError extends Error {
  constructor(message = "Internal server error", statusCode = 500, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = ApiError;
