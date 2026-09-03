/**
 * SMTP Configuration Module for Code-A-Nova
 * Uses secure Hostinger SMTP settings with Primary Mailbox Auth & Alias Sender support.
 */

require('dotenv').config();

const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 465;
// Primary Hostinger mailbox login credentials
const smtpUser = process.env.SMTP_USER || 'hr@code-a-nova.online';
// Outgoing alias used as From / Reply-To
const senderEmail = process.env.SMTP_FROM || 'manager@code-a-nova.online';
const formattedSender = `"Code-A-Nova" <${senderEmail}>`;
const smtpPass = process.env.SMTP_PASS || '';

const mailConfig = {
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465 (SSL/TLS), false for other ports like 587
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
};

module.exports = {
  mailConfig,
  defaultSender: formattedSender,
  senderEmail,
};
