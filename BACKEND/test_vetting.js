require("dotenv").config();
const mongoose = require("mongoose");
const aiRuntimeEngine = require("./services/assessment/AIRuntimeEngine");
const questionIntelligenceEngine = require("./services/assessment/QuestionIntelligenceEngine");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  // Mock category ID
  const categoryId = "6639c0e2a3b0a2d5c4e9f7b1"; // dummy or real

  const synthesisRes = await aiRuntimeEngine.execute({
    categoryId,
    dynamicVariables: { questionCount: 2 },
    options: { simulationOnly: true }
  });

  console.log("Synthesis Success:", synthesisRes.success);
  console.log("Synthesis Status:", synthesisRes.status);
  
  let synthesizedItems = Array.isArray(synthesisRes?.parsedData) 
        ? synthesisRes.parsedData 
        : (synthesisRes?.parsedData?.questions || []);
  
  console.log("Parsed Items:", JSON.stringify(synthesizedItems, null, 2));

  const normalized = synthesizedItems.map((q) => ({
    ...q,
    categoryId,
    createdSource: "AI Generated Bulk",
    status: "Draft",
  }));

  const vetted = await questionIntelligenceEngine.analyzeAndValidate(normalized, { fallbackModality: "MCQ", requireExplanation: false });
  console.log("Vetted Reports:", JSON.stringify(vetted.intelligenceReports, null, 2));
  console.log("Approved Count:", vetted.approvedQuestions?.length);

  process.exit(0);
}

run().catch(console.error);
