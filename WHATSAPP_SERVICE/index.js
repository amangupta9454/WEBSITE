require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
// Increase limit for media files (PDFs etc)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

let client;
let isClientReady = false;
const messageQueue = [];
let isProcessingQueue = false;

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validKey = process.env.WHATSAPP_API_KEY || 'codeanova-secret-key-123';
  if (apiKey === validKey) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
};

const getRandomDelay = () => {
  const min = 15000;
  const max = 25000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const processQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (messageQueue.length > 0) {
    if (!isClientReady) {
      console.log('WhatsApp Client is not ready yet. Pausing queue...');
      break;
    }

    const { phoneNumber, message, isMedia, mediaOptions } = messageQueue.shift();

    try {
      let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
      }
      const formattedNumber = phoneNumber.includes('@c.us') 
        ? phoneNumber 
        : `${cleanNumber}@c.us`;

      if (isMedia) {
        console.log(`Sending WhatsApp Media to ${formattedNumber}...`);
        const media = new MessageMedia(mediaOptions.mimetype, mediaOptions.data, mediaOptions.filename);
        await client.sendMessage(formattedNumber, media, { caption: message });
      } else {
        console.log(`Sending WhatsApp message to ${formattedNumber}...`);
        await client.sendMessage(formattedNumber, message);
      }
      console.log(`Successfully sent to ${formattedNumber}.`);

      if (messageQueue.length > 0) {
        const delayMs = getRandomDelay();
        console.log(`Waiting for ${Math.round(delayMs / 1000)} seconds before sending next message...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to send WhatsApp message to ${phoneNumber}:`, error);
    }
  }

  isProcessingQueue = false;
};

// Initialize WhatsApp
console.log('Initializing WhatsApp Client...');
client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './whatsapp-session'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
  }
});

client.on('qr', (qr) => {
  console.log('=========================================');
  console.log('SCAN THIS QR CODE WITH YOUR WHATSAPP APP');
  console.log('=========================================');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp Client is Ready!');
  isClientReady = true;
  if (messageQueue.length > 0) {
    processQueue();
  }
});

client.on('authenticated', () => {
  console.log('WhatsApp Authenticated Successfully!');
});

client.on('auth_failure', msg => {
  console.error('WhatsApp Authentication failure:', msg);
  isClientReady = false;
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp Client was disconnected', reason);
  isClientReady = false;
});

client.initialize();

// API Endpoints
app.get('/', (req, res) => {
  res.json({ status: 'running', isClientReady, queueLength: messageQueue.length });
});

app.post('/send-message', checkApiKey, (req, res) => {
  const { phoneNumber, message } = req.body;
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Missing phoneNumber or message' });
  }

  messageQueue.push({ phoneNumber, message, isMedia: false });
  console.log(`Message queued for ${phoneNumber}. Total in queue: ${messageQueue.length}`);
  
  if (!isProcessingQueue && isClientReady) {
    processQueue();
  }

  res.json({ success: true, message: 'Message queued successfully' });
});

app.post('/send-media', checkApiKey, (req, res) => {
  const { phoneNumber, caption, mimetype, data, filename } = req.body;
  if (!phoneNumber || !data || !mimetype) {
    return res.status(400).json({ error: 'Missing required media fields (phoneNumber, data, mimetype)' });
  }

  messageQueue.push({ 
    phoneNumber, 
    message: caption || '', 
    isMedia: true, 
    mediaOptions: { mimetype, data, filename } 
  });
  console.log(`Media queued for ${phoneNumber}. Total in queue: ${messageQueue.length}`);
  
  if (!isProcessingQueue && isClientReady) {
    processQueue();
  }

  res.json({ success: true, message: 'Media message queued successfully' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`WhatsApp Microservice running on port ${PORT}`);
});
