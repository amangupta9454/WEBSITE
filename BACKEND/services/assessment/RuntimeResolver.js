/**
 * Assessment Runtime Blueprint Resolver Service (Phase 4.1 — Refinement 3, 7, 9, 10, 12)
 * Responsible ONLY for resolving runtime execution context, evaluating prompt health across strict validation levels,
 * generating dependency graphs, and previewing runtime payloads.
 * IMPORTANT: NO Groq calls or external AI execution happen here. Actual AI inference belongs entirely to Phase 5.
 */

const AssessmentConfig = require("../../models/assessment/AssessmentConfig");
const AssessmentAIBlueprint = require("../../models/assessment/AssessmentAIBlueprint");
const AssessmentBlueprintAssignment = require("../../models/assessment/AssessmentBlueprintAssignment");
const AssessmentVariableLibrary = require("../../models/assessment/AssessmentVariableLibrary");
const AssessmentSchemaLibrary = require("../../models/assessment/AssessmentSchemaLibrary");
const AssessmentPromptSection = require("../../models/assessment/AssessmentPromptSection");
const AssessmentRuntimeConfig = require("../../models/assessment/AssessmentRuntimeConfig");

class RuntimeResolver {
  /**
   * Resolves hierarchical runtime configuration: Global -> Category -> Subcategory -> Assessment Override
   * @param {Object} query - { subcategoryId, categoryId, assessmentId }
   */
  async resolveRuntimeProviderConfig({ subcategoryId, categoryId, assessmentId }) {
    // Attempt Assessment override
    if (assessmentId) {
      const assessmentOverride = await AssessmentRuntimeConfig.findOne({
        scope: "Assessment",
        assessmentId,
        status: "Active"
      });
      if (assessmentOverride) return { config: assessmentOverride, resolvedScope: "Assessment Override" };
    }

    // Attempt Subcategory override
    if (subcategoryId) {
      const subOverride = await AssessmentRuntimeConfig.findOne({
        scope: "Subcategory",
        subcategoryId,
        status: "Active"
      });
      if (subOverride) return { config: subOverride, resolvedScope: "Subcategory Override" };
    }

    // Attempt Category override
    if (categoryId) {
      const catOverride = await AssessmentRuntimeConfig.findOne({
        scope: "Category",
        categoryId,
        status: "Active"
      });
      if (catOverride) return { config: catOverride, resolvedScope: "Category Override" };
    }

    // Fallback to Global default
    let globalConfig = await AssessmentRuntimeConfig.findOne({ scope: "Global", status: "Active" });
    if (!globalConfig) {
      // Return architecture default in memory if not seeded yet
      globalConfig = {
        scope: "Global",
        primaryProvider: "Groq",
        modelName: "llama-3.1-8b-instant",
        fallbackProviders: [],
        temperature: 0.65,
        topP: 0.9,
        maxTokens: 2500,
        requestTimeoutMs: 7000, // Strict 7-second AI SLA boundary
        retryAttempts: 2
      };
    }

    return { config: globalConfig, resolvedScope: "Global Provider Default" };
  }

  /**
   * Resolves Blueprint assignment routing: Subcategory Assignment -> Category -> Global -> Direct fallback
   */
  async resolveBlueprintAssignment({ subcategoryId, categoryId, assessmentType = "All", fallbackBlueprintId }) {
    let assignment = null;
    let resolvedScope = "Subcategory Assignment";

    if (subcategoryId) {
      assignment = await AssessmentBlueprintAssignment.findOne({
        subcategoryId,
        status: "Active"
      }).populate("assignedBlueprints.blueprintId");
    }

    if (!assignment && categoryId) {
      assignment = await AssessmentBlueprintAssignment.findOne({
        categoryId,
        subcategoryId: null,
        status: "Active"
      }).populate("assignedBlueprints.blueprintId");
      resolvedScope = "Category Assignment";
    }

    if (!assignment) {
      assignment = await AssessmentBlueprintAssignment.findOne({
        isGlobalDefault: true,
        status: "Active"
      }).populate("assignedBlueprints.blueprintId");
      resolvedScope = "Global Assignment Default";
    }

    // Find highest priority blueprint matching assessmentType
    let selectedBlueprint = null;
    if (assignment && assignment.assignedBlueprints && assignment.assignedBlueprints.length > 0) {
      const activeMappings = assignment.assignedBlueprints
        .filter(m => m.status === "Active" && (m.assessmentType === assessmentType || m.assessmentType === "All"))
        .sort((a, b) => a.priority - b.priority);

      if (activeMappings.length > 0 && activeMappings[0].blueprintId) {
        selectedBlueprint = activeMappings[0].blueprintId;
      }
    }

    // If no explicit assignment found, fall back to direct blueprintId or subcategory's primary blueprint
    if (!selectedBlueprint && fallbackBlueprintId) {
      selectedBlueprint = await AssessmentAIBlueprint.findById(fallbackBlueprintId);
      resolvedScope = "Direct Blueprint Override";
    }

    if (!selectedBlueprint && subcategoryId) {
      selectedBlueprint = await AssessmentAIBlueprint.findOne({ subcategoryId, status: "Active" });
      resolvedScope = "Legacy Direct Subcategory Association";
    }

    return { assignment, selectedBlueprint, resolvedScope };
  }

  /**
   * Refinement 9: Validation Levels (Basic, Advanced, Strict)
   */
  evaluateValidationLevel(promptData, variablesUsed, outputSchemaData, validationLevel = "Strict") {
    const diagnostics = {
      level: validationLevel,
      passed: true,
      score: 100,
      checks: [],
      errors: [],
      warnings: []
    };

    const sysInst = promptData.systemInstruction || "";
    const totalPromptLength = (sysInst + (promptData.context || "") + (promptData.rules || "")).length;

    // 1. Basic Validation: Prompt existence & non-empty
    if (!sysInst.trim()) {
      diagnostics.passed = false;
      diagnostics.score -= 40;
      diagnostics.errors.push("System instruction is missing or blank.");
      diagnostics.checks.push({ name: "Prompt Non-Empty Check", status: "FAILED", level: "Basic" });
    } else {
      diagnostics.checks.push({ name: "Prompt Non-Empty Check", status: "PASSED", level: "Basic" });
    }

    // If only Basic requested, return early
    if (validationLevel === "Basic") {
      diagnostics.score = Math.max(0, diagnostics.score);
      return diagnostics;
    }

    // 2. Advanced Validation: Output schema presence & JSON compatibility
    if (!outputSchemaData || !outputSchemaData.jsonSchemaString || !outputSchemaData.jsonSchemaString.trim()) {
      diagnostics.passed = false;
      diagnostics.score -= 30;
      diagnostics.errors.push("Output schema is completely unassigned or empty.");
      diagnostics.checks.push({ name: "Output Schema Binding Check", status: "FAILED", level: "Advanced" });
    } else {
      try {
        JSON.parse(outputSchemaData.jsonSchemaString);
        diagnostics.checks.push({ name: "JSON Schema Compatibility Check", status: "PASSED", level: "Advanced" });
      } catch (e) {
        diagnostics.passed = false;
        diagnostics.score -= 25;
        diagnostics.errors.push(`JSON schema syntax is invalid: ${e.message}`);
        diagnostics.checks.push({ name: "JSON Schema Compatibility Check", status: "FAILED", level: "Advanced" });
      }
    }

    if (validationLevel === "Advanced") {
      diagnostics.score = Math.max(0, diagnostics.score);
      return diagnostics;
    }

    // 3. Strict Validation: Length, Duplicate Variables, Missing Sections, Variable Declarations
    if (totalPromptLength < 50) {
      diagnostics.passed = false;
      diagnostics.score -= 20;
      diagnostics.errors.push(`Total prompt length is only ${totalPromptLength} chars (Strict minimum is 50 chars).`);
      diagnostics.checks.push({ name: "Strict Prompt Length (>= 50 chars)", status: "FAILED", level: "Strict" });
    } else {
      diagnostics.checks.push({ name: "Strict Prompt Length (>= 50 chars)", status: "PASSED", level: "Strict" });
    }

    // Check duplicate variables
    const seenVars = new Set();
    let duplicatesFound = false;
    for (const v of variablesUsed) {
      if (seenVars.has(v)) {
        duplicatesFound = true;
        diagnostics.errors.push(`Duplicate variable declaration detected: {{${v}}}.`);
      }
      seenVars.add(v);
    }
    if (duplicatesFound) {
      diagnostics.passed = false;
      diagnostics.score -= 15;
      diagnostics.checks.push({ name: "No Duplicate Variables Check", status: "FAILED", level: "Strict" });
    } else {
      diagnostics.checks.push({ name: "No Duplicate Variables Check", status: "PASSED", level: "Strict" });
    }

    // Check mandatory structural sections in prompt
    const requiredKeywords = ["generate", "json", "question"];
    const lowercasePrompt = (sysInst + " " + (promptData.outputFormat || "")).toLowerCase();
    const missingKeywords = requiredKeywords.filter(k => !lowercasePrompt.includes(k));
    if (missingKeywords.length > 0) {
      diagnostics.warnings.push(`Strict guidance recommends including core evaluation terms: ${missingKeywords.join(", ")}.`);
      diagnostics.score -= 10;
      diagnostics.checks.push({ name: "Core Structural Vocabulary Check", status: "WARNING", level: "Strict" });
    } else {
      diagnostics.checks.push({ name: "Core Structural Vocabulary Check", status: "PASSED", level: "Strict" });
    }

    diagnostics.score = Math.max(0, diagnostics.score);
    if (diagnostics.score < 60) diagnostics.passed = false;

    return diagnostics;
  }

  /**
   * Refinements 1, 3, 10, 12: Resolves runtime context, builds dependency graph & runtime payload preview WITHOUT fake questions
   */
  async resolveRuntimeContext({
    blueprintId,
    subcategoryId,
    categoryId,
    assessmentId,
    assessmentType = "MCQ",
    testVariables = {},
    validationLevel = "Strict"
  }) {
    // 1. Resolve Assessment Configuration
    let config = null;
    if (subcategoryId) config = await AssessmentConfig.findOne({ subcategoryId });
    if (!config && categoryId) config = await AssessmentConfig.findOne({ categoryId });

    // 2. Resolve Blueprint Assignment & Latest Active Blueprint Version
    let { assignment, selectedBlueprint, resolvedScope: assignmentScope } = await this.resolveBlueprintAssignment({
      subcategoryId,
      categoryId,
      assessmentType,
      fallbackBlueprintId: blueprintId
    });

    let versionNumber = 1;
    let versionData = {};
    let promptData = {};

    if (!selectedBlueprint) {
      // Automatic Fallback: If admin hasn't configured a blueprint, use a smart system default!
      console.warn("[RuntimeResolver] No active blueprint found. Using automatic system fallback blueprint.");
      selectedBlueprint = {
        _id: "auto-fallback-blueprint",
        name: "System Fallback AI Blueprint",
        activeVersion: 1,
        status: "Active"
      };
      promptData = {
        systemInstruction: "You are an expert technical assessor. Generate {{questionCount}} multiple choice questions for the {{category}} domain.",
        context: "The candidate is taking a professional assessment. Ensure questions are challenging and accurate.",
        rules: "1. Return strictly valid JSON array of objects.\n2. Ensure exactly 4 options per question.\n3. Make sure the correct index is between 0 and 3.\n4. Every object MUST contain these exact keys: 'question', 'options', 'correctIndex', 'explanation', 'topic', 'difficulty'.",
        outputFormat: "JSON Array of Question objects.",
        validationRulesText: ""
      };
    } else {
      versionNumber = selectedBlueprint.activeVersion || 1;
      versionData = selectedBlueprint.versions?.find(v => v.versionNumber === versionNumber) || 
                         selectedBlueprint.versions?.[selectedBlueprint.versions?.length - 1] || {};

      promptData = versionData.prompt || {
        systemInstruction: selectedBlueprint.systemPrompt || "",
        context: "",
        rules: "",
        outputFormat: "",
        validationRulesText: ""
      };
    }

    // 3. Resolve Shared Variable Library References (Refinement 4)
    let resolvedVariables = [];
    if (versionData.variableRefs && versionData.variableRefs.length > 0) {
      resolvedVariables = await AssessmentVariableLibrary.find({ _id: { $in: versionData.variableRefs } });
    }
    // If no shared variable refs, use local fallback or load all system defaults from library
    if (resolvedVariables.length === 0) {
      resolvedVariables = await AssessmentVariableLibrary.find({ isSystemDefault: true });
      if (resolvedVariables.length === 0 && versionData.variables) {
        resolvedVariables = versionData.variables; // Fallback to local snapshot
      }
    }

    // Build variable substitution map
    const varMap = {};
    const varNamesList = [];
    resolvedVariables.forEach(v => {
      varNamesList.push(v.name);
      varMap[v.name] = testVariables[v.name] !== undefined ? testVariables[v.name] : (v.defaultValue || `[${v.name}]`);
    });
    // Ensure standard test overrides are respected
    Object.keys(testVariables).forEach(k => {
      varMap[k] = testVariables[k];
      if (!varNamesList.includes(k)) varNamesList.push(k);
    });

    // 4. Resolve Shared Output Schema (Refinement 5)
    let resolvedOutputSchema = null;
    if (versionData.outputSchemaRef) {
      resolvedOutputSchema = await AssessmentSchemaLibrary.findById(versionData.outputSchemaRef);
    }
    if (!resolvedOutputSchema) {
      // Attempt matching by assessmentType from Schema Library
      resolvedOutputSchema = await AssessmentSchemaLibrary.findOne({ assessmentType, status: "Active" });
    }
    if (!resolvedOutputSchema) {
      // Fallback to blueprint's snapshot schema
      resolvedOutputSchema = versionData.outputSchema || {
        schemaDefinitions: [],
        jsonSchemaString: "[]",
        expectedResponseFormat: "JSON Array"
      };
    }

    // 5. Resolve Runtime Provider Configuration (Refinement 7)
    const { config: runtimeProviderConfig, resolvedScope: runtimeProviderScope } = await this.resolveRuntimeProviderConfig({
      subcategoryId,
      categoryId,
      assessmentId
    });

    // 6. Assemble & Interpolate Reusable Prompt Sections (Refinement 8)
    let systemText = promptData.systemInstruction || "";
    let contextText = promptData.context || "";
    let rulesText = promptData.rules || "";
    let outputText = promptData.outputFormat || "";

    // Replace {{variable}} tokens
    const replaceTokens = (str) => {
      if (!str) return "";
      return str.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
        return varMap[p1] !== undefined ? varMap[p1] : match;
      });
    };

    const resolvedPrompt = {
      systemInstruction: replaceTokens(systemText),
      context: replaceTokens(contextText),
      rules: replaceTokens(rulesText),
      outputFormat: replaceTokens(outputText),
      fullCompiledInstruction: `${replaceTokens(systemText)}\n\n${replaceTokens(contextText)}\n\nRULES:\n${replaceTokens(rulesText)}\n\nOUTPUT FORMAT:\n${replaceTokens(outputText)}\n\nEXPECTED JSON SCHEMA:\n${resolvedOutputSchema.jsonSchemaString}`
    };

    // 7. Evaluate Validation Level (Refinement 9)
    const validationDiagnostics = this.evaluateValidationLevel(
      promptData,
      varNamesList,
      resolvedOutputSchema,
      validationLevel
    );

    // 8. Construct Prompt Dependency Graph (Refinement 10)
    const dependencyGraph = {
      nodes: [
        { id: "blueprint", label: `Blueprint: ${selectedBlueprint.name} (v${versionNumber})`, type: "blueprint", status: selectedBlueprint.status },
        { id: "assignment", label: `Assignment Layer: ${assignmentScope}`, type: "assignment", status: "Active" },
        { id: "variables", label: `Shared Variables: ${resolvedVariables.length} library items linked`, type: "variables", status: "Active" },
        { id: "schema", label: `Output Schema: ${resolvedOutputSchema.name || assessmentType + " Schema"}`, type: "schema", status: "Active" },
        { id: "assessment_config", label: `Assessment Config: ${config ? "Custom Rules (" + config.totalQuestions + " Qs, " + config.durationMinutes + "m)" : "System Baseline"}`, type: "config", status: "Active" },
        { id: "runtime_config", label: `Runtime Override: ${runtimeProviderScope}`, type: "runtime", status: "Active" },
        { id: "provider", label: `Provider: ${runtimeProviderConfig.primaryProvider} (${runtimeProviderConfig.modelName})`, type: "provider", status: "Active" }
      ],
      edges: [
        { from: "assessment_config", to: "assignment", label: "Resolves Assignment" },
        { from: "assignment", to: "blueprint", label: "Selects Active Version" },
        { from: "variables", to: "blueprint", label: "Injects {{Tokens}}" },
        { from: "schema", to: "blueprint", label: "Enforces Output Format" },
        { from: "blueprint", to: "runtime_config", label: "Requests Execution" },
        { from: "runtime_config", to: "provider", label: "Routes to API Pool" }
      ]
    };

    // 9. Construct Runtime Payload Preview (Refinement 12 - strictly NO fake questions generated!)
    const preparedRuntimePayload = {
      targetProvider: runtimeProviderConfig.primaryProvider,
      model: runtimeProviderConfig.modelName,
      temperature: runtimeProviderConfig.temperature,
      top_p: runtimeProviderConfig.topP,
      max_tokens: runtimeProviderConfig.maxTokens,
      timeout_ms: runtimeProviderConfig.requestTimeoutMs,
      messages: [
        {
          role: "system",
          content: resolvedPrompt.fullCompiledInstruction
        },
        {
          role: "user",
          content: `Generate assessment batch adhering strictly to the above blueprint configuration and JSON schema.`
        }
      ],
      response_format: { type: "json_object" }
    };

    const expectedResponseStructure = {
      format: resolvedOutputSchema.expectedResponseFormat || "JSON Array",
      schemaSpecification: resolvedOutputSchema.jsonSchemaString,
      note: "Architecture Preview ONLY. Zero API execution or fake generated questions. Actual AI inference belongs entirely to Phase 5."
    };

    return {
      success: true,
      architectureVersion: "Phase 4.1 AI Runtime Decoupled Architecture",
      blueprint: {
        id: selectedBlueprint._id,
        name: selectedBlueprint.name,
        activeVersion: versionNumber,
        status: selectedBlueprint.status
      },
      resolvedVariables: varMap,
      resolvedPrompt,
      selectedSchema: {
        id: resolvedOutputSchema._id || "inline-snapshot",
        name: resolvedOutputSchema.name || `${assessmentType} Schema`,
        assessmentType: resolvedOutputSchema.assessmentType || assessmentType
      },
      selectedRuntimeProvider: {
        provider: runtimeProviderConfig.primaryProvider,
        model: runtimeProviderConfig.modelName,
        scope: runtimeProviderScope,
        timeoutMs: runtimeProviderConfig.requestTimeoutMs,
        fallbacks: runtimeProviderConfig.fallbackProviders || []
      },
      validationStatus: validationDiagnostics,
      preparedRuntimePayload,
      expectedResponseStructure,
      dependencyGraph
    };
  }

  async resolveRuntimePreview(params) {
    return this.resolveRuntimeContext(params);
  }
}

module.exports = new RuntimeResolver();
