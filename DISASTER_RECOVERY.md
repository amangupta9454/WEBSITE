# Disaster Recovery Plan

## Recovery Time Objective (RTO)
**Target**: 15 minutes.
Since the application is 100% serverless, infrastructure recreation is virtually instantaneous via Vercel GitHub integration.

## Recovery Point Objective (RPO)
**Target**: Max 24 hours of data loss in catastrophic DB failure.

## Scenario 1: Bad Deployment (Syntax Error / Logic Bug)
**Action**: Instant Vercel Rollback.
1. Open Vercel Dashboard > Deployments.
2. Select the previous stable deployment.
3. Click "Promote to Production".
*Impact: Zero downtime rollback.*

## Scenario 2: Data Corruption (Accidental Deletion / Mass Overwrite)
**Action**: MongoDB Point-In-Time Restore.
1. Log into MongoDB Atlas.
2. Navigate to Database > Backups.
3. Select "Restore".
4. Choose a timestamp exactly 5 minutes before the corruption occurred.
5. Restore to a NEW cluster.
6. Once restored, update `MONGO_URI` in Vercel to point to the new cluster.
*Impact: ~10 minutes downtime during restore.*

## Scenario 3: Complete Vercel Outage
**Action**: Migrate to AWS Lambda / Heroku / Render.
Because the application is built on standard `express.js` (no Next.js or Vercel proprietary server functions), it is completely portable.
1. Deploy the exact same `BACKEND/index.js` to a fresh Heroku Dyno or Render Web Service.
2. Update the frontend `VITE_BACKEND_URL` to point to the new service.
3. Deploy the frontend to Netlify, AWS S3, or Cloudflare Pages.
