# Vercel Deployment Guide

## Prerequisites
1. A Vercel Account linked to your GitHub repository.
2. A MongoDB Atlas cluster (M0 or higher).
3. API Keys for Groq and Vapi.

## Environment Variables
The following variables MUST be configured in your Vercel Project Settings (`Settings > Environment Variables`).
The deployment will **FAIL FAST** (crash on boot) if `MONGO_URI`, `JWT_SECRET`, or `GROQ_API_KEY` are missing.

### Backend Required:
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret for signing auth tokens.
- `GROQ_API_KEY`: Primary LLM evaluation key.

### Backend Optional (Highly Recommended):
- `SENTRY_DSN`: Endpoint for backend error tracking.
- `GROQ_API_KEY_2` to `GROQ_API_KEY_4`: Fallback LLM keys.

### Frontend Required:
- `VITE_BACKEND_URL`: URL of your deployed Vercel API.
- `VITE_VAPI_PUBLIC_KEY`: Public key for Voice AI streaming.

## CI/CD Pipeline
Every push to `main` and Pull Request triggers the GitHub Actions pipeline:
1. `npm install`
2. `npm run lint`
3. `npm audit --audit-level=high`
4. `npm run build`
5. AI QA Regression Suite (`run-qa.js`)

**Vercel will NOT deploy if any of these CI steps fail.**
