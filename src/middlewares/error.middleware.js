const errorHandler = (err, req, res, next) => {
    /*
  ========================================
  MONGODB DUPLICATE KEY ERROR
  ========================================
  */

  if (err.code === 11000) {
    const duplicateField = Object.keys(
      err.keyValue
    )[0];

    const duplicateValue =
      err.keyValue[duplicateField];

    return res.status(409).json({
      success: false,
      message: `${duplicateField} already exists`,
      field: duplicateField,
      value: duplicateValue,
    });
  }



  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack:
      process.env.NODE_ENV === "development"
        ? err.stack
        : null,
  });
};

export { errorHandler };