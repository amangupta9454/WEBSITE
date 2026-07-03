# Operations Runbook

## 1. MongoDB Connection Starvation (HTTP 504 Timeouts)
**Symptom**: Vercel logs show `MongoTimeoutError` and the `/healthz` endpoint returns `mongodb: disconnected`.
**Cause**: Too many serverless functions spawned simultaneously, exceeding MongoDB Atlas connection limits.
**Resolution**: 
1. Open Vercel Dashboard.
2. Check `index.js` `maxPoolSize` (Current: 10). Do not increase it.
3. If attack/burst traffic is suspected, temporarily lower `maxPoolSize` to `2` to throttle DB writes.

## 2. Server Fails to Start (HTTP 500 on all endpoints)
**Symptom**: Sentry reports nothing, Vercel logs show `CRITICAL STARTUP ERROR`.
**Cause**: Environment variables were deleted or renamed in Vercel.
**Resolution**:
1. Check Vercel logs for the generated missing variables table.
2. Re-add the missing keys to Vercel Settings and trigger a redeploy.

## 3. "Generating Feedback" Stuck Indefinitely
**Symptom**: Users stuck on the saving screen.
**Cause**: Groq API rate limits exceeded (HTTP 429).
**Resolution**:
1. The backend automatically retries 3 times with exponential backoff.
2. Ensure `GROQ_API_KEY_2`, `GROQ_API_KEY_3` are populated to enable key rotation during rate limits.

## 4. High Hallucination Rate in Sentry
**Symptom**: CI Pipeline fails with `AI QA Regression` or Sentry shows high error rates on JSON parsing.
**Cause**: Unintentional prompt drift or Groq model degradation.
**Resolution**:
1. Roll back `ai-qa/prompt-registry.json` to the previous stable `activeVersion`.
2. Push to `main`.
