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

  if (missing.length > 0) {
    console.error('❌ CRITICAL STARTUP ERROR: Missing Required Environment Variables ❌');
    console.table(missing.map(env => ({ Variable: env, Status: 'MISSING' })));
    console.error('The server will now exit. Please configure these variables in Vercel or .env.');
    process.exit(1);
  }
};

module.exports = { validateEnv };
