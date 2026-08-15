require('dotenv').config();
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../ai-qa/prompt-registry.json');
const DATASETS_DIR = path.join(__dirname, '../ai-qa/datasets');
const REPORTS_DIR = path.join(__dirname, '../ai-qa/reports');

async function runGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing");

  const start = Date.now();
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  const latency = Date.now() - start;

  if (!groqRes.ok) {
    throw new Error(`Groq API Error: ${groqRes.status} ${await groqRes.text()}`);
  }

  const data = await groqRes.json();
  const responseText = data.choices[0].message.content || "";
  const jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return { parsed: JSON.parse(jsonStr), latency };
}

async function runQA() {
  console.log("🚀 Starting AI Quality Assurance Regression Runner...");

  const registryData = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const activePrompt = registryData.prompts.find(p => p.version === registryData.activeVersion);
  
  if (!activePrompt) {
    console.error("❌ Critical Error: No active prompt found in registry.");
    process.exit(1);
  }

  console.log(`📋 Using Prompt Version: ${activePrompt.version}`);

  const datasetFiles = fs.readdirSync(DATASETS_DIR).filter(f => f.endsWith('.json'));
  const results = [];
  let totalLatency = 0;
  let validJsonCount = 0;
  let scoreDriftSum = 0;
  let hallucinationCount = 0;
  let passCount = 0;

  for (const file of datasetFiles) {
    console.log(`\n⏳ Running Dataset: ${file}...`);
    const dataset = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, file), 'utf8'));
    
    // Inject dataset into prompt template
    const prompt = activePrompt.content
      .replace('{{EVIDENCE_GRAPH}}', '[]')
      .replace('{{VERIFIED_SKILLS}}', 'None')
      .replace('{{JOB_TITLE}}', dataset.jobDescription)
      .replace('{{EXPERIENCE_YEARS}}', 'Unknown')
      .replace('{{RESUME_TEXT}}', dataset.resume)
      .replace('{{TRANSCRIPT_TEXT}}', dataset.transcript);

    try {
      const { parsed, latency } = await runGroq(prompt);
      totalLatency += latency;
      validJsonCount++;

      const overallScore = parsed.confidence_scores?.overall?.score || 0;
      const recommendation = parsed.final_recommendation || "Unknown";
      
      const [minExpected, maxExpected] = dataset.expected_score_range;
      
      let pass = true;
      let failureReason = [];

      // Check Score Drift
      if (overallScore < minExpected || overallScore > maxExpected) {
        pass = false;
        failureReason.push(`Score Drift: Got ${overallScore}, Expected ${minExpected}-${maxExpected}`);
      }

      // Track drift magnitude
      const midPoint = (minExpected + maxExpected) / 2;
      scoreDriftSum += Math.abs(overallScore - midPoint);

      // Check Recommendation
      if (!recommendation.includes(dataset.expected_recommendation) && 
          !(recommendation === "Strong Hire" && dataset.expected_recommendation === "Hire") &&
          !(recommendation === "Strong No Hire" && dataset.expected_recommendation === "No Hire")) {
        pass = false;
        failureReason.push(`Recommendation Mismatch: Got ${recommendation}, Expected ${dataset.expected_recommendation}`);
      }

      // Check Hallucination (Missing evidence)
      const evidence = parsed.confidence_scores?.overall?.evidence || "";
      if (evidence === "" || evidence === "...") {
        hallucinationCount++;
        pass = false;
        failureReason.push("Hallucination/Missing Evidence Citation");
      }

      if (pass) {
        passCount++;
        console.log(`✅ PASS: ${file} (Score: ${overallScore}, Rec: ${recommendation}, Latency: ${latency}ms)`);
      } else {
        console.log(`❌ FAIL: ${file} (Score: ${overallScore}, Rec: ${recommendation}, Latency: ${latency}ms)`);
        console.log(`   Reasons: ${failureReason.join(', ')}`);
      }

      results.push({
        dataset: file,
        status: pass ? "PASS" : "FAIL",
        score: overallScore,
        recommendation,
        latency,
        failureReason
      });

    } catch (err) {
      console.error(`❌ ERROR on ${file}: ${err.message}`);
      results.push({
        dataset: file,
        status: "ERROR",
        error: err.message
      });
    }
  }

  const total = datasetFiles.length;
  const report = {
    timestamp: new Date().toISOString(),
    prompt_version: activePrompt.version,
    total_datasets: total,
    passed: passCount,
    failed: total - passCount,
    average_score_drift: total > 0 ? (scoreDriftSum / total).toFixed(2) : 0,
    average_latency_ms: total > 0 ? Math.round(totalLatency / total) : 0,
    json_validation_rate: `${Math.round((validJsonCount / total) * 100)}%`,
    hallucination_rate: `${Math.round((hallucinationCount / total) * 100)}%`,
    details: results
  };

  const reportPath = path.join(REPORTS_DIR, 'latest-benchmark.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📊 AI QA Regression Complete!`);
  console.log(`   Pass Rate: ${passCount}/${total}`);
  console.log(`   JSON Validation Rate: ${report.json_validation_rate}`);
  console.log(`   Avg Latency: ${report.average_latency_ms}ms`);
  console.log(`   Report saved to: ai-qa/reports/latest-benchmark.json`);

  if (passCount !== total) {
    process.exit(1); // Fail CI pipeline if regressions exist
  }
}

runQA();
