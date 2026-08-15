/**
 * AI Runtime Architecture Controller (Phase 4.1 Refinements 1 - 12)
 * Manages decoupled libraries (Variables, Output Schemas, Prompt Sections),
 * Blueprint Assignment routing layers, Provider Runtime Configurations, and Runtime Resolution previews.
 * ZERO external Groq calls or fake question generation.
 */

const AssessmentVariableLibrary = require("../../models/assessment/AssessmentVariableLibrary");
const AssessmentSchemaLibrary = require("../../models/assessment/AssessmentSchemaLibrary");
const AssessmentPromptSection = require("../../models/assessment/AssessmentPromptSection");
const AssessmentBlueprintAssignment = require("../../models/assessment/AssessmentBlueprintAssignment");
const AssessmentRuntimeConfig = require("../../models/assessment/AssessmentRuntimeConfig");
const AssessmentAIBlueprint = require("../../models/assessment/AssessmentAIBlueprint");
const runtimeResolver = require("../../services/assessment/RuntimeResolver");
const aiRuntimeEngine = require("../../services/assessment/AIRuntimeEngine");
const providerManager = require("../../services/assessment/ProviderManager");
const runtimeLogger = require("../../services/assessment/RuntimeLogger");

// Internal helper to seed default reusable libraries on first run
let librariesSeeded = false;
async function ensureDefaultLibrariesSeeded() {
  if (librariesSeeded) return;

  try {
    // 1. Seed Reusable Variable Library (Refinement 4)
    const varCount = await AssessmentVariableLibrary.countDocuments();
    if (varCount === 0) {
      const defaultVars = [
        { name: "category", displayName: "Master Subject Category", defaultValue: "Technical Assessment", description: "Parent evaluation classification", category: "Domain", isSystemDefault: true },
        { name: "subcategory", displayName: "Specialized Subcategory", defaultValue: "Core Architecture", description: "Specific technical competency area", category: "Domain", isSystemDefault: true },
        { name: "difficulty", displayName: "Target Difficulty Tier", defaultValue: "Medium", description: "Configured cognitive load (Easy/Medium/Hard/Expert)", category: "Rules", isSystemDefault: true, allowedValues: ["Easy", "Medium", "Hard", "Expert"] },
        { name: "topics", displayName: "Focal Topic Array", defaultValue: "Syntax, Architecture, Memory Optimization", description: "Mandatory focus concepts", category: "Content", isSystemDefault: true },
        { name: "language", displayName: "Human Presentation Language", defaultValue: "English", description: "Linguistic formatting standard", category: "Formatting", isSystemDefault: true },
        { name: "questionCount", displayName: "Batch Question Count", defaultValue: "5", description: "Number of evaluations in rolling generation batch", category: "Rules", isSystemDefault: true },
        { name: "assessmentType", displayName: "Evaluation Modality Selector", defaultValue: "MCQ", description: "Format modifier (MCQ, Coding, Mixed, AI Viva, Subjective)", category: "Modality", isSystemDefault: true, allowedValues: ["MCQ", "Coding", "Mixed", "AI Viva", "Subjective"] },
        { name: "experienceLevel", displayName: "Target Candidate Seniority", defaultValue: "Intermediate / SDE-II", description: "Professional proficiency alignment", category: "Domain", isSystemDefault: true }
      ];
      await AssessmentVariableLibrary.insertMany(defaultVars);
    }

    // 2. Seed Reusable Output Schema Library (Refinement 5)
    const schemaCount = await AssessmentSchemaLibrary.countDocuments();
    if (schemaCount === 0) {
      const defaultSchemas = [
        {
          name: "Standard MCQ Schema",
          assessmentType: "MCQ",
          description: "Strict 4-option multiple choice question structure with verified indices and justifications.",
          expectedResponseFormat: "JSON Array of MCQ Objects",
          isSystemDefault: true,
          schemaDefinitions: [
            { field: "question", type: "string", required: true, description: "Clear technical stem" },
            { field: "options", type: "array of 4 strings", required: true, description: "Exact 4 distractor choices" },
            { field: "correctIndex", type: "number (0-3)", required: true, description: "0-based correct index" },
            { field: "explanation", type: "string", required: true, description: "Architectural justification" },
            { field: "topic", type: "string", required: true, description: "Specific subtopic assessed" },
            { field: "difficulty", type: "string", required: true, description: "Validated difficulty level" }
          ],
          jsonSchemaString: `[\n  {\n    "question": "Example technical evaluation stem?",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctIndex": 0,\n    "explanation": "Detailed architectural justification for Option A.",\n    "topic": "Core Architecture",\n    "difficulty": "Medium"\n  }\n]`
        },
        {
          name: "Standard Coding Problem Schema",
          assessmentType: "Coding",
          description: "Executable programming challenge schema with input/output test suites and memory limits.",
          expectedResponseFormat: "JSON Array of Coding Problem Objects",
          isSystemDefault: true,
          schemaDefinitions: [
            { field: "title", type: "string", required: true, description: "Problem header label" },
            { field: "problemStatement", type: "string", required: true, description: "Detailed algorithmic description" },
            { field: "inputFormat", type: "string", required: true, description: "Input parameter specification" },
            { field: "outputFormat", type: "string", required: true, description: "Expected return formatting" },
            { field: "sampleTestCases", type: "array of test case objects", required: true, description: "Input and output examples with explanations" },
            { field: "timeLimitMs", type: "number", required: true, description: "Execution duration threshold in ms" },
            { field: "memoryLimitKb", type: "number", required: true, description: "Memory footprint limitation" }
          ],
          jsonSchemaString: `[\n  {\n    "title": "LRU Cache Optimization",\n    "problemStatement": "Design and build an in-memory Least Recently Used cache implementation.",\n    "inputFormat": "Capacity integer followed by operations array.",\n    "outputFormat": "Array of evaluated return values.",\n    "sampleTestCases": [{"input": "2, [[1,1], [2,2]]", "output": "[null, null]", "explanation": "Cache initialized."}],\n    "timeLimitMs": 2000,\n    "memoryLimitKb": 65536\n  }\n]`
        },
        {
          name: "Mixed Evaluation Schema",
          assessmentType: "Mixed",
          description: "Hybrid assessment structure combining objective MCQ items with short technical coding snippets.",
          expectedResponseFormat: "JSON Array of Mixed Modality Items",
          isSystemDefault: true,
          schemaDefinitions: [
            { field: "type", type: "enum (mcq|coding)", required: true, description: "Item classification switch" },
            { field: "question", type: "string", required: true, description: "Core inquiry or task stem" },
            { field: "options", type: "array of 4 strings (optional)", required: false, description: "Included if type is mcq" },
            { field: "correctIndex", type: "number (optional)", required: false, description: "Included if type is mcq" },
            { field: "starterCode", type: "string (optional)", required: false, description: "Included if type is coding" }
          ],
          jsonSchemaString: `[\n  {\n    "type": "mcq",\n    "question": "Which HTTP status code signifies Resource Created?",\n    "options": ["200 OK", "201 Created", "204 No Content", "400 Bad Request"],\n    "correctIndex": 1,\n    "explanation": "201 explicitly designates resource creation."\n  }\n]`
        },
        {
          name: "AI Viva Voice Interview Schema",
          assessmentType: "AI Viva",
          description: "Conversational technical probe schema engineered for interactive speech and oral analysis.",
          expectedResponseFormat: "JSON Array of Oral Probe Objects",
          isSystemDefault: true,
          schemaDefinitions: [
            { field: "probeQuestion", type: "string", required: true, description: "Open-ended oral interview question" },
            { field: "expectedKeyThemes", type: "array of strings", required: true, description: "Core concepts required in candidate voice response" },
            { field: "followUpTriggers", type: "array of strings", required: true, description: "Follow-up question branches based on candidate depth" },
            { field: "evaluationCriteria", type: "string", required: true, description: "Rubric for voice answer evaluation" }
          ],
          jsonSchemaString: `[\n  {\n    "probeQuestion": "Explain how distributed ACID consensus works under network partitions.",\n    "expectedKeyThemes": ["CAP theorem", "Raft/Paxos", "Quorum consensus", "Split-brain resolution"],\n    "followUpTriggers": ["What happens if the primary node recovers after failover?"],\n    "evaluationCriteria": "Candidate must explicitly cite consistency vs availability tradeoffs."\n  }\n]`
        },
        {
          name: "Subjective Architectural Brief Schema",
          assessmentType: "Subjective",
          description: "Deep technical essay and system design case study evaluation formatting.",
          expectedResponseFormat: "JSON Array of Subjective Case Studies",
          isSystemDefault: true,
          schemaDefinitions: [
            { field: "caseStudyTitle", type: "string", required: true, description: "System scenario header" },
            { field: "scenarioDescription", type: "string", required: true, description: "Real-world engineering constraints and enterprise problem" },
            { field: "deliverableRequirements", type: "array of strings", required: true, description: "Required architectural artifacts or explanations" },
            { field: "gradingRubric", type: "object of weightings", required: true, description: "Point percentage allocations by category" }
          ],
          jsonSchemaString: `[\n  {\n    "caseStudyTitle": "Multi-Region Realtime Event Sourcing Pipeline",\n    "scenarioDescription": "Design an event bus handling 50,000 requests/sec across US-East and EU-West with near-zero data loss.",\n    "deliverableRequirements": ["Data deduplication mechanism", "Disaster recovery failover plan", "Storage replication strategy"],\n    "gradingRubric": {"scalability": 35, "fault_tolerance": 35, "cost_efficiency": 30}\n  }\n]`
        }
      ];
      await AssessmentSchemaLibrary.insertMany(defaultSchemas);
    }

    // 3. Seed Reusable Prompt Sections Library (Refinement 8)
    const sectionCount = await AssessmentPromptSection.countDocuments();
    if (sectionCount === 0) {
      const defaultSections = [
        {
          name: "Enterprise System Instruction",
          sectionType: "System Instruction",
          content: "You are a senior principal AI technical evaluator and examination architect at Code-A-Nova. Your mission is to synthesize rigorous, industry-aligned assessment items tailored precisely to candidate seniority and technical specifications.",
          defaultVariablesUsed: ["category", "subcategory", "experienceLevel"],
          isSystemDefault: true
        },
        {
          name: "Strict JSON Generation Rules",
          sectionType: "Generation Rules",
          content: "1. Generate exactly {{questionCount}} high-fidelity items matching difficulty tier: {{difficulty}}.\n2. Do NOT refer to prior questions or include introductory conversational fluff.\n3. Every distractor option MUST represent a plausible technical misconception or common developer anti-pattern.\n4. Avoid ambiguous wording, trick grammar, or generalized trivia.",
          defaultVariablesUsed: ["questionCount", "difficulty"],
          isSystemDefault: true
        },
        {
          name: "Zero-Trust Validation Rules",
          sectionType: "Validation Rules",
          content: "1. Verify grammatical accuracy across all technical stems and explanations.\n2. Ensure the correctIndex mathematically points to the unequivocally true option.\n3. Verify all options are distinct with zero textual duplication.\n4. Ensure explanations explicitly clarify both why the target option succeeds and why alternative distractors fail.",
          defaultVariablesUsed: ["topics"],
          isSystemDefault: true
        },
        {
          name: "JSON Array Output Directive",
          sectionType: "Output Rules",
          content: "Return strictly a clean, syntactically verified JSON Array adhering exactly to the linked Output Schema. Do not include markdown code fence formatting or conversational prefixes/suffixes.",
          defaultVariablesUsed: [],
          isSystemDefault: true
        }
      ];
      await AssessmentPromptSection.insertMany(defaultSections);
    }

    // 4. Seed Default Global Runtime Provider Config (Refinement 7)
    const configCount = await AssessmentRuntimeConfig.countDocuments({ scope: "Global" });
    if (configCount === 0) {
      await AssessmentRuntimeConfig.create({
        scope: "Global",
        primaryProvider: "Groq",
        modelName: "llama-3.1-8b-instant",
        fallbackProviders: [],
        temperature: 0.65,
        topP: 0.9,
        maxTokens: 2500,
        requestTimeoutMs: 7000,
        notes: "Global default provider routing aligned with AI-First architecture strategy."
      });
    }

    // 5. Seed Default Global Blueprint Assignment (Refinement 2)
    const assignmentCount = await AssessmentBlueprintAssignment.countDocuments({ isGlobalDefault: true });
    if (assignmentCount === 0) {
      const primaryBlueprint = await AssessmentAIBlueprint.findOne({ status: "Active" });
      if (primaryBlueprint) {
        await AssessmentBlueprintAssignment.create({
          isGlobalDefault: true,
          name: "Global System Default Assignment",
          description: "Canonical default routing assigning standard technical blueprints across all unassigned subcategories.",
          assignedBlueprints: [{
            blueprintId: primaryBlueprint._id,
            priority: 1,
            assessmentType: "All",
            weightPercentage: 100,
            status: "Active"
          }]
        });
      }
    }

    librariesSeeded = true;
  } catch (err) {
    console.error("Warning: Failed during auto-seeding of Phase 4.1 runtime libraries:", err);
  }
}

// ==========================================
// LIBRARY & ARCHITECTURE ENDPOINTS
// ==========================================

/**
 * GET /api/admin/assessment/runtime/libraries
 * Returns shared variables, reusable schemas, prompt sections, assignment mappings, and runtime configurations.
 */
exports.getRuntimeLibraries = async (req, res) => {
  try {
    await ensureDefaultLibrariesSeeded();

    const variables = await AssessmentVariableLibrary.find().sort({ name: 1 });
    const schemas = await AssessmentSchemaLibrary.find().sort({ assessmentType: 1, name: 1 });
    const sections = await AssessmentPromptSection.find().sort({ sectionType: 1, name: 1 });
    const assignments = await AssessmentBlueprintAssignment.find().populate("assignedBlueprints.blueprintId").sort({ isGlobalDefault: -1, updatedAt: -1 });
    const runtimeConfigs = await AssessmentRuntimeConfig.find().sort({ scope: 1, updatedAt: -1 });

    return res.status(200).json({
      success: true,
      libraries: {
        variables,
        schemas,
        sections,
        assignments,
        runtimeConfigs
      }
    });
  } catch (error) {
    console.error("Error loading Phase 4.1 runtime libraries:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve runtime libraries." });
  }
};

/**
 * POST /api/admin/assessment/runtime/resolve
 * Resolves runtime context, evaluates prompt health against configurable validation levels,
 * constructs Dependency Graph, and generates runtime payload preview.
 * NOTE: Strictly returns NO fake assessment questions (Refinement 1).
 */
exports.resolveRuntimePreview = async (req, res) => {
  try {
    await ensureDefaultLibrariesSeeded();

    const {
      blueprintId,
      subcategoryId,
      categoryId,
      assessmentType = "MCQ",
      testVariables = {},
      validationLevel = "Strict"
    } = req.body;

    if (!blueprintId && !subcategoryId) {
      return res.status(400).json({ success: false, error: "Either blueprintId or subcategoryId is required for runtime resolution." });
    }

    const previewResult = await runtimeResolver.resolveRuntimeContext({
      blueprintId,
      subcategoryId,
      categoryId,
      assessmentType,
      testVariables,
      validationLevel
    });

    return res.status(200).json(previewResult);
  } catch (error) {
    console.error("Error during runtime architectural resolution:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to resolve runtime architecture preview." });
  }
};

/**
 * POST /api/admin/assessment/runtime/variables
 * Create or update a reusable library variable (Refinement 4).
 */
exports.saveLibraryVariable = async (req, res) => {
  try {
    const { id, name, displayName, defaultValue, description, category, allowedValues } = req.body;
    if (!name || !displayName || !description) {
      return res.status(400).json({ success: false, error: "Name, display label, and description are mandatory." });
    }

    let variable;
    if (id) {
      variable = await AssessmentVariableLibrary.findByIdAndUpdate(id, { name: name.toLowerCase(), displayName, defaultValue, description, category, allowedValues }, { new: true });
    } else {
      variable = await AssessmentVariableLibrary.create({ name: name.toLowerCase(), displayName, defaultValue, description, category, allowedValues });
    }

    return res.status(200).json({ success: true, variable, message: "Shared variable successfully updated in library." });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Failed to save library variable." });
  }
};

/**
 * POST /api/admin/assessment/runtime/schemas
 * Create or update a reusable output schema (Refinement 5).
 */
exports.saveLibrarySchema = async (req, res) => {
  try {
    const { id, name, assessmentType, description, schemaDefinitions, jsonSchemaString, expectedResponseFormat } = req.body;
    if (!name || !assessmentType || !jsonSchemaString) {
      return res.status(400).json({ success: false, error: "Name, assessment modality, and JSON schema syntax are required." });
    }

    let schemaDoc;
    if (id) {
      schemaDoc = await AssessmentSchemaLibrary.findByIdAndUpdate(id, { name, assessmentType, description, schemaDefinitions, jsonSchemaString, expectedResponseFormat }, { new: true });
    } else {
      schemaDoc = await AssessmentSchemaLibrary.create({ name, assessmentType, description, schemaDefinitions, jsonSchemaString, expectedResponseFormat });
    }

    return res.status(200).json({ success: true, schema: schemaDoc, message: "Shared output schema saved successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Failed to save output schema." });
  }
};

/**
 * POST /api/admin/assessment/runtime/assignments
 * Create or update a blueprint assignment mapping (Refinement 2).
 */
exports.saveBlueprintAssignment = async (req, res) => {
  try {
    const { id, subcategoryId, categoryId, configId, isGlobalDefault, name, description, assignedBlueprints } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Assignment policy name is required." });
    }

    let assignment;
    if (id) {
      assignment = await AssessmentBlueprintAssignment.findByIdAndUpdate(id, { subcategoryId, categoryId, configId, isGlobalDefault, name, description, assignedBlueprints }, { new: true }).populate("assignedBlueprints.blueprintId");
    } else {
      assignment = await AssessmentBlueprintAssignment.create({ subcategoryId, categoryId, configId, isGlobalDefault, name, description, assignedBlueprints });
      await assignment.populate("assignedBlueprints.blueprintId");
    }

    return res.status(200).json({ success: true, assignment, message: "Blueprint assignment layer configured successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Failed to save blueprint assignment mapping." });
  }
};

/**
 * POST /api/admin/assessment/runtime/configs
 * Create or update hierarchical provider runtime configurations (Refinement 7).
 */
exports.saveRuntimeConfig = async (req, res) => {
  try {
    const { id, scope, categoryId, subcategoryId, primaryProvider, modelName, fallbackProviders, temperature, maxTokens, requestTimeoutMs } = req.body;

    let config;
    if (id) {
      config = await AssessmentRuntimeConfig.findByIdAndUpdate(id, { scope, categoryId, subcategoryId, primaryProvider, modelName, fallbackProviders, temperature, maxTokens, requestTimeoutMs }, { new: true });
    } else {
      config = await AssessmentRuntimeConfig.create({ scope, categoryId, subcategoryId, primaryProvider, modelName, fallbackProviders, temperature, maxTokens, requestTimeoutMs });
    }

    return res.status(200).json({ success: true, config, message: "Runtime provider configuration updated successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Failed to save runtime provider config." });
  }
};

// ── PHASE 5: AI RUNTIME ENGINE DIAGNOSTIC & MONITORING ENDPOINTS ─────────────

/**
 * GET /api/admin/assessment/runtime-engine/health
 * Returns comprehensive key pool health, multi-provider status, and metrics summary.
 */
exports.getRuntimeEngineHealth = async (req, res) => {
  try {
    const poolStatus = providerManager.getProviderPoolStatus();
    const metricsSummary = await runtimeLogger.getMetricsSummary();

    return res.status(200).json({
      success: true,
      poolStatus,
      metricsSummary,
      architecture: "Phase 5 AI Runtime Engine (Groq Multi-Key Round-Robin & Failover Ready)"
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Failed to retrieve runtime engine health status." });
  }
};

/**
 * POST /api/admin/assessment/runtime-engine/test
 * Runs diagnostic testing utilities across Round-Robin, Retry Engine, Timeout SLA, and Error Mapping.
 * Does NOT generate assessment questions!
 */
exports.testRuntimeEngine = async (req, res) => {
  try {
    const { testType = "ROUND_ROBIN" } = req.body;
    const result = await aiRuntimeEngine.executeDiagnosticTest(testType);

    return res.status(200).json({
      success: true,
      testType,
      diagnosticReport: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Failed to execute diagnostic testing suite." });
  }
};

/**
 * POST /api/admin/assessment/runtime-engine/cooldown-reset
 * Manually resets all keys in cooldown back to healthy state.
 */
exports.resetPoolCooldowns = async (req, res) => {
  try {
    const groqManager = require("../../services/assessment/GroqManager");
    const count = groqManager.restoreAllCooldownKeys();
    return res.status(200).json({
      success: true,
      restoredCount: count,
      message: `Successfully restored ${count} key credential(s) back to Healthy Round-Robin state.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Failed to reset cooldown keys." });
  }
};

/**
 * GET /api/admin/assessment/runtime-engine/logs
 * Retrieves recent execution logs with masked credentials and fine-grained latency metrics.
 */
exports.getRuntimeEngineLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "50", 10);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.provider) filter.provider = req.query.provider;

    const logs = await runtimeLogger.getRecentLogs(limit, filter);
    return res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Failed to retrieve runtime execution logs." });
  }
};
