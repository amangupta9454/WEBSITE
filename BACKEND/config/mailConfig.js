/**
 * SMTP Configuration Module for Code-A-Nova
 * Uses secure Hostinger SMTP settings loaded from environment variables.
 */

require('dotenv').config();

const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 465;
const smtpUser = process.env.SMTP_USER || 'manager@code-a-nova.online';
const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'manager@code-a-nova.online';
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
  // Timeouts optimized for reliable execution across serverless architectures and standard VMs
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
};

module.exports = {
  mailConfig,
  defaultSender: formattedSender,
};
