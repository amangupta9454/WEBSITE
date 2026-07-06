const axios = require('axios');

// Fetch these from environment variables
const getServiceUrl = () => process.env.WHATSAPP_SERVICE_URL || 'https://whatsapp-codeanova.onrender.com';
const getApiKey = () => process.env.WHATSAPP_API_KEY || 'codeanova-secret-key-123';

/**
 * Initializes the WhatsApp client.
 * (Now delegates to the external microservice)
 */
const initializeWhatsApp = () => {
  console.log('WhatsApp client initialization delegated to external WHATSAPP_SERVICE microservice.');
  // Optionally ping the service to wake it up
  axios.get(getServiceUrl()).catch(() => {});
};

/**
 * Adds a new message to the queue to be sent by the microservice.
 */
const queueWhatsAppMessage = async (phoneNumber, message) => {
  try {
    console.log(`Delegating WhatsApp message for ${phoneNumber} to Microservice...`);
    await axios.post(`${getServiceUrl()}/send-message`, {
      phoneNumber,
      message
    }, {
      headers: {
        'x-api-key': getApiKey()
      }
    });
    console.log(`Successfully delegated message for ${phoneNumber}`);
  } catch (error) {
    console.error(`Failed to delegate WhatsApp message to ${phoneNumber}:`, error?.response?.data || error.message);
    throw new Error('WhatsApp Service Error: ' + (error?.response?.data?.error || 'Bot is disconnected or offline'));
  }
};

/**
 * Adds a new media message to the queue to be sent by the microservice.
 */
const queueWhatsAppMedia = async (phoneNumber, caption, mimetype, data, filename) => {
  try {
    console.log(`Delegating WhatsApp media for ${phoneNumber} to Microservice...`);
    
    // Ensure data is base64 string if it is a Buffer
    let base64Data = data;
    if (Buffer.isBuffer(data)) {
      base64Data = data.toString('base64');
    }

    await axios.post(`${getServiceUrl()}/send-media`, {
      phoneNumber,
      caption,
      mimetype,
      data: base64Data,
      filename
    }, {
      headers: {
        'x-api-key': getApiKey(),
        'Content-Type': 'application/json'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    console.log(`Successfully delegated media message for ${phoneNumber}`);
  } catch (error) {
    console.error(`Failed to delegate WhatsApp media to ${phoneNumber}:`, error?.response?.data || error.message);
    throw new Error('WhatsApp Service Error: ' + (error?.response?.data?.error || 'Bot is disconnected or offline'));
  }
};

/**
 * Adds a new true PDF generation message to the queue.
 */
const queueWhatsAppPdf = async (phoneNumber, caption, htmlContent, filename) => {
  try {
    console.log(`Delegating WhatsApp True PDF for ${phoneNumber} to Microservice...`);
    
    await axios.post(`${getServiceUrl()}/send-pdf-html`, {
      phoneNumber,
      caption,
      htmlContent,
      filename
    }, {
      headers: {
        'x-api-key': getApiKey(),
        'Content-Type': 'application/json'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    console.log(`Successfully delegated true PDF for ${phoneNumber}`);
  } catch (error) {
    console.error(`Failed to delegate WhatsApp true PDF to ${phoneNumber}:`, error?.response?.data || error.message);
    throw new Error('WhatsApp Service Error: ' + (error?.response?.data?.error || 'Bot is disconnected or offline'));
  }
};

module.exports = {
  initializeWhatsApp,
  queueWhatsAppMessage,
  queueWhatsAppMedia,
  queueWhatsAppPdf
};

