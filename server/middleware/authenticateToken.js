const jwt = require("jsonwebtoken");

/**
 * Reusable HTTP auth middleware.
 * Extracted from the existing `authenticateToken` implementations in route files.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Unauthorized" });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return res.status(500).json({ error: "Server misconfigured" });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { authenticateToken };

