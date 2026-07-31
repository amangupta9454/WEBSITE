/**
 * API Key Authentication Middleware for Code-A-Nova Email Service
 * Protects email integration endpoints against unauthorized API access.
 * Designed specifically for verification against automated senders like Google Apps Script.
 */

module.exports = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const configuredApiKey = process.env.MAIL_API_KEY;

    if (!configuredApiKey) {
      console.error('[ApiKeyAuth] ❌ CRITICAL ERROR: MAIL_API_KEY is not defined in system environment.');
      return res.status(500).json({
        success: false,
        message: 'Internal server error: Mail authentication gateway unconfigured',
      });
    }

    if (!apiKey || apiKey !== configuredApiKey) {
      console.warn(`[ApiKeyAuth] ⚠️ Unauthorized access attempt on ${req.method} ${req.originalUrl} from IP: ${req.ip || req.connection?.remoteAddress}`);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing API key',
      });
    }

    next();
  } catch (error) {
    console.error('[ApiKeyAuth] Middleware exception encountered:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication process failed due to internal error',
    });
  }
};
