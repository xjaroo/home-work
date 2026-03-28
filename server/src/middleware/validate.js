export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(
      req.method === 'GET' ? { ...req.query, ...req.params } : { ...req.body, ...req.params, ...req.query }
    );
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    }
    req.valid = result.data;
    next();
  };
}
