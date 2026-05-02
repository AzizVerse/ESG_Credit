function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    details: err.details || null,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}

module.exports = errorMiddleware;
