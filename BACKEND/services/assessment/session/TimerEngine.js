const AssessmentSession = require("../../../models/assessment/AssessmentSession");

/**
 * Component 5: Timer Engine & Component 16: Session Health
 * Authoritative server timer calculation ensuring resilience against browser refresh, temporary network disconnects,
 * or client-side JavaScript clock manipulation (Component 17 Security).
 * Computes warning triggers and automatically terminates expired sessions without evaluating results.
 */
class TimerEngine {
  /**
   * Evaluates real-time authoritative server duration and health heartbeat status for a session.
   *
   * @param {string} sessionId
   * @param {Object} options - { registerHeartbeat: true, candidateId: "..." }
   */
  static async checkTimerAndHeartbeat(sessionId, options = { registerHeartbeat: false, candidateId: null }) {
    try {
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) {
        return { success: false, error: "Session ID not found." };
      }

      if (options.candidateId && session.candidateId !== options.candidateId && session.userId?.toString() !== options.candidateId) {
        return { success: false, error: "SECURITY_UNAUTHORIZED: Requester does not match session candidate identity." };
      }

      const now = Date.now();
      const startedAtMs = new Date(session.startedAt || now).getTime();
      const expiresAtMs = new Date(session.expiresAt).getTime();
      const lastHeartbeatMs = new Date(session.lastHeartbeatAt || startedAtMs).getTime();

      const timeLimitMinutes = session.configSnapshot?.timeLimitMinutes || 30;
      const totalAllocatedSeconds = timeLimitMinutes * 60;
      const elapsedSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));
      const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

      // 1. Check expiration and Auto-Submit trigger (Component 5)
      let isExpired = remainingSeconds <= 0;
      let statusChanged = false;

      if (isExpired && !session.isLocked && session.status !== "Completed" && session.status !== "Expired") {
        session.status = "Expired";
        session.connectionStatus = "Expired";
        session.isLocked = true; // Auto lock on time out (Component 12)
        session.timeline.push({
          eventId: `EVT-${now}-AUTOEXP`,
          eventType: "Submit", // Auto submit trigger on expiration
          timestamp: new Date(),
          details: { reason: "Authoritative server assessment timer reached zero seconds. Session auto-submitted and locked." },
        });
        statusChanged = true;
      }

      // 2. Compute Warning Events (Component 5)
      const warnings = [];
      if (!isExpired) {
        if (remainingSeconds <= 300 && remainingSeconds > 60) {
          warnings.push({ type: "TIME_WARNING_5M", message: "Warning: Less than 5 minutes remaining." });
        } else if (remainingSeconds <= 60 && remainingSeconds > 0) {
          warnings.push({ type: "TIME_CRITICAL_1M", message: "CRITICAL WARNING: Less than 60 seconds remaining! Answers will auto-submit when time expires." });
        }
      }

      // 3. Evaluate Session Health & Heartbeat (Component 16)
      let connectionStatus = session.connectionStatus || "Healthy";
      if (!isExpired) {
        if (options.registerHeartbeat) {
          const gapMs = now - lastHeartbeatMs;
          if (gapMs > 45000 && connectionStatus === "Disconnected") {
            connectionStatus = "Recovered";
            session.timeline.push({
              eventId: `EVT-${now}-REC`,
              eventType: "Heartbeat",
              timestamp: new Date(),
              details: { status: "Recovered from temporary network disconnection." },
            });
          } else {
            connectionStatus = "Healthy";
          }
          session.lastHeartbeatAt = new Date();
          session.connectionStatus = connectionStatus;
          statusChanged = true;
        } else {
          // Diagnose passive status without registering heartbeat
          const gapMs = now - lastHeartbeatMs;
          if (gapMs > 90000) {
            connectionStatus = "Disconnected";
            if (session.connectionStatus !== "Disconnected") {
              session.connectionStatus = "Disconnected";
              statusChanged = true;
            }
          } else if (gapMs > 35000) {
            connectionStatus = "Idle";
            if (session.connectionStatus !== "Idle") {
              session.connectionStatus = "Idle";
              statusChanged = true;
            }
          }
        }
      }

      if (statusChanged) {
        await session.save();
      }

      return {
        success: true,
        sessionId: session.sessionId,
        status: session.status,
        connectionStatus: session.connectionStatus,
        isLocked: session.isLocked,
        timer: {
          totalAllocatedSeconds,
          elapsedSeconds,
          remainingSeconds,
          isExpired,
          authoritativeSource: "SERVER_CLOCK",
          questionTimerSeconds: session.configSnapshot?.questionTimerSeconds || 0,
        },
        warnings,
        lastHeartbeat: session.lastHeartbeatAt,
      };
    } catch (error) {
      console.error("[TimerEngine] Error calculating server clock:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = TimerEngine;
