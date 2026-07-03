// utils/piiRedactor.js

const redactPII = (text) => {
  if (!text || typeof text !== 'string') return text;

  let masked = text;

  // Mask Email (e***@***.com)
  masked = masked.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, p1, p2) => {
    const maskedLocal = p1[0] + '***';
    return `${maskedLocal}@***.${p2.split('.').pop()}`;
  });

  // Mask Phone (e.g. +91 9876543210 -> +91 ******3210)
  masked = masked.replace(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[REDACTED_PHONE]');

  // Mask Aadhaar (12 digits)
  masked = masked.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_AADHAAR]');

  // Mask PAN (e.g. ABCDE1234F)
  masked = masked.replace(/\b[A-Z]{5}\d{4}[A-Z]{1}\b/g, '[REDACTED_PAN]');

  // Mask Credit Cards (16 digits)
  masked = masked.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CC]');

  // Mask Bearer Tokens / JWTs (ey...)
  masked = masked.replace(/Bearer\s+([a-zA-Z0-9-._~+/]+=*)/gi, 'Bearer [REDACTED_TOKEN]');
  masked = masked.replace(/eyJ[a-zA-Z0-9_=]+(?:\.[a-zA-Z0-9_=]+){2}/g, '[REDACTED_JWT]');

  // Mask common API keys format (sk-...)
  masked = masked.replace(/\bsk-[a-zA-Z0-9]{20,}\b/g, '[REDACTED_API_KEY]');

  return masked;
};

module.exports = { redactPII };
