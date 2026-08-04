/**
 * AI Blueprint Controller (Phase 4 — AI Prompt Studio)
 * Governs the complete Prompt Studio architecture, version history, variable injection,
 * schema modeling, template duplication, import/export, and mock testing frameworks.
 * 
 * IMPORTANT: This module is exclusively for managing AI Prompt Blueprints and test scaffolding.
 * Live AI inference (Groq/OpenAI calls), question bank ingestion, and student execution
 * are strictly reserved for Phase 5 and later phases.
 */

const AssessmentAIBlueprint = require("../../models/assessment/AssessmentAIBlueprint");
const AssessmentSubcategory = require("../../models/assessment/AssessmentSubcategory");
const AssessmentCategory    = require("../../models/assessment/AssessmentCategory");
const runtimeResolver         = require("../../services/assessment/RuntimeResolver");

/**
 * Built-in System Templates to seed if the template library is empty
 */
const SYSTEM_TEMPLATES = [
  {
    name: "Master Programming Evaluation Blueprint",
    description: "Rigorous algorithmic and software design pattern question synthesizer.",
    templateCategory: "Programming",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["Programming", "Syntax", "Patterns", "Official"],
    prompt: {
      systemInstruction: "You are an enterprise software architect and technical lead conducting high-stakes technical engineering evaluations. Your primary mandate is to synthesize challenging, unambiguous questions that test deep semantic understanding, memory management, thread safety, and architecture rather than superficial vocabulary.",
      context: "Evaluation domain: {{subcategory}} under {{category}}. Target proficiency: {{experienceLevel}}. Assessment style: {{assessmentType}}.",
      rules: "1. Generate exactly {{questionCount}} test items matching difficulty level: {{difficulty}}.\n2. Ensure code snippets embedded in question stems use accurate syntax and modern idiomatic best practices.\n3. All four candidate choices (A, B, C, D) must be credible; distractors must represent realistic compilation errors, edge case oversights, or concurrency flaws.\n4. Avoid generic fluff or introductory chat expressions.",
      outputFormat: "Return solely an unadulterated JSON array adhering strictly to the configured Output Schema.",
      validationRulesText: "Verify option uniqueness. Ensure correctIndex points accurately to the mathematically or syntactically correct item.",
      notes: "Official system template for core programming language assessments."
    }
  },
  {
    name: "Data Structures & Algorithms (DSA) Engine",
    description: "Specialized prompt blueprint for time/space complexity analysis and algorithmic data structures.",
    templateCategory: "DSA",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["DSA", "Big-O", "Algorithms", "Official"],
    prompt: {
      systemInstruction: "You are a competitive programming judge and senior algorithmic theorist. Your goal is to evaluate computational efficiency, Big-O asymptomatic analysis, tree optimizations, graphs, dynamic programming, and hash collisions.",
      context: "Evaluation focus: {{topics}} in domain {{subcategory}}. Candidate tier: {{experienceLevel}}.",
      rules: "1. Generate exactly {{questionCount}} algorithmic challenges matching difficulty: {{difficulty}}.\n2. Emphasize worst-case vs average-case computational time and space complexity tradeoffs.\n3. Include edge case constraints (null inputs, cycles, overflow bounds) within explanation justifications.",
      outputFormat: "Return pure JSON array adhering to the prescribed Output Schema without markdown wrapping.",
      validationRulesText: "Confirm mathematical precision of algorithmic runtimes in explanations.",
      notes: "Official system template for DSA and computational theory assessments."
    }
  },
  {
    name: "Quantitative & Analytical Aptitude Blueprint",
    description: "Evaluates numerical ability, logical reasoning, data interpretation, and pattern recognition.",
    templateCategory: "Aptitude",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["Aptitude", "Logic", "Math", "Official"],
    prompt: {
      systemInstruction: "You are an industrial psychometrist and executive recruitment evaluator specializing in quantitative aptitude and critical reasoning batteries.",
      context: "Focal topics: {{topics}}. Difficulty tier: {{difficulty}}. Total items requested: {{questionCount}}.",
      rules: "1. Formulate exact numerical, inductive reasoning, or logical deduction puzzles.\n2. Distractors must mirror common arithmetic calculation oversights or off-by-one reasoning traps.\n3. Explanation must delineate step-by-step arithmetic equations or formal logic proofs.",
      outputFormat: "Output JSON array strictly matching schema specifications.",
      validationRulesText: "All numerical calculations must be verified twice for precision.",
      notes: "Official system template for placement and quantitative aptitude."
    }
  },
  {
    name: "Enterprise Database Systems Blueprint",
    description: "Synthesizes advanced SQL query optimization, indexing, ACID transaction isolation, and NoSQL architecture questions.",
    templateCategory: "Database",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["SQL", "NoSQL", "Database", "Official"],
    prompt: {
      systemInstruction: "You are a Principal Database Administrator (DBA) and Distributed Data Systems Architect. You test deep knowledge of relational algebra, B-Tree index cardinality, query execution plans, deadlock resolution, and shard rebalancing.",
      context: "Database technology: {{subcategory}}. Target level: {{experienceLevel}}. Modality: {{assessmentType}}.",
      rules: "1. Construct exactly {{questionCount}} database questions matching difficulty: {{difficulty}}.\n2. When presenting SQL queries, include explicit schema context (tables, primary/foreign keys).\n3. Explanations must diagnose execution plan bottlenecks and locking implications.",
      outputFormat: "Pure JSON array without extraneous text.",
      validationRulesText: "Validate that SQL queries are syntactically compliant with ANSI SQL or targeted engines.",
      notes: "Official system template for relational and distributed databases."
    }
  },
  {
    name: "Operating Systems & Internals Blueprint",
    description: "Evaluates kernel virtualization, concurrency mutexes, process memory mapping, and page scheduling.",
    templateCategory: "Operating System",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["OS", "Kernel", "Concurrency", "Official"],
    prompt: {
      systemInstruction: "You are an Operating Systems Kernel Engineer and Systems Programmer. You examine low-level process synchronization, inter-process communication (IPC), virtual memory paging, syscall overhauls, and interrupt handlers.",
      context: "OS domain: {{subcategory}}. Experience profile: {{experienceLevel}}.",
      rules: "1. Generate exactly {{questionCount}} systems level questions at difficulty: {{difficulty}}.\n2. Focus on deadlocks, race conditions, CPU cache coherence, and POSIX threads.",
      outputFormat: "Return valid JSON matching the exact schema definition.",
      validationRulesText: "Ensure precision regarding OS architecture specifications.",
      notes: "Official system template for operating system architectures."
    }
  },
  {
    name: "Computer Networks & Protocol Stack Engine",
    description: "Evaluates TCP/IP handshakes, DNS packet routing, firewall subnets, BGP peering, and OSI model behaviors.",
    templateCategory: "Computer Networks",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["Networking", "TCP/IP", "Protocols", "Official"],
    prompt: {
      systemInstruction: "You are a Senior Network Engineer and RFC Protocol Specialist. You construct realistic networking scenarios examining packet dissection, TLS handshakes, subnet mask calculation, and routing routing convergence.",
      context: "Networking subfield: {{subcategory}}. Topics: {{topics}}.",
      rules: "1. Synthesize exactly {{questionCount}} networking questions at difficulty: {{difficulty}}.\n2. Present real-world routing tables, Wireshark packet captures, or DNS resolution cascades.",
      outputFormat: "JSON array strictly compliant with defined schema.",
      validationRulesText: "Verify CIDR calculations and TCP flag state transitions.",
      notes: "Official system template for computer networking assessments."
    }
  },
  {
    name: "Modern Web & Fullstack Development Blueprint",
    description: "Covers DOM reactivity, REST/GraphQL design, server-side rendering, CORS security, and modern bundling.",
    templateCategory: "Web Development",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["Web", "Frontend", "Backend", "Official"],
    prompt: {
      systemInstruction: "You are a Principal Full-Stack Developer and Web Application Architect. You design questions evaluating Reactivity, browser rendering pipelines, WebSockets, OAuth2 tokens, microservices, and web accessibility.",
      context: "Web Framework: {{subcategory}}. Level: {{experienceLevel}}.",
      rules: "1. Create {{questionCount}} web architecture items at difficulty: {{difficulty}}.\n2. Address modern async programming, state hydration, and HTTP cache headers.",
      outputFormat: "Strict JSON array representation.",
      validationRulesText: "Ensure modern framework conventions (ES6+, modern hooks, secure headers).",
      notes: "Official system template for web application engineering."
    }
  },
  {
    name: "Artificial Intelligence & Machine Learning Suite",
    description: "Evaluates neural networks, gradient descent optimization, LLM prompt engineering, and hyperparameter tuning.",
    templateCategory: "AI",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["AI", "ML", "Neural Networks", "Official"],
    prompt: {
      systemInstruction: "You are an AI Research Scientist and Deep Learning Systems Engineer. You create evaluations covering Transformer architectures, loss function gradients, regularizations, embedding vectors, and RAG pipelines.",
      context: "AI focus: {{subcategory}}. Topics: {{topics}}. Difficulty: {{difficulty}}.",
      rules: "1. Produce {{questionCount}} conceptual and mathematical machine learning items.\n2. Distractors should highlight overfitting traps, data leakage, or inappropriate activation function choices.",
      outputFormat: "Formatted JSON array strictly adhering to Output Schema.",
      validationRulesText: "Verify formulaic correctness of evaluation metrics (F1-score, ROC-AUC, Perplexity).",
      notes: "Official system template for AI and data science assessments."
    }
  },
  {
    name: "Cloud Infrastructure & DevOps Architecture Blueprint",
    description: "Evaluates Kubernetes container orchestration, AWS/GCP serverless scaling, IaC Terraform pipelines, and resilience.",
    templateCategory: "Cloud",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["Cloud", "DevOps", "Kubernetes", "Official"],
    prompt: {
      systemInstruction: "You are a Principal Cloud Solutions Architect and DevOps Automation Specialist. You formulate rigorous scenario-based evaluations on multi-region high-availability, IAM privilege boundaries, container orchestration, and CI/CD deployment strategies.",
      context: "Cloud ecosystem: {{subcategory}}. Proficiency tier: {{experienceLevel}}.",
      rules: "1. Generate {{questionCount}} architectural scenarios at difficulty: {{difficulty}}.\n2. Focus on cost optimization, zero-downtime rolling upgrades, and immutable infrastructure principles.",
      outputFormat: "JSON array matching required field mappings.",
      validationRulesText: "Verify adherence to official AWS/GCP Well-Architected frameworks.",
      notes: "Official system template for Cloud Infrastructure & DevOps."
    }
  },
  {
    name: "Cybersecurity & Offensive Penetration Engine",
    description: "Evaluates OWASP Top 10 vulnerabilities, cryptographic ciphers, zero-trust perimeter defense, and forensics.",
    templateCategory: "Cyber Security",
    provider: "Groq",
    providerModel: "llama-3.3-70b-versatile",
    tags: ["Security", "OWASP", "Crypto", "Official"],
    prompt: {
      systemInstruction: "You are a Chief Information Security Officer (CISO) and Certified Ethical Hacker (CEH). You formulate high-fidelity defensive security and vulnerability evaluation challenges covering SQL injection, XSS payloads, TLS cipher suites, privilege escalation, and Incident Response.",
      context: "Security focus area: {{subcategory}}. Evaluation difficulty: {{difficulty}}.",
      rules: "1. Produce {{questionCount}} cybersecurity items.\n2. Emphasize attack vectors, mitigation patterns, and cryptographic principle proofs.",
      outputFormat: "Pure JSON array without introductory prose.",
      validationRulesText: "Ensure compliance with NIST and OWASP industry terminologies.",
      notes: "Official system template for cybersecurity & defensive engineering."
    }
  }
];

/**
 * Helper to ensure the 10 core reusable templates exist in the system database
 */
async function ensureSystemTemplatesSeeded() {
  try {
    const existingCount = await AssessmentAIBlueprint.countDocuments({ isTemplate: true });
    if (existingCount < SYSTEM_TEMPLATES.length) {
      for (const tpl of SYSTEM_TEMPLATES) {
        const exists = await AssessmentAIBlueprint.findOne({ name: tpl.name, isTemplate: true });
        if (!exists) {
          const newTemplate = new AssessmentAIBlueprint({
            name: tpl.name,
            description: tpl.description,
            templateCategory: tpl.templateCategory,
            provider: tpl.provider,
            providerModel: tpl.providerModel,
            tags: tpl.tags,
            isTemplate: true,
            status: "Active",
            versions: [
              {
                versionNumber: 1,
                prompt: tpl.prompt,
                variables: [
                  { name: "category", defaultValue: "Technical", required: true, description: "Main category" },
                  { name: "subcategory", defaultValue: tpl.templateCategory, required: true, description: "Subcategory domain" },
                  { name: "difficulty", defaultValue: "Medium", required: true, description: "Difficulty level" },
                  { name: "questionCount", defaultValue: "5", required: true, description: "Item count" },
                  { name: "topics", defaultValue: "Core Architecture", required: true, description: "Key subtopics" },
                  { name: "experienceLevel", defaultValue: "Intermediate", required: false, description: "Proficiency tier" },
                  { name: "assessmentType", defaultValue: "MCQ", required: true, description: "Test style" },
                  { name: "language", defaultValue: "English", required: false, description: "Output language" }
                ],
                outputSchema: {
                  schemaDefinitions: [
                    { field: "question", type: "string", required: true, description: "Question stem" },
                    { field: "options", type: "array of 4 strings", required: true, description: "Answer options A, B, C, D" },
                    { field: "correctIndex", type: "number", required: true, description: "0-based correct option index" },
                    { field: "explanation", type: "string", required: true, description: "Analytical justification" },
                    { field: "topic", type: "string", required: true, description: "Topic examined" },
                    { field: "difficulty", type: "string", required: true, description: "Difficulty tier" }
                  ],
                  jsonSchemaString: `[{"question":"Sample stem","options":["A","B","C","D"],"correctIndex":0,"explanation":"Why A is right","topic":"${tpl.templateCategory}","difficulty":"medium"}]`
                },
                notes: "System template auto-seeded.",
                status: "Active"
              }
            ],
            activeVersion: 1
          });
          await newTemplate.save();
        }
      }
    }
  } catch (err) {
    console.error("Error seeding system blueprint templates:", err);
  }
}

/**
 * Perform local validation on a prompt blueprint payload
 * Ensures zero empty instructions, required variables exist, and schema completeness.
 */
function evaluatePromptHealth(blueprintData) {
  const errors = [];
  const warnings = [];
  const activeV = blueprintData.currentVersionData || (blueprintData.versions && blueprintData.versions[0]) || {};
  const prompt = activeV.prompt || blueprintData.prompt || {};
  const variables = activeV.variables || blueprintData.variables || [];
  const outputSchema = activeV.outputSchema || blueprintData.outputSchema || {};

  // Check 1: Empty System Prompt / Instruction
  if (!prompt.systemInstruction || prompt.systemInstruction.trim().length === 0) {
    errors.push("System Instruction section cannot be empty.");
  } else if (prompt.systemInstruction.length < 30) {
    warnings.push("System Instruction is extremely brief (< 30 chars); higher architectural specificity is recommended.");
  }

  // Check 2: Required Variables Presence
  const varNames = variables.map((v) => v.name.toLowerCase());
  const mandatory = ["subcategory", "difficulty", "questioncount"];
  mandatory.forEach((reqVar) => {
    if (!varNames.includes(reqVar)) {
      warnings.push(`Missing highly recommended dynamic variable: {{${reqVar}}}.`);
    }
  });

  // Check 3: Duplicate Variables
  const uniqueVars = new Set(varNames);
  if (uniqueVars.size < varNames.length) {
    errors.push("Duplicate dynamic variable definitions detected.");
  }

  // Check 4: Output Schema Check
  const schemaDefs = outputSchema.schemaDefinitions || [];
  if (schemaDefs.length === 0 && (!outputSchema.jsonSchemaString || outputSchema.jsonSchemaString.trim() === "")) {
    errors.push("Output Schema definition is missing. AI generator requires an explicit structure model.");
  }

  // Check 5: Provider Validator (Decoupled in Phase 4.1)
  const validProviders = ["Groq", "OpenAI", "Gemini", "Claude", "Custom", "Runtime Resolver"];
  if (blueprintData.provider && !validProviders.includes(blueprintData.provider)) {
    errors.push(`Unsupported AI provider: ${blueprintData.provider}. Must be one of ${validProviders.join(", ")}.`);
  }

  // Check 6: Blueprint Name
  if (!blueprintData.name || blueprintData.name.trim().length === 0) {
    errors.push("Blueprint must have a valid descriptive name.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, 100 - errors.length * 25 - warnings.length * 10)
  };
}

/**
 * 1. LIST BLUEPRINTS
 * GET /api/admin/assessment/blueprints
 * Query Parameters: search, provider, status, category, tag, isTemplate, page, limit
 */
exports.listBlueprints = async (req, res) => {
  try {
    await ensureSystemTemplatesSeeded();

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip  = (page - 1) * limit;

    const filter = {};

    // Template vs Domain Blueprint separation
    if (req.query.isTemplate !== undefined && req.query.isTemplate !== "") {
      filter.isTemplate = req.query.isTemplate === "true";
    }

    if (req.query.provider && req.query.provider !== "all") {
      filter.provider = req.query.provider;
    }

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    if (req.query.category && req.query.category !== "all") {
      filter.templateCategory = req.query.category;
    }

    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }

    if (req.query.search && req.query.search.trim() !== "") {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { systemPrompt: searchRegex }
      ];
    }

    const total = await AssessmentAIBlueprint.countDocuments(filter);
    const blueprints = await AssessmentAIBlueprint.find(filter)
      .populate("subcategoryId", "name icon color status")
      .populate("categoryId", "name icon color")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Compute Studio Overview KPI Summary stats
    const totalBlueprints = await AssessmentAIBlueprint.countDocuments({ isTemplate: false });
    const activeCount     = await AssessmentAIBlueprint.countDocuments({ isTemplate: false, status: "Active" });
    const templateCount   = await AssessmentAIBlueprint.countDocuments({ isTemplate: true });
    const groqCount       = await AssessmentAIBlueprint.countDocuments({ provider: "Groq", status: "Active" });

    res.json({
      success: true,
      data: blueprints,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalBlueprints,
        activeCount,
        templateCount,
        providerStats: {
          Groq: groqCount,
          OpenAI: await AssessmentAIBlueprint.countDocuments({ provider: "OpenAI" }),
          Gemini: await AssessmentAIBlueprint.countDocuments({ provider: "Gemini" }),
          Claude: await AssessmentAIBlueprint.countDocuments({ provider: "Claude" }),
        }
      }
    });
  } catch (err) {
    console.error("Error listing AI blueprints:", err);
    res.status(500).json({ success: false, message: "Server error listing AI blueprints." });
  }
};

/**
 * 2. GET BLUEPRINT BY ID (OR LAZY INITIALIZE BY SUBCATEGORY)
 * GET /api/admin/assessment/blueprints/:id
 */
exports.getBlueprintById = async (req, res) => {
  try {
    const { id } = req.params;

    let blueprint;
    // Check if ID matches an existing blueprint doc ID
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      blueprint = await AssessmentAIBlueprint.findById(id)
        .populate("subcategoryId", "name icon color")
        .populate("categoryId", "name icon color");
      
      // If not found by blueprint _id, try finding by subcategoryId
      if (!blueprint) {
        blueprint = await AssessmentAIBlueprint.findOne({ subcategoryId: id })
          .populate("subcategoryId", "name icon color")
          .populate("categoryId", "name icon color");
      }
    }

    // Lazy-initialize if searching for a subcategory that lacks a blueprint
    if (!blueprint && id.match(/^[0-9a-fA-F]{24}$/)) {
      const subcat = await AssessmentSubcategory.findById(id).populate("categoryId");
      if (subcat) {
        blueprint = new AssessmentAIBlueprint({
          name: `${subcat.name} AI Blueprint`,
          subcategoryId: subcat._id,
          categoryId: subcat.categoryId ? subcat.categoryId._id : undefined,
          description: `Primary automated AI evaluation blueprint for ${subcat.name}.`,
          provider: "Groq",
          providerModel: "llama-3.3-70b-versatile",
          tags: [subcat.name, "AI-First", "Production"],
          status: "Active",
          createdBy: req.user?.name || "Admin",
          updatedBy: req.user?.name || "Admin"
        });
        await blueprint.save();
        
        // Ensure subcategory link
        subcat.blueprintId = blueprint._id;
        await subcat.save();

        blueprint = await AssessmentAIBlueprint.findById(blueprint._id)
          .populate("subcategoryId", "name icon color")
          .populate("categoryId", "name icon color");
      }
    }

    if (!blueprint) {
      return res.status(404).json({ success: false, message: "AI Blueprint or Subcategory not found." });
    }

    const health = evaluatePromptHealth(blueprint);

    res.json({
      success: true,
      data: blueprint,
      health
    });
  } catch (err) {
    console.error("Error fetching AI blueprint:", err);
    res.status(500).json({ success: false, message: "Error retrieving AI Blueprint data." });
  }
};

/**
 * 3. CREATE BLUEPRINT (OR TEMPLATE)
 * POST /api/admin/assessment/blueprints
 */
exports.createBlueprint = async (req, res) => {
  try {
    const {
      name,
      subcategoryId,
      categoryId,
      description,
      provider,
      providerModel,
      status,
      tags,
      isTemplate,
      templateCategory,
      prompt,
      variables,
      outputSchema,
      validationRules,
      versionNotes
    } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Blueprint Name is required." });
    }

    // Construct Version 1 object
    const v1 = {
      versionNumber: 1,
      prompt: prompt || {
        systemInstruction: "You are an expert AI technical interviewer generating assessment challenges.",
        context: "Domain evaluation for target skill competencies.",
        rules: "Generate clear, unambiguous multiple-choice questions with validated explanations.",
        outputFormat: "Return valid JSON array matching the required schema structure.",
        validationRulesText: "Verify distractor plausibility and grammatical structure.",
        notes: versionNotes || "Initial blueprint creation."
      },
      variables: variables || [],
      outputSchema: outputSchema || {},
      validationRules: validationRules || [],
      notes: versionNotes || "Initial v1 release.",
      createdBy: req.user?.name || "Admin",
      status: status || "Active"
    };

    const newBlueprint = new AssessmentAIBlueprint({
      name,
      subcategoryId: subcategoryId || undefined,
      categoryId: categoryId || undefined,
      description,
      provider: provider || "Groq",
      providerModel: providerModel || "llama-3.3-70b-versatile",
      status: status || "Active",
      tags: tags || ["Custom", "AI"],
      isTemplate: Boolean(isTemplate),
      templateCategory: templateCategory || "General",
      createdBy: req.user?.name || "Admin",
      updatedBy: req.user?.name || "Admin",
      versions: [v1],
      activeVersion: 1,
      systemPrompt: v1.prompt.systemInstruction
    });

    const health = evaluatePromptHealth(newBlueprint);
    if (!health.isValid) {
      return res.status(400).json({
        success: false,
        message: "Blueprint schema validation failed.",
        errors: health.errors,
        warnings: health.warnings
      });
    }

    await newBlueprint.save();

    // Link to Subcategory if specified and not a template
    if (subcategoryId && !isTemplate) {
      await AssessmentSubcategory.findByIdAndUpdate(subcategoryId, { blueprintId: newBlueprint._id });
    }

    res.status(201).json({
      success: true,
      message: "AI Blueprint created successfully with initial Version 1.",
      data: newBlueprint,
      health
    });
  } catch (err) {
    console.error("Error creating AI blueprint:", err);
    res.status(500).json({ success: false, message: "Server error during blueprint creation." });
  }
};

/**
 * 4. UPDATE BLUEPRINT & CREATE NEW VERSION (IMMUTABLE HISTORY)
 * PUT /api/admin/assessment/blueprints/:id
 * CRITICAL REQUIREMENT: Never overwrite previous versions. Every save creates a new version.
 */
exports.updateBlueprint = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      provider,
      providerModel,
      status,
      tags,
      prompt,
      variables,
      outputSchema,
      validationRules,
      versionNotes
    } = req.body;

    const blueprint = await AssessmentAIBlueprint.findById(id);
    if (!blueprint) {
      return res.status(404).json({ success: false, message: "Blueprint not found." });
    }

    // Require version commit note when saving edits
    if (!versionNotes || versionNotes.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Version commit notes are mandatory before saving a new iteration."
      });
    }

    // Determine next version number
    const currentVersions = blueprint.versions || [];
    const maxVersionNo = currentVersions.reduce((max, v) => Math.max(max, v.versionNumber || 0), 0);
    const newVersionNumber = maxVersionNo + 1;

    // Build the new version snapshot
    const currentActiveV = currentVersions.find((v) => v.versionNumber === blueprint.activeVersion) || currentVersions[currentVersions.length - 1] || {};

    const newVersionSnapshot = {
      versionNumber: newVersionNumber,
      prompt: prompt || currentActiveV.prompt || {},
      variables: variables || currentActiveV.variables || [],
      outputSchema: outputSchema || currentActiveV.outputSchema || {},
      validationRules: validationRules || currentActiveV.validationRules || [],
      notes: versionNotes.trim(),
      createdBy: req.user?.name || "Admin",
      status: status || blueprint.status || "Active"
    };

    // Append to immutable versions history and bump activeVersion
    blueprint.versions.push(newVersionSnapshot);
    blueprint.activeVersion = newVersionNumber;
    blueprint.updatedBy = req.user?.name || "Admin";

    // Update top-level descriptors if provided
    if (name) blueprint.name = name;
    if (description !== undefined) blueprint.description = description;
    if (provider) blueprint.provider = provider;
    if (providerModel) blueprint.providerModel = providerModel;
    if (status) blueprint.status = status;
    if (tags) blueprint.tags = tags;

    // Synchronize legacy top-level field for backwards compatibility
    if (newVersionSnapshot.prompt && newVersionSnapshot.prompt.systemInstruction) {
      blueprint.systemPrompt = newVersionSnapshot.prompt.systemInstruction;
    }

    const health = evaluatePromptHealth(blueprint);
    if (!health.isValid) {
      return res.status(400).json({
        success: false,
        message: "Blueprint validation failed during version save.",
        errors: health.errors,
        warnings: health.warnings
      });
    }

    await blueprint.save();

    res.json({
      success: true,
      message: `Successfully saved as Version ${newVersionNumber}. Prior history preserved intact.`,
      data: blueprint,
      health
    });
  } catch (err) {
    console.error("Error updating AI blueprint:", err);
    res.status(500).json({ success: false, message: "Error updating blueprint version history." });
  }
};

/**
 * 5. ACTIVATE HISTORICAL VERSION (ONE-CLICK ROLLBACK)
 * POST /api/admin/assessment/blueprints/:id/versions/:versionNumber/activate
 */
exports.activateVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const vNo = parseInt(versionNumber);

    const blueprint = await AssessmentAIBlueprint.findById(id);
    if (!blueprint) {
      return res.status(404).json({ success: false, message: "Blueprint not found." });
    }

    const targetV = (blueprint.versions || []).find((v) => v.versionNumber === vNo);
    if (!targetV) {
      return res.status(404).json({ success: false, message: `Version ${vNo} does not exist in history.` });
    }

    blueprint.activeVersion = vNo;
    if (targetV.prompt && targetV.prompt.systemInstruction) {
      blueprint.systemPrompt = targetV.prompt.systemInstruction;
    }
    blueprint.updatedBy = req.user?.name || "Admin";
    await blueprint.save();

    res.json({
      success: true,
      message: `Blueprint successfully rolled back and activated Version ${vNo}.`,
      data: blueprint
    });
  } catch (err) {
    console.error("Error activating blueprint version:", err);
    res.status(500).json({ success: false, message: "Server error executing version rollback." });
  }
};

/**
 * 6. VERSION COMPARISON ENGINE
 * GET /api/admin/assessment/blueprints/:id/compare?v1=1&v2=2
 */
exports.compareVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const v1No = parseInt(req.query.v1 || "1");
    const v2No = parseInt(req.query.v2 || "2");

    const blueprint = await AssessmentAIBlueprint.findById(id);
    if (!blueprint) {
      return res.status(404).json({ success: false, message: "Blueprint not found." });
    }

    const v1 = (blueprint.versions || []).find((v) => v.versionNumber === v1No);
    const v2 = (blueprint.versions || []).find((v) => v.versionNumber === v2No);

    if (!v1 || !v2) {
      return res.status(404).json({ success: false, message: "One or both target versions not found in history." });
    }

    // Build diff diagnostics
    const differences = {
      promptSections: {
        systemInstruction: { changed: v1.prompt?.systemInstruction !== v2.prompt?.systemInstruction, v1: v1.prompt?.systemInstruction || "", v2: v2.prompt?.systemInstruction || "" },
        context: { changed: v1.prompt?.context !== v2.prompt?.context, v1: v1.prompt?.context || "", v2: v2.prompt?.context || "" },
        rules: { changed: v1.prompt?.rules !== v2.prompt?.rules, v1: v1.prompt?.rules || "", v2: v2.prompt?.rules || "" },
        outputFormat: { changed: v1.prompt?.outputFormat !== v2.prompt?.outputFormat, v1: v1.prompt?.outputFormat || "", v2: v2.prompt?.outputFormat || "" },
      },
      variableCount: { v1: (v1.variables || []).length, v2: (v2.variables || []).length },
      commitNotes: { v1: v1.notes, v2: v2.notes },
      timestamp: { v1: v1.createdAt, v2: v2.createdAt }
    };

    res.json({
      success: true,
      data: {
        blueprintId: blueprint._id,
        blueprintName: blueprint.name,
        v1,
        v2,
        differences
      }
    });
  } catch (err) {
    console.error("Error comparing versions:", err);
    res.status(500).json({ success: false, message: "Error computing version differences." });
  }
};

/**
 * 7. CLONE BLUEPRINT TO NEW SUBCATEGORY / DOMAIN
 * POST /api/admin/assessment/blueprints/:id/clone
 */
exports.cloneBlueprint = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetSubcategoryId, newName } = req.body;

    const source = await AssessmentAIBlueprint.findById(id);
    if (!source) {
      return res.status(404).json({ success: false, message: "Source blueprint not found." });
    }

    let targetCatId;
    if (targetSubcategoryId) {
      const sub = await AssessmentSubcategory.findById(targetSubcategoryId).populate("categoryId");
      if (!sub) return res.status(404).json({ success: false, message: "Target subcategory does not exist." });
      targetCatId = sub.categoryId ? sub.categoryId._id : undefined;
    }

    // Extract active version from source
    const sourceActiveV = (source.versions || []).find((v) => v.versionNumber === source.activeVersion) || source.versions[0] || {};
    
    const v1Clone = {
      versionNumber: 1,
      prompt: sourceActiveV.prompt || {},
      variables: sourceActiveV.variables || [],
      outputSchema: sourceActiveV.outputSchema || {},
      validationRules: sourceActiveV.validationRules || [],
      notes: `Cloned from blueprint: ${source.name} (v${source.activeVersion})`,
      createdBy: req.user?.name || "Admin",
      status: "Active"
    };

    const cloneDoc = new AssessmentAIBlueprint({
      name: newName || `${source.name} (Clone)`,
      subcategoryId: targetSubcategoryId || undefined,
      categoryId: targetCatId || source.categoryId,
      description: source.description,
      provider: source.provider,
      providerModel: source.providerModel,
      status: "Active",
      tags: [...source.tags, "Cloned"],
      isTemplate: false,
      createdBy: req.user?.name || "Admin",
      updatedBy: req.user?.name || "Admin",
      versions: [v1Clone],
      activeVersion: 1,
      systemPrompt: v1Clone.prompt?.systemInstruction || source.systemPrompt
    });

    await cloneDoc.save();

    if (targetSubcategoryId) {
      await AssessmentSubcategory.findByIdAndUpdate(targetSubcategoryId, { blueprintId: cloneDoc._id });
    }

    res.status(201).json({
      success: true,
      message: `Blueprint successfully cloned as "${cloneDoc.name}".`,
      data: cloneDoc
    });
  } catch (err) {
    console.error("Error cloning AI blueprint:", err);
    res.status(500).json({ success: false, message: "Server error during blueprint cloning." });
  }
};

/**
 * 8. IMPORT BLUEPRINT (WITH JSON SCHEMA VALIDATION)
 * POST /api/admin/assessment/blueprints/import
 */
exports.importBlueprint = async (req, res) => {
  try {
    const payload = req.body.blueprintData || req.body;

    if (!payload.name) {
      return res.status(400).json({ success: false, message: "Invalid JSON: Missing blueprint name." });
    }

    const activeV = (payload.versions && payload.versions[0]) || {};
    const prompt = activeV.prompt || payload.prompt || {};

    if (!prompt.systemInstruction) {
      return res.status(400).json({ success: false, message: "Invalid JSON: Missing System Instruction in prompt sections." });
    }

    const v1 = {
      versionNumber: 1,
      prompt: prompt,
      variables: activeV.variables || payload.variables || [],
      outputSchema: activeV.outputSchema || payload.outputSchema || {},
      validationRules: activeV.validationRules || payload.validationRules || [],
      notes: "Imported via JSON upload.",
      createdBy: req.user?.name || "Admin",
      status: "Active"
    };

    const importedDoc = new AssessmentAIBlueprint({
      name: payload.name.endsWith(" (Imported)") ? payload.name : `${payload.name} (Imported)`,
      description: payload.description || "Imported prompt architecture.",
      provider: payload.provider || "Groq",
      providerModel: payload.providerModel || "llama-3.3-70b-versatile",
      tags: [...(payload.tags || ["AI"]), "Imported"],
      status: "Active",
      isTemplate: Boolean(payload.isTemplate),
      templateCategory: payload.templateCategory || "General",
      createdBy: req.user?.name || "Admin",
      versions: [v1],
      activeVersion: 1,
      systemPrompt: v1.prompt.systemInstruction
    });

    const health = evaluatePromptHealth(importedDoc);
    if (!health.isValid) {
      return res.status(400).json({
        success: false,
        message: "Imported blueprint failed structural validation rules.",
        errors: health.errors
      });
    }

    await importedDoc.save();

    res.status(201).json({
      success: true,
      message: "JSON Blueprint imported and verified successfully.",
      data: importedDoc,
      health
    });
  } catch (err) {
    console.error("Error importing AI blueprint:", err);
    res.status(500).json({ success: false, message: "Failed to parse and import blueprint JSON." });
  }
};

/**
 * 9. EXPORT BLUEPRINT (PORTABLE JSON GENERATION)
 * GET /api/admin/assessment/blueprints/:id/export
 */
exports.exportBlueprint = async (req, res) => {
  try {
    const { id } = req.params;
    const blueprint = await AssessmentAIBlueprint.findById(id).lean();
    if (!blueprint) {
      return res.status(404).json({ success: false, message: "Blueprint not found." });
    }

    delete blueprint._id;
    delete blueprint.__v;
    delete blueprint.subcategoryId;
    delete blueprint.categoryId;
    delete blueprint.createdAt;
    delete blueprint.updatedAt;
    delete blueprint.id;

    res.json({
      success: true,
      blueprintData: blueprint,
      exportTimestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error exporting blueprint:", err);
    res.status(500).json({ success: false, message: "Error compiling export JSON payload." });
  }
};

/**
 * 10. PROMPT TESTING & RUNTIME PAYLOAD PREVIEW (Phase 4.1 Refinements 1, 9, 12)
 * POST /api/admin/assessment/blueprints/:id/test
 * CRITICAL REQUIREMENT: Remove Fake Question Generation. Do NOT return fake sample questions or simulated AI answers.
 * Prompt Studio is responsible ONLY for: Prompt -> Payload -> Validation -> Preview -> Architecture Verification.
 * Actual AI inference belongs entirely to Phase 5.
 */
exports.testBlueprint = async (req, res) => {
  try {
    const { id } = req.params;
    const { testVariables, draftPrompt, providerOverride, validationLevel = "Strict" } = req.body;

    let blueprint = null;
    if (id !== "draft" && id !== "undefined" && id !== "new") {
      try {
        blueprint = await AssessmentAIBlueprint.findById(id);
      } catch (e) {
        // Ignore invalid ObjectId and fall back to temporary draft blueprint
      }
    }
    
    if (!blueprint) {
      // Create temporary representation if testing unsaved template or draft
      blueprint = {
        name: "Draft Runtime Preview",
        activeVersion: 1,
        versions: [{
          versionNumber: 1,
          prompt: draftPrompt || {},
          variables: [],
          outputSchema: { jsonSchemaString: "[]", schemaDefinitions: [] }
        }]
      };
    }

    const activeV = blueprint?.currentVersionData || (blueprint?.versions || [])[0] || {};
    const prompt = draftPrompt || activeV.prompt || {};
    const variables = activeV.variables || [];
    const outputSchema = activeV.outputSchema || {};

    // Build interpolation map with default values
    const valueMap = {};
    const varNames = [];
    variables.forEach((v) => {
      valueMap[v.name.toLowerCase()] = testVariables?.[v.name] || v.defaultValue || `[${v.name}]`;
      if (!varNames.includes(v.name)) varNames.push(v.name);
    });
    // Ensure standard system library variables are represented
    const defaults = {
      category: testVariables?.category || "Technology & Engineering",
      subcategory: testVariables?.subcategory || "Full-Stack Web Architecture",
      difficulty: testVariables?.difficulty || "Medium",
      questioncount: testVariables?.questionCount || "5",
      topics: testVariables?.topics || "Asynchronous state, REST APIs, Security",
      language: testVariables?.language || "English",
      assessmenttype: testVariables?.assessmentType || "MCQ",
      experiencelevel: testVariables?.experienceLevel || "Intermediate (2-4 yrs)"
    };
    Object.assign(defaults, valueMap);
    Object.keys(defaults).forEach(k => {
      if (!varNames.includes(k)) varNames.push(k);
    });

    // Render interpolations in prompt sections
    const renderSection = (text = "") => {
      if (!text) return "";
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const lower = key.toLowerCase();
        return defaults[lower] !== undefined ? defaults[lower] : (defaults[key] !== undefined ? defaults[key] : match);
      });
    };

    const renderedSystemInstruction = renderSection(prompt.systemInstruction);
    const renderedContext = renderSection(prompt.context);
    const renderedRules = renderSection(prompt.rules);
    const renderedOutputFormat = renderSection(prompt.outputFormat);
    const renderedValidation = renderSection(prompt.validationRulesText);

    const fullCompiledPrompt = [
      renderedSystemInstruction,
      "\n### EVALUATION CONTEXT & METADATA ###",
      renderedContext,
      "\n### STRICT GENERATION RULES ###",
      renderedRules,
      "\n### EXPECTED JSON OUTPUT FORMAT ###",
      renderedOutputFormat,
      "\n### VALIDATION ASSURANCE ###",
      renderedValidation
    ].filter(Boolean).join("\n");

    // Resolve Provider from Runtime Configuration Abstraction (Refinement 6, 7)
    const provider = providerOverride || "Groq";
    const model = "llama-3.3-70b-versatile"; // Runtime Managed target

    // Construct Runtime Request Body Preview
    const preparedRuntimePayload = {
      targetProvider: provider,
      targetModel: model,
      temperature: 0.65,
      top_p: 0.9,
      max_tokens: 2500,
      timeout_ms: 7000,
      messages: [
        { role: "system", content: fullCompiledPrompt },
        { role: "user", content: `Generate exactly ${defaults.questioncount} assessment items adhering strictly to the linked Output Schema.` }
      ],
      response_format: { type: "json_object" }
    };

    // Evaluate Prompt against Validation Levels (Basic, Advanced, Strict - Refinement 9)
    const validationDiagnostics = runtimeResolver.evaluateValidationLevel(
      prompt,
      varNames,
      outputSchema,
      validationLevel
    );

    // Expected Response Format Schematic (Refinement 1 & 12: Zero sample questions or fake answers)
    const expectedResponseStructure = {
      format: outputSchema.expectedResponseFormat || "JSON Array of Assessment Objects",
      schemaSpecification: outputSchema.jsonSchemaString || "[]",
      notice: "Phase 4.1 Architecture Preview: Simulated sample question generation has been permanently eliminated. Live question inference is strictly reserved for Phase 5."
    };

    res.json({
      success: true,
      architectureMode: "Phase 4.1 AI Runtime Decoupled Preview",
      message: "⚡ Phase 4.1 Runtime Verification: Prompt rendered, variables resolved, and schema validated without fake question generation or API calls.",
      previewResult: {
        blueprintName: blueprint?.name || "Custom Blueprint",
        selectedProvider: provider,
        selectedModel: model,
        resolvedVariables: defaults,
        resolvedPrompt: {
          systemInstruction: renderedSystemInstruction,
          context: renderedContext,
          rules: renderedRules,
          outputFormat: renderedOutputFormat,
          validationRules: renderedValidation,
          fullCompiledInstruction: fullCompiledPrompt
        },
        preparedRuntimePayload,
        expectedResponseStructure,
        validationStatus: validationDiagnostics
      }
    });
  } catch (err) {
    console.error("Error building Phase 4.1 runtime architecture preview:", err);
    res.status(500).json({ success: false, message: "Error constructing runtime architecture preview payload." });
  }
};

/**
 * 11. VALIDATE BLUEPRINT DRAFT
 * POST /api/admin/assessment/blueprints/validate
 */
exports.validateBlueprint = (req, res) => {
  try {
    const blueprintData = req.body;
    const health = evaluatePromptHealth(blueprintData);
    res.json({
      success: true,
      validation: health
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error running prompt validation." });
  }
};

/**
 * 12. ARCHIVE / DELETE BLUEPRINT
 * DELETE /api/admin/assessment/blueprints/:id
 */
exports.deleteBlueprint = async (req, res) => {
  try {
    const { id } = req.params;
    const bp = await AssessmentAIBlueprint.findById(id);
    if (!bp) {
      return res.status(404).json({ success: false, message: "Blueprint not found." });
    }

    // Instead of hard deleting, transition to Archived status unless it's a draft
    bp.status = "Archived";
    bp.isActive = false;
    bp.updatedBy = req.user?.name || "Admin";
    await bp.save();

    res.json({
      success: true,
      message: `Blueprint "${bp.name}" archived successfully without losing version history.`,
      data: bp
    });
  } catch (err) {
    console.error("Error archiving blueprint:", err);
    res.status(500).json({ success: false, message: "Server error archiving blueprint." });
  }
};
