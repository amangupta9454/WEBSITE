const CircuitBreaker = require('../models/email/CircuitBreaker');
const emailLogger = require('../services/emailLogger');

/**
 * Wrapper for Nodemailer transporter.sendMail.
 * Implements a Circuit Breaker pattern to block sending for 1 hour after 3 consecutive failures.
 * Also automatically logs the email to the centralized Email Center.
 */
async function sendSafeEmail(transporter, mailOptions, campaign = 'General', source = 'Backend API') {
  const serviceName = 'email';
  const FAILURE_THRESHOLD = 3;
  const COOLDOWN_PERIOD_MS = 60 * 60 * 1000; // 1 hour

  // 1. Check Circuit Breaker
  let breaker = await CircuitBreaker.findOne({ serviceName });
  if (!breaker) {
    breaker = new CircuitBreaker({ serviceName });
    await breaker.save();
  }

  if (breaker.isTripped) {
    const timeSinceTrip = Date.now() - new Date(breaker.trippedAt).getTime();
    if (timeSinceTrip < COOLDOWN_PERIOD_MS) {
      const remainingMinutes = Math.ceil((COOLDOWN_PERIOD_MS - timeSinceTrip) / 60000);
      throw new Error(`Email sending is temporarily paused due to consecutive failures. Try again in ${remainingMinutes} minutes.`);
    } else {
      // Cooldown period passed, reset breaker to try again
      breaker.isTripped = false;
      breaker.consecutiveFailures = 0;
      breaker.trippedAt = null;
      await breaker.save();
    }
  }

  const senderEmail = mailOptions.from || (transporter.options.auth ? transporter.options.auth.user : 'Unknown');

  // 2. Attempt to send email
  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Success! Reset failures
    if (breaker.consecutiveFailures > 0) {
      breaker.consecutiveFailures = 0;
      await breaker.save();
    }

    // Log success
    await emailLogger.logEmail({
      senderEmail,
      recipientEmail: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
      campaign,
      status: 'SUCCESS',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      smtpResponse: info.response,
      attachments: mailOptions.attachments || [],
      source: source

    });

    return info;

  } catch (error) {
    // Failure! Increment consecutive failures
    breaker.consecutiveFailures += 1;
    if (breaker.consecutiveFailures >= FAILURE_THRESHOLD) {
      breaker.isTripped = true;
      breaker.trippedAt = new Date();
    }
    await breaker.save();

    // Log failure
    await emailLogger.logEmail({
      senderEmail,
      recipientEmail: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
      campaign,
      status: 'FAILED',
      smtpResponse: error.message,
      attachments: mailOptions.attachments || [],
      source: source
    });

    throw error;
  }
}

module.exports = sendSafeEmail;
