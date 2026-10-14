export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors) {
      const messages = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: messages[0]?.message || 'Validation error',
        errors: messages,
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid request body',
    });
  }
};
