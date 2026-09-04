/**
 * Configuration & Environment Validation Service
 * Identifies missing critical or feature-specific environment variables without ever printing secret values.
 */

function validateHackathonConfig() {
  const warnings = [];
  const criticals = [];
  const checks = {};

  // 1. Database
  const hasMongo = Boolean(process.env.MONGO_URI || process.env.DATABASE_URL);
  checks.database = hasMongo ? 'CONFIGURED' : 'MISSING';
  if (!hasMongo) {
    criticals.push('DATABASE_URL / MONGO_URI is missing. Database persistence will fail.');
  }

  // 2. JWT Authentication
  const hasJwt = Boolean(process.env.JWT_SECRET);
  checks.jwt = hasJwt ? 'CONFIGURED' : 'MISSING';
  if (!hasJwt) {
    criticals.push('JWT_SECRET is missing. Session signing and authentication tokens will fail.');
  }

  // 3. Razorpay Payments
  const hasRazorpayKey = Boolean(process.env.RAZORPAY_KEY_ID);
  const hasRazorpaySecret = Boolean(process.env.RAZORPAY_KEY_SECRET);
  const hasRazorpayWebhook = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
  if (hasRazorpayKey && hasRazorpaySecret && hasRazorpayWebhook) {
    checks.razorpay = 'CONFIGURED';
  } else if (hasRazorpayKey || hasRazorpaySecret || hasRazorpayWebhook) {
    checks.razorpay = 'PARTIALLY_CONFIGURED';
    warnings.push('Razorpay is partially configured. Ensure KEY_ID, KEY_SECRET, and WEBHOOK_SECRET are all defined.');
  } else {
    checks.razorpay = 'MISSING';
    warnings.push('Razorpay credentials missing. Team ₹49 confirmation payments and webhooks will fail.');
  }

  // 4. Email Transmission (SMTP & Resend)
  const hasSmtp = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)
  );
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  if (hasSmtp && hasResend) {
    checks.email = 'HIGH_AVAILABILITY (SMTP + Resend Fallback)';
  } else if (hasSmtp) {
    checks.email = 'SMTP_ONLY';
  } else if (hasResend) {
    checks.email = 'RESEND_ONLY';
  } else {
    checks.email = 'MISSING';
    warnings.push('No email provider configured. Shortlist emails, certificates, and prize fulfillment emails will fail.');
  }

  // 5. WhatsApp Service
  const hasWhatsapp = Boolean(process.env.WHATSAPP_SERVICE_URL && process.env.WHATSAPP_API_KEY);
  checks.whatsapp = hasWhatsapp ? 'CONFIGURED' : 'UNCONFIGURED';
  if (!hasWhatsapp) {
    warnings.push('WhatsApp automation service credentials not configured. Manual invite links will be utilized.');
  }

  // 6. Frontend / Public Portal URL
  const hasFrontend = Boolean(process.env.FRONTEND_URL || process.env.PUBLIC_HACKATHON_URL);
  checks.frontendUrl = hasFrontend ? 'CONFIGURED' : 'USING_FALLBACK (http://localhost:5173)';
  if (!hasFrontend) {
    warnings.push('FRONTEND_URL / PUBLIC_HACKATHON_URL not configured. Defaulting to localhost for email links.');
  }

  const status = criticals.length > 0 ? 'CRITICAL' : warnings.length > 0 ? 'WARNING' : 'OPTIMAL';

  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
    diagnostics: checks,
    criticalCount: criticals.length,
    warningCount: warnings.length,
    criticals,
    warnings,
  };
}

function logStartupValidation() {
  const result = validateHackathonConfig();
  console.log('====================================================');
  console.log(`[Code-A-Nova Hackathon Ops] Config Status: ${result.status}`);
  Object.entries(result.checks).forEach(([subsystem, st]) => {
    console.log(`  - Subsystem [${subsystem}]: ${st}`);
  });
  if (result.warnings.length > 0) {
    result.warnings.forEach((w) => console.warn(`  ⚠ Warning: ${w}`));
  }
  if (result.criticals.length > 0) {
    result.criticals.forEach((c) => console.error(`  ❌ Critical: ${c}`));
  }
  console.log('====================================================');
  return result;
}

module.exports = {
  validateHackathonConfig,
  validateStartupConfig: validateHackathonConfig,
  logStartupValidation,
};
