const mongoose = require("mongoose");

// Schema for individual dynamic variables in the blueprint (Legacy/Local cache)
const promptVariableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  defaultValue: { type: String, default: "" },
  required: { type: Boolean, default: true },
  description: { type: String, default: "" },
}, { _id: false });

// Schema for individual field definitions in the Output Schema Builder (Legacy/Local cache)
const schemaDefinitionSchema = new mongoose.Schema({
  field: { type: String, required: true },
  type: { type: String, required: true, default: "string" },
  required: { type: Boolean, default: true },
  description: { type: String, default: "" },
}, { _id: false });

// Schema for custom validation rules
const validationRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rule: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  description: { type: String, default: "" },
}, { _id: false });

// Schema for historical versions of the blueprint
const blueprintVersionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  prompt: {
    systemInstruction: { type: String, default: "" },
    context: { type: String, default: "" },
    rules: { type: String, default: "" },
    outputFormat: { type: String, default: "" },
    validationRulesText: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  // Phase 4.1 Refinements 4, 5, 8: Reusable Library References
  variableRefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssessmentVariableLibrary"
  }],
  outputSchemaRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssessmentSchemaLibrary",
    default: null
  },
  sectionRefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssessmentPromptSection"
  }],
  // Local variable/schema snapshots for immutable auditing
  variables: { type: [promptVariableSchema], default: [] },
  outputSchema: {
    schemaDefinitions: { type: [schemaDefinitionSchema], default: [] },
    jsonSchemaString: { type: String, default: "" },
  },
  validationRules: { type: [validationRuleSchema], default: [] },
  validationLevel: {
    type: String,
    enum: ["Basic", "Advanced", "Strict"],
    default: "Strict"
  },
  notes: { type: String, default: "" }, // Version commit notes
  createdBy: { type: String, default: "Admin" },
  status: { type: String, enum: ["Active", "Draft", "Archived"], default: "Active" },
}, { timestamps: true });

// Main AI Blueprint Schema
const assessmentAIBlueprintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Standard AI Blueprint",
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentCategory",
      required: false,
      index: true,
    },
    // Note: Direct attachment is deprecated in Phase 4.1 in favor of AssessmentBlueprintAssignment hierarchy (Refinement 2)
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      required: false,
      index: true,
    },
    description: {
      type: String,
      default: "Production AI Prompt Blueprint governing structured question synthesis and architecture validation.",
    },
    // Phase 4.1 Refinement 6: Provider Abstraction
    // Provider selection is decoupled from Blueprint logic and handled by Runtime Configuration.
    // Kept as optional legacy fallback.
    provider: {
      type: String,
      enum: ["Groq", "OpenAI", "Gemini", "Claude", "Custom", "Runtime Resolver"],
      default: "Runtime Resolver",
      index: true,
    },
    providerModel: {
      type: String,
      default: "Runtime Managed", // Model selection governed by AssessmentRuntimeConfig in Phase 4.1
    },
    activeVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
      index: true,
    },
    tags: {
      type: [String],
      default: ["AI", "Production", "v1", "Decoupled Runtime"],
      index: true,
    },
    // Phase 4.1 Refinements 4, 5, 8, 9: Shared Libraries & Validation Level
    variableRefs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentVariableLibrary"
    }],
    outputSchemaRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSchemaLibrary",
      default: null
    },
    sectionRefs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentPromptSection"
    }],
    validationLevel: {
      type: String,
      enum: ["Basic", "Advanced", "Strict"],
      default: "Strict",
      index: true
    },
    // For standalone reusable templates
    isTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
    templateCategory: {
      type: String,
      enum: [
        "Programming",
        "DSA",
        "Aptitude",
        "Database",
        "Operating System",
        "Computer Networks",
        "Web Development",
        "AI",
        "Cloud",
        "Cyber Security",
        "General",
      ],
      default: "General",
    },
    createdBy: {
      type: String,
      default: "Admin",
    },
    updatedBy: {
      type: String,
      default: "Admin",
    },
    // Phase 4.1 Refinement 11: Blueprint Analytics Separation
    // Strictly tracks Blueprint lifecycle only; latency, token usage, and inference success belong to Phase 5 Runtime Analytics.
    analytics: {
      versionCount: { type: Number, default: 1 },
      activationCount: { type: Number, default: 1 },
      usageCount: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
      validationStatus: {
        type: String,
        enum: ["Verified (100%)", "Healthy", "Warning", "Failed", "Pending"],
        default: "Verified (100%)"
      },
      // Legacy properties maintained to prevent schema errors during transition
      totalUses: { type: Number, default: 0 },
      lastUsed: { type: Date, default: null },
      averageResponseTime: { type: Number, default: 0 },
      averageTokens: { type: Number, default: 0 },
      successfulRuns: { type: Number, default: 0 },
      failedRuns: { type: Number, default: 0 },
      currentSuccessRate: { type: Number, default: 100 }
    },
    // Array of immutable historical versions
    versions: {
      type: [blueprintVersionSchema],
      default: [],
    },
    // Legacy fields maintained for backwards compatibility with earlier phase wizards & controllers
    systemPrompt: {
      type: String,
      default: "",
    },
    topics: {
      type: [String],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdatedBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to get the full currently active version object
assessmentAIBlueprintSchema.virtual("currentVersionData").get(function () {
  if (!this.versions || this.versions.length === 0) return null;
  return (
    this.versions.find((v) => v.versionNumber === this.activeVersion) ||
    this.versions[this.versions.length - 1]
  );
});

// Pre-save middleware to guarantee Version 1 initialization and synchronization with legacy fields & analytics
assessmentAIBlueprintSchema.pre("save", function (next) {
  // Sync legacy status flags
  if (this.status === "Active") {
    this.isActive = true;
  } else {
    this.isActive = false;
  }
  this.version = this.activeVersion;

  // Phase 4.1 Analytics Sync
  if (this.analytics) {
    this.analytics.versionCount = this.versions ? this.versions.length : 1;
    this.analytics.lastUpdated = new Date();
  }

  // If this document has no versions array (e.g. newly created by Category Wizard or legacy doc)
  if (!this.versions || this.versions.length === 0) {
    const baselineSystemPrompt =
      this.systemPrompt ||
      `You are an expert AI technical evaluator and exam architect. Your task is to synthesize rigorous, high-accuracy assessment questions tailored to the targeted candidate expertise.`;

    const defaultVariables = [
      { name: "category", defaultValue: "Technical Assessment", required: true, description: "Master subject domain" },
      { name: "subcategory", defaultValue: "Core Concepts", required: true, description: "Specialized technology domain" },
      { name: "difficulty", defaultValue: "Medium", required: true, description: "Targeted evaluation difficulty (Easy/Medium/Hard/Expert)" },
      { name: "questionCount", defaultValue: "5", required: true, description: "Rolling batch item count" },
      { name: "topics", defaultValue: (this.topics || ["Core Architecture", "Best Practices"]).join(", "), required: true, description: "Required focal subtopics" },
      { name: "language", defaultValue: "English", required: false, description: "Output presentation language" },
      { name: "assessmentType", defaultValue: "MCQ", required: true, description: "Evaluation modality selector" },
      { name: "experienceLevel", defaultValue: "Intermediate", required: false, description: "Target candidate proficiency level" },
    ];

    const defaultSchemaDefs = [
      { field: "question", type: "string", required: true, description: "Clear, unequivocal technical question stem" },
      { field: "options", type: "array of 4 strings", required: true, description: "Exhaustive candidate choices labeled A, B, C, D" },
      { field: "correctIndex", type: "number (0-3)", required: true, description: "Exact 0-based array index of the correct option" },
      { field: "explanation", type: "string", required: true, description: "Detailed architectural justification and concept proof" },
      { field: "topic", type: "string", required: true, description: "Specific technical subtopic assessed" },
      { field: "difficulty", type: "string", required: true, description: "Validated difficulty level (easy, medium, hard, expert)" },
      { field: "tags", type: "array of strings", required: false, description: "Metadata taxonomy tags" },
    ];

    const defaultJsonSchemaString = `[
  {
    "question": "An example technical evaluation stem?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation justifying why Option A is correct and why distractors fail.",
    "topic": "Core Architecture",
    "difficulty": "medium",
    "tags": ["concept", "syntax"]
  }
]`;

    const defaultValidationRules = [
      { name: "No Duplicate Options", rule: "unique_options", enabled: true, description: "Enforces all 4 candidate options are textually unique." },
      { name: "Minimum Explanation Depth", rule: "min_explanation_length_25", enabled: true, description: "Requires analytical explanations of at least 25 characters." },
      { name: "Strict JSON Schema Conformity", rule: "valid_json_schema", enabled: true, description: "Rejects any response failing exact JSON schema typing." },
      { name: "Topic Alignment Assurance", rule: "topic_match_verification", enabled: true, description: "Ensures generated questions explicitly evaluate requested topics." },
    ];

    this.versions = [
      {
        versionNumber: 1,
        prompt: {
          systemInstruction: baselineSystemPrompt,
          context: `Candidate Evaluation Blueprint for domain: {{subcategory}} under {{category}}. Targeted proficiency: {{experienceLevel}}. Assessment mode: {{assessmentType}}.`,
          rules: `1. Generate exactly {{questionCount}} high-quality items matching difficulty: {{difficulty}}.\n2. Do NOT refer to prior questions or include introductory chat conversational text.\n3. All distractors must be plausible technical misconceptions.\n4. Avoid "All of the above" or "None of the above" unless in Subjective mode.`,
          outputFormat: `Return strictly an unadulterated JSON array adhering to the prescribed Output Schema. Do not wrap in markdown code fences if unsupported.`,
          validationRulesText: `Ensure grammatical flawlessness. Verify correctIndex accurately maps to the mathematically or syntactically correct option.`,
          notes: `Initial baseline AI Blueprint architecture generated automatically during domain setup.`,
        },
        variableRefs: this.variableRefs || [],
        outputSchemaRef: this.outputSchemaRef || null,
        sectionRefs: this.sectionRefs || [],
        variables: defaultVariables,
        outputSchema: {
          schemaDefinitions: defaultSchemaDefs,
          jsonSchemaString: defaultJsonSchemaString,
        },
        validationRules: defaultValidationRules,
        validationLevel: this.validationLevel || "Strict",
        notes: "Initial v1 blueprint creation.",
        createdBy: this.createdBy || "Admin",
        status: this.status || "Active",
      },
    ];
    this.activeVersion = 1;
  } else {
    // Keep top-level legacy systemPrompt synced with active version system instruction for existing readers
    const activeV = this.versions.find((v) => v.versionNumber === this.activeVersion);
    if (activeV && activeV.prompt && activeV.prompt.systemInstruction) {
      this.systemPrompt = activeV.prompt.systemInstruction;
    }
  }

  next();
});

module.exports = mongoose.model("AssessmentAIBlueprint", assessmentAIBlueprintSchema);
