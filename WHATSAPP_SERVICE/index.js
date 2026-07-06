require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const checkApiKey = (req, res, next) => {
  console.log(`[API] Received request for ${req.path}`);
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.WHATSAPP_API_KEY || 'codeanova-secret-key-123';
  if (apiKey !== validApiKey) {
    console.log(`[API] Unauthorized request. Provided key: ${apiKey}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
};

let sock;
let isClientReady = false;

const messageQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue || messageQueue.length === 0 || !isClientReady || !sock) return;
  isProcessingQueue = true;

  while (messageQueue.length > 0) {
    if (!isClientReady) break;

    const { phoneNumber, message, resolve, reject } = messageQueue[0];
    try {
      const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
      const finalNumber = (formattedNumber.length === 10 ? '91' + formattedNumber : formattedNumber) + '@s.whatsapp.net';
      
      console.log(`Sending WhatsApp message to ${finalNumber}...`);
      await sock.sendMessage(finalNumber, { text: message });
      console.log(`Successfully sent message to ${finalNumber}`);
      
      resolve({ success: true, message: 'Sent via Baileys queue' });
      messageQueue.shift();
      
      await new Promise(res => setTimeout(res, 2000));
    } catch (error) {
      console.error(`Failed to send WhatsApp message to ${phoneNumber}:`, error);
      reject(error);
      messageQueue.shift();
    }
  }

  isProcessingQueue = false;
};

const qrcode = require('qrcode-terminal');

const connectToWhatsApp = async () => {
  console.log('Initializing WhatsApp Baileys Client...');
  const { state, saveCreds } = await useMultiFileAuthState('whatsapp-session');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // We will print it manually
    logger: pino({ level: 'silent' }),
    browser: ["CodeaNova", "Chrome", "1.0.0"],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('=========================================');
      console.log('SCAN THE QR CODE ABOVE TO LOGIN');
      console.log('=========================================');
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      isClientReady = false;
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp Baileys Client is Ready & Authenticated!');
      isClientReady = true;
      if (messageQueue.length > 0) {
        processQueue();
      }
    }
  });
};

connectToWhatsApp().catch(err => {
  console.error('CRITICAL ERROR: Failed to initialize Baileys client:', err);
});

app.get('/', (req, res) => {
  res.json({ status: 'running (baileys)', isClientReady, queueLength: messageQueue.length });
});

app.post('/send-message', checkApiKey, (req, res) => {
  const { phoneNumber, message } = req.body;
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'phoneNumber and message are required' });
  }

  // Dummy resolve/reject to satisfy the queue processor without hanging the response
  const resolve = (val) => console.log('Queue processed:', val);
  const reject = (err) => console.error('Queue error:', err);

  messageQueue.push({ phoneNumber, message, resolve, reject });
  
  if (isClientReady && !isProcessingQueue) {
    processQueue();
  }

  // Return immediately so Vercel does not time out
  res.json({ success: true, message: 'Message queued successfully' });
});

app.listen(PORT, () => {
  console.log(`WhatsApp Microservice running on port ${PORT}`);
});
