// utils/auditLogger.js
const { redactPII } = require('./piiRedactor');
const AuditLog = require('../models/AuditLog');
const AuditStat = require('../models/AuditStat');
const UniqueIP = require('../models/UniqueIP');

const auditLogger = {
  log: async (event, metadata = {}) => {
    try {
      // Stringify and redact the entire metadata object to ensure PII is masked
      const stringifiedMetadata = JSON.stringify(metadata);
      const safeMetadata = redactPII(stringifiedMetadata);
      const parsedMetadata = JSON.parse(safeMetadata);

      const payload = {
        timestamp: new Date().toISOString(),
        event,
        metadata: parsedMetadata
      };

      // Log to stdout (legacy behavior)
      console.log(JSON.stringify({ type: 'AUDIT', ...payload }));

      // Save to MongoDB AuditLog
      const auditLog = new AuditLog({
        userId: metadata.userId || null,
        userEmail: metadata.userEmail || null,
        action: event,
        details: parsedMetadata,
        ipAddress: metadata.ipAddress || null
      });
      await auditLog.save();

      // Increment AuditStat
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      await AuditStat.findOneAndUpdate(
        { date: today, action: event },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );

      // Track Unique IP if present
      if (metadata.ipAddress) {
        await UniqueIP.updateOne(
          { ip: metadata.ipAddress },
          { $setOnInsert: { ip: metadata.ipAddress } },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("Failed to save audit log to DB:", error);
    }
  }
};

module.exports = auditLogger;
