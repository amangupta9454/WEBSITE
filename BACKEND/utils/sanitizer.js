// utils/sanitizer.js
const sanitizeText = (text, maxLength = 100000) => {
  if (!text || typeof text !== 'string') return '';
  
  // Normalize Unicode
  let sanitized = text.normalize('NFC');
  
  // Remove control characters (except newline, tab)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Strip HTML tags
  sanitized = sanitized.replace(/<[^>]*>?/gm, '');
  
  // Limit maximum length to prevent DoS via massive payloads
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
};

module.exports = { sanitizeText };
