const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isClientReady = false;

// The Queue that holds all pending messages
const messageQueue = [];
let isProcessingQueue = false;

/**
 * Returns a random delay between 45 seconds and 75 seconds (1 min 15 sec)
 */
const getRandomDelay = () => {
  const min = 15000; // 15 seconds
  const max = 25000; // 25 seconds
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Processes the queue one by one with a random delay between each message.
 */
const processQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (messageQueue.length > 0) {
    if (!isClientReady) {
      console.log('WhatsApp Client is not ready yet. Pausing queue...');
      break;
    }

    // Get the next message from the queue
    const { phoneNumber, message, isMedia, mediaOptions } = messageQueue.shift();

    try {
      // Format number correctly (add @c.us if not present)
      let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
      }
      const formattedNumber = phoneNumber.includes('@c.us') 
        ? phoneNumber 
        : `${cleanNumber}@c.us`;

      // Send the message
      if (isMedia) {
        console.log(`Sending WhatsApp Media to ${formattedNumber}...`);
        const media = new MessageMedia(mediaOptions.mimetype, mediaOptions.data, mediaOptions.filename);
        await client.sendMessage(formattedNumber, media, { caption: message });
      } else {
        console.log(`Sending WhatsApp message to ${formattedNumber}...`);
        await client.sendMessage(formattedNumber, message);
      }
      console.log(`Successfully sent to ${formattedNumber}.`);

      // If there are more messages, wait for a random time before sending the next one
      if (messageQueue.length > 0) {
        const delayMs = getRandomDelay();
        console.log(`Waiting for ${Math.round(delayMs / 1000)} seconds before sending the next message to avoid ban...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to send WhatsApp message to ${phoneNumber}:`, error);
    }
  }

  isProcessingQueue = false;
};

/**
 * Adds a new message to the queue to be sent.
 */
const queueWhatsAppMessage = (phoneNumber, message) => {
  messageQueue.push({ phoneNumber, message, isMedia: false });
  console.log(`Message queued for ${phoneNumber}. Total in queue: ${messageQueue.length}`);
  
  // Start processing if not already doing so
  if (!isProcessingQueue && isClientReady) {
    processQueue();
  }
};

/**
 * Adds a new media message to the queue to be sent.
 */
const queueWhatsAppMedia = (phoneNumber, caption, mimetype, data, filename) => {
  messageQueue.push({ 
    phoneNumber, 
    message: caption, 
    isMedia: true, 
    mediaOptions: { mimetype, data, filename } 
  });
  console.log(`Media Message queued for ${phoneNumber}. Total in queue: ${messageQueue.length}`);
  
  // Start processing if not already doing so
  if (!isProcessingQueue && isClientReady) {
    processQueue();
  }
};

/**
 * Initializes the WhatsApp client.
 */
const initializeWhatsApp = () => {
  console.log('Initializing WhatsApp Client...');
  
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './whatsapp-session' // Saves session so you don't scan QR every time
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
    
    // Start processing queue if there were messages waiting
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
};

module.exports = {
  initializeWhatsApp,
  queueWhatsAppMessage,
  queueWhatsAppMedia
};
