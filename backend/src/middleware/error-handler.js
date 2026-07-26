export function errorHandler(error, req, res, _next) {
  const id = req?.requestId || req?.headers?.['x-request-id'] || 'no-id';
  // include request id in server logs
  // eslint-disable-next-line no-console
  console.error(`[req:${id}]`, error && (error.stack || error.message || error));

  if (error.code === "EBADCSRFTOKEN") {
    res.status(403).json({ error: "Invalid or missing CSRF token", requestId: id });
    return;
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
    const label = field === "company_name" ? "Supplier name" : field || "Record";
    res.status(409).json({ error: `${label} already exists.`, requestId: id });
    return;
  }

  // If the error includes a structured localization key, return it so the frontend can localize the message
  if (error.errorKey) {
    res.status(error.status || 500).json({
      error: {
        key: error.errorKey,
        params: error.errorParams || null,
        message: error.message || "Internal server error"
      },
      requestId: id
    });
    return;
  }

  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
    requestId: id
  });
}
