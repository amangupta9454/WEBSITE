const validateEnv = () => {
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET'
  ];

  const missing = [];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️ WARNING: GROQ_API_KEY is missing. AI Panel Interview features will not work.');
  }

  const mailVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_API_KEY'];
  const missingMailVars = mailVars.filter(v => !process.env[v]);
  if (missingMailVars.length > 0) {
    console.warn(`⚠️ WARNING: Missing Email Service environment variables (${missingMailVars.join(', ')}). Automated emails will fail to send.`);
  }

  if (missingMailVars.includes('SMTP_PASS') || missingMailVars.includes('MAIL_API_KEY')) {
    console.warn('💡 TIP: Ensure SMTP_PASS and MAIL_API_KEY are configured in .env or Vercel Environment variables.');
  }

  if (missing.length > 0) {
    console.error('❌ CRITICAL STARTUP ERROR: Missing Required Environment Variables ❌');
    console.table(missing.map(env => ({ Variable: env, Status: 'MISSING' })));
    console.error('Please configure these variables in Vercel or .env.');
  }
};

module.exports = { validateEnv };
