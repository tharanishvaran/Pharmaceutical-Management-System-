export const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.message);

  // Return formatted JSON error without leaking internal stack traces or raw database queries
  res.status(err.status || 500).json({
    success: false,
    error: err.status === 404 ? '404 Not Found' :
           err.status === 403 ? '403 Forbidden' :
           err.status === 401 ? '401 Unauthorized' :
           err.status === 400 ? '400 Bad Request' : '500 Internal Server Error',
    message: err.message || 'Something went wrong. Please try again.'
  });
};
