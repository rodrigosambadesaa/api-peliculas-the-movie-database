function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `No existe la ruta ${req.method} ${req.originalUrl}.`,
    },
  });
}

function errorHandler(error, _req, res, _next) {
  if (error.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos enviados.',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  if (error.code === 'TMDB_ERROR') {
    return res.status(error.status || 502).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  console.error(error);
  res.status(error.status || 500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'No hemos podido completar la operación.',
    },
  });
}

module.exports = { notFound, errorHandler };
