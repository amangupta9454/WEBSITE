// utils/auditLogger.js
const { redactPII } = require('./piiRedactor');

const auditLogger = {
  log: (event, metadata = {}) => {
    // Stringify and redact the entire metadata object to ensure PII is masked
    const stringifiedMetadata = JSON.stringify(metadata);
    const safeMetadata = redactPII(stringifiedMetadata);

    const payload = {
      timestamp: new Date().toISOString(),
      event,
      metadata: JSON.parse(safeMetadata)
    };

    // In a real system, you might append this to a dedicated audit collection or S3 bucket.
    // For now, we log to stdout for Datadog/CloudWatch to pick up.
    console.log(JSON.stringify({ type: 'AUDIT', ...payload }));
  }
};

module.exports = auditLogger;
