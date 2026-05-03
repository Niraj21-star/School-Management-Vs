const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
  });
};

module.exports = errorHandler;
