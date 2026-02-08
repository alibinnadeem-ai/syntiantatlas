export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Joi validation error
  if (err.details) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  // Database error
  if (err.code) {
    return res.status(400).json({
      error: 'Database error',
      message: err.message
    });
  }

  // Generic error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
