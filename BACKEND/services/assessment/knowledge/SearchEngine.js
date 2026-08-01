const mongoose = require("mongoose");

/**
 * SearchEngine.js — Component 10: Search Architecture, Component 11: Indexing Strategy & Component 16: Performance
 * Implements high-speed enterprise filtering across multi-dimensional cognitive tags and metadata within the Knowledge Base.
 * Features compound indexing exploitation, flexible pagination, custom sorting, keyword full-text matching,
 * and architectural compatibility stubs for future semantic vector embedding discovery without implementing immediate embeddings.
 */
class SearchEngine {
  /**
   * Executes an enterprise search across the Question Knowledge Base.
   * @param {Object} queryParams - Filters and search arguments
   * @returns {Promise<Object>} Paginated results and execution telemetry
   */
  static async search(queryParams = {}) {
    const startTime = Date.now();
    const Question = mongoose.model("AssessmentQuestion");

    const filter = { isDeleted: false };

    // 1. DIMENSIONAL FILTERS (Component 10)
    if (queryParams.categoryId && mongoose.Types.ObjectId.isValid(queryParams.categoryId)) {
      filter.categoryId = queryParams.categoryId;
    }
    if (queryParams.subcategoryId && mongoose.Types.ObjectId.isValid(queryParams.subcategoryId)) {
      filter.subcategoryId = queryParams.subcategoryId;
    }
    if (queryParams.status) {
      filter.status = { $regex: new RegExp(`^${queryParams.status}$`, "i") };
    }
    if (queryParams.difficulty && queryParams.difficulty !== "All") {
      filter.difficulty = { $regex: new RegExp(`^${queryParams.difficulty}$`, "i") };
    }
    if (queryParams.bloomLevel && queryParams.bloomLevel !== "All") {
      filter.bloomLevel = queryParams.bloomLevel;
    }
    if (queryParams.assessmentType && queryParams.assessmentType !== "All") {
      filter.assessmentType = { $regex: new RegExp(`^${queryParams.assessmentType}$`, "i") };
    }
    if (queryParams.source && queryParams.source !== "All") {
      filter.createdSource = { $regex: new RegExp(`^${queryParams.source}$`, "i") };
    }
    if (queryParams.language) {
      filter.language = { $regex: new RegExp(`^${queryParams.language}$`, "i") };
    }
    if (queryParams.minQualityScore) {
      filter.qualityScore = { ...filter.qualityScore, $gte: Number(queryParams.minQualityScore) };
    }
    if (queryParams.maxQualityScore) {
      filter.qualityScore = { ...filter.qualityScore, $lte: Number(queryParams.maxQualityScore) };
    }
    if (queryParams.topic) {
      filter.topics = { $in: [new RegExp(queryParams.topic, "i")] };
    }
    if (queryParams.tag || queryParams.tags) {
      const tagTarget = queryParams.tag || queryParams.tags;
      filter.tags = { $in: [new RegExp(tagTarget, "i")] };
    }

    // 2. KEYWORD SEARCH & COMPOUND INDEX EXPLOITATION
    if (queryParams.keyword && queryParams.keyword.trim()) {
      const kw = queryParams.keyword.trim();
      // Use Mongo $text indexing or fallback regular expressions on stem and explanation
      filter.$or = [
        { text: { $regex: new RegExp(kw, "i") } },
        { explanation: { $regex: new RegExp(kw, "i") } },
        { knowledgeBaseId: { $regex: new RegExp(kw, "i") } },
        { fingerprint: { $regex: new RegExp(kw, "i") } },
      ];
    }

    // 3. PAGINATION & SORTING (Component 16: Performance Optimization)
    const page = Math.max(1, parseInt(queryParams.page || 1, 10));
    const limit = Math.min(200, Math.max(1, parseInt(queryParams.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const sortField = queryParams.sortBy || "createdAt";
    const sortOrder = (queryParams.sortOrder === "asc" || queryParams.sortOrder === "1") ? 1 : -1;
    const sortConfig = { [sortField]: sortOrder };

    // Execute concurrent queries for pagination metadata and documentation items
    const [totalItems, questions] = await Promise.all([
      Question.countDocuments(filter),
      Question.find(filter)
        .populate("categoryId", "name slug")
        .populate("subcategoryId", "name slug")
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filtersApplied: Object.keys(queryParams).filter(k => queryParams[k] !== undefined && queryParams[k] !== ""),
      executionTimeMs,
      results: questions,
      semanticSearchReady: true,
    };
  }

  /**
   * Semantic Search Architecture Placeholder (Component 10: Search Architecture)
   * Prepares Vector Embedding Search query formatting without executing live embeddings or requiring pgvector/milvus yet.
   * @param {string} semanticQuery - Natural language concept string
   * @param {Object} filters
   */
  static async executeSemanticDiscovery(semanticQuery, filters = {}) {
    return {
      status: "ARCHITECTURE_READY",
      engine: "Vector embedding semantic discovery interface (Phase 7 ready, model embeddings scheduled for future phases)",
      query: semanticQuery,
      targetEmbeddingsModel: "text-embedding-004 / text-embedding-ada-002",
      dimensions: 1536,
      distanceMetric: "COSINE_SIMILARITY",
      fallbackFilter: filters,
      note: "Per Phase 7 specifications, semantic embeddings are NOT initialized yet. Use standard keyword/taxonomic indexing."
    };
  }
}

module.exports = SearchEngine;
