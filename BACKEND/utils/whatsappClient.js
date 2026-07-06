const axios = require('axios');

// Fetch these from environment variables
const getServiceUrl = () => process.env.WHATSAPP_SERVICE_URL || 'https://whatsapp-codeanova.onrender.com';
const getApiKey = () => process.env.WHATSAPP_API_KEY || 'codeanova-secret-key-123';

const initializeWhatsApp = () => {
  console.log('WhatsApp client disabled temporarily.');
};

const queueWhatsAppMessage = async (phoneNumber, message) => {
  console.log(`[DISABLED] Would have sent WhatsApp message to ${phoneNumber}`);
};

const queueWhatsAppMedia = async (phoneNumber, caption, mimetype, data, filename) => {
  console.log(`[DISABLED] Would have sent WhatsApp media to ${phoneNumber}`);
};

const queueWhatsAppPdf = async (phoneNumber, caption, htmlContent, filename) => {
  console.log(`[DISABLED] Would have sent WhatsApp PDF to ${phoneNumber}`);
};

module.exports = {
  initializeWhatsApp,
  queueWhatsAppMessage,
  queueWhatsAppMedia,
  queueWhatsAppPdf
};

