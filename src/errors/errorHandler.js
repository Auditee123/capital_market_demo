const { AppError } = require('./AppError');

// Centralized Express error-handling middleware. Keeps responses to a
// consistent { code, message } shape and never leaks stack traces.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ code: err.code, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
}

module.exports = errorHandler;
