const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';
  const isProd = process.env.NODE_ENV === 'production';

  if (err.name === 'CastError' && err.kind === 'ObjectId') { statusCode = 404; message = 'Resource not found'; }
  if (err.code === 11000) { statusCode = 400; const f = Object.keys(err.keyValue || {})[0] || 'Field'; message = `${f.charAt(0).toUpperCase() + f.slice(1)} already exists`; }
  if (err.name === 'ValidationError') { statusCode = 400; message = Object.values(err.errors).map(e => e.message).join('. '); }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token. Please log in again.'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Session expired. Please log in again.'; }

  if (statusCode >= 500 && !isProd) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    // Never leak stack traces or internal messages in production
    message: isProd && statusCode >= 500 ? 'Something went wrong. Please try again.' : message,
    ...((!isProd) && { stack: err.stack }),
  });
};
module.exports = errorHandler;
