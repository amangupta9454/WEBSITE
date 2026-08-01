const AssessmentOrchestrationEvent = require("../../../models/assessment/AssessmentOrchestrationEvent");

/**
 * Component 12: Notification Events
 * Internal system architecture for creating operational platform telemetry events without external email or push notifications.
 */
class NotificationEventService {
  /**
   * Dispatches an architectural event into the event stream.
   * @param {string} eventType - One of ["Inventory Low", "Inventory Restored", "Job Failed", "AI Runtime Failure", "Queue Overflow", "Worker Offline", "DLQ Alert", "Optimization Complete"]
   * @param {string} message - Descriptive event payload.
   * @param {string} targetName - Target domain, subcategory, or worker.
   * @param {string} severity - "INFO" | "WARNING" | "CRITICAL" | "SUCCESS"
   * @param {object} metadata - Structured diagnostic data.
   */
  static async createEvent(eventType, message, targetName = "System", severity = "INFO", metadata = {}) {
    try {
      const eventId = `EVT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const evt = await AssessmentOrchestrationEvent.create({
        eventId,
        eventType,
        severity,
        targetName,
        message,
        metadata,
      });
      console.log(`[OrchestrationEvent] [${severity}] ${eventType}: ${message} (${targetName})`);
      return evt;
    } catch (error) {
      console.error("[NotificationEventService:createEvent] Error:", error.message);
      return null;
    }
  }

  /**
   * Retrieves paginated event history with filtering by severity or eventType.
   */
  static async getEvents(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.eventType && query.eventType !== "ALL") filter.eventType = query.eventType;
    if (query.severity && query.severity !== "ALL") filter.severity = query.severity;
    if (query.acknowledged === "false") filter.acknowledged = false;

    const total = await AssessmentOrchestrationEvent.countDocuments(filter);
    const events = await AssessmentOrchestrationEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: events,
    };
  }

  /**
   * Marks events as acknowledged.
   */
  static async acknowledgeEvent(eventId) {
    try {
      const updated = await AssessmentOrchestrationEvent.findOneAndUpdate(
        { eventId },
        { $set: { acknowledged: true } },
        { new: true }
      );
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = NotificationEventService;
