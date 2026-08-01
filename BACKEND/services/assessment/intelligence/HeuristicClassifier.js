/**
 * HeuristicClassifier.js — Components 7, 8, and 9 of the Question Intelligence Engine
 * Implements rule-based algorithmic domain classification, difficulty verification,
 * and Bloom's Taxonomy cognitive stratification without relying on external AI calls.
 */
class HeuristicClassifier {
  constructor() {
    // Component 7: Hierarchical Topic Dictionary
    this.topicDomainHierarchy = [
      {
        domain: "Programming",
        subdomains: [
          { name: "Java", topics: [{ name: "Collections", keywords: ["hashmap", "arraylist", "concurrent", "iterator", "collection", "hashset", "list", "map"] }, { name: "Concurrency", keywords: ["thread", "synchronized", "runnable", "executor", "deadlock", "mutex"] }] },
          { name: "Python", topics: [{ name: "Data Structures", keywords: ["dictionary", "tuple", "list comprehension", "generator", "decorator", "numpy"] }, { name: "OOP & Metaclasses", keywords: ["__init__", "self", "metaclass", "dunder", "inheritance"] }] },
          { name: "Data Structures & Algorithms", topics: [{ name: "Graph & Trees", keywords: ["dijkstra", "binary search tree", "avl", "dfs", "bfs", "adjacency", "heap", "trie"] }, { name: "Dynamic Programming", keywords: ["memoization", "knapsack", "tabulation", "optimal substructure", "dp"] }, { name: "Sorting & Searching", keywords: ["quicksort", "mergesort", "binary search", "pivot", "bubble"] }] }
        ],
        fallbackKeywords: ["class", "method", "variable", "algorithm", "loop", "function", "object", "pointer", "syntax"]
      },
      {
        domain: "Web Development",
        subdomains: [
          { name: "React & Frontend", topics: [{ name: "Hooks & State", keywords: ["useeffect", "usestate", "usecallback", "redux", "state", "props", "virtual dom"] }, { name: "CSS & Responsive Design", keywords: ["flexbox", "grid", "media query", "selector", "responsive", "box-model"] }] },
          { name: "Node.js & Backend", topics: [{ name: "Express & Middleware", keywords: ["req", "res", "middleware", "express", "jwt", "route", "next()"] }, { name: "Asynchronous JS", keywords: ["promise", "async", "await", "event loop", "callback", "non-blocking"] }] }
        ],
        fallbackKeywords: ["html", "http", "api", "browser", "dom", "url", "cors", "session", "cookie", "frontend", "backend"]
      },
      {
        domain: "Database & Storage",
        subdomains: [
          { name: "SQL & Relational", topics: [{ name: "Joins & Indexing", keywords: ["inner join", "outer join", "foreign key", "primary key", "index", "btree", "normalization", "acid", "transaction"] }] },
          { name: "NoSQL & Document Systems", topics: [{ name: "MongoDB & Aggregation", keywords: ["collection", "document", "aggregation pipeline", "$match", "sharding", "replica"] }] }
        ],
        fallbackKeywords: ["query", "table", "database", "schema", "record", "row", "column", "sql"]
      },
      {
        domain: "Aptitude & Logical Reasoning",
        subdomains: [
          { name: "Quantitative Aptitude", topics: [{ name: "Probability & Permutations", keywords: ["probability", "dice", "combination", "permutation", "bayes", "independent event"] }, { name: "Time, Distance & Work", keywords: ["speed", "distance", "train", "work", "hours", "rate", "efficiency"] }, { name: "Percentage & Profit", keywords: ["profit", "loss", "discount", "interest", "compound", "principal", "percentage"] }] },
          { name: "Logical Reasoning", topics: [{ name: "Syllogisms & Logic", keywords: ["all men", "some cats", "conclusion", "premise", "syllogism", "deductive"] }, { name: "Blood Relations & Directions", keywords: ["father", "mother", "sister", "brother", "north", "south", "degrees", "distance"] }] }
        ],
        fallbackKeywords: ["ratio", "average", "logical", "reasoning", "puzzle", "sequence", "series", "next number"]
      },
      {
        domain: "Cloud & CyberSecurity",
        subdomains: [
          { name: "Cloud Architecture", topics: [{ name: "AWS & GCP Systems", keywords: ["ec2", "s3", "lambda", "kubernetes", "docker", "serverless", "iam", "vpc", "load balancer"] }] },
          { name: "CyberSecurity & Encryption", topics: [{ name: "Network Defense & Crypto", keywords: ["xss", "sql injection", "csrf", "tls", "ssl", "rsa", "encryption", "hashing", "firewall", "zero-trust"] }] }
        ],
        fallbackKeywords: ["cloud", "security", "server", "network", "protocol", "deploy", "auth", "access"]
      }
    ];

    // Component 8: Difficulty Heuristics Vocabulary Weighting
    this.difficultyIndicators = {
      Easy: ["what is", "define", "identify", "which of the following", "simple", "basic", "default", "true or false", "name the", "purpose of", "primary function"],
      Medium: ["explain", "compare", "difference between", "how does", "what will be the output", "advantage", "disadvantage", "implement a function", "calculate the", "when would you use"],
      Hard: ["optimize", "concurrency", "deadlock", "time complexity of", "o(n log n)", "memory leak", "race condition", "scale", "bottleneck", "thread safe", "asymptotic", "edge case"],
      Expert: ["design a system", "distributed architecture", "fault tolerant", "consensus algorithm", "high replication", "zero-downtime", "kernel", "metaclass manipulation", "lock-free", "custom memory allocation"]
    };

    // Component 9: Bloom's Taxonomy Cognitive Action Verbs
    this.bloomLevels = [
      { level: "Create", verbs: ["design", "architect", "synthesize", "formulate", "construct", "invent", "develop a new", "generate a custom"], priority: 6 },
      { level: "Evaluate", verbs: ["critique", "evaluate", "judge", "assess", "justify", "recommend", "prioritize", "defend", "validate the choice"], priority: 5 },
      { level: "Analyze", verbs: ["analyze", "differentiate", "debug", "decompose", "inspect", "investigate", "contrast", "break down", "identify the flaw", "why does this error"], priority: 4 },
      { level: "Apply", verbs: ["apply", "calculate", "solve", "implement", "execute", "use", "write code", "modify", "find the output", "determine the value"], priority: 3 },
      { level: "Understand", verbs: ["explain", "compare", "summarize", "interpret", "classify", "describe", "what happens when", "distinguish"], priority: 2 },
      { level: "Remember", verbs: ["list", "recognize", "identify", "define", "state", "name", "what is the default", "which keyword", "mention"], priority: 1 }
    ];
  }

  /**
   * Evaluates topic classification, verified difficulty, and Bloom's cognitive level for a question.
   * 
   * @param {Object} question - Parsed internal question object
   * @param {string} requestedDifficulty - Target difficulty configured in runtime test settings
   * @returns {Object} Classification metadata & verification scores
   */
  classify(question, requestedDifficulty = "Medium") {
    const textToAnalyze = `${question.questionText || ""} ${question.explanation || ""} ${(question.options || []).join(" ")} ${question.topic || ""}`.toLowerCase();

    // 1. Execute Topic Hierarchy Classification (Component 7)
    const topicClassification = this.classifyTopic(textToAnalyze, question.topic);

    // 2. Execute Difficulty Verification & Scoring (Component 8)
    const difficultyVerification = this.verifyDifficulty(textToAnalyze, question.difficulty || requestedDifficulty, question.modality);

    // 3. Execute Bloom's Taxonomy Classification (Component 9)
    const bloomClassification = this.classifyBloomLevel(textToAnalyze, question.questionText || "");

    return {
      topicHierarchy: topicClassification.hierarchy,
      detectedDomain: topicClassification.domain,
      detectedSubtopic: topicClassification.subtopic,
      verifiedDifficulty: difficultyVerification.estimatedLevel,
      difficultyScore: difficultyVerification.difficultyScore,
      difficultyMatch: difficultyVerification.isMatch,
      difficultyNotes: difficultyVerification.notes,
      bloomLevel: bloomClassification.level,
      bloomConfidence: bloomClassification.confidence,
      bloomMatchedVerb: bloomClassification.matchedVerb
    };
  }

  /**
   * Component 7: Hierarchical Topic Discovery via domain & keyword pattern matching.
   */
  classifyTopic(normalizedText, hintedTopic = "") {
    let bestDomain = "General Computer Science";
    let bestSubdomain = "General Technology";
    let bestTopic = hintedTopic || "Core Concepts";
    let highestHits = 0;

    for (const domainObj of this.topicDomainHierarchy) {
      let domainHits = 0;
      for (const kw of domainObj.fallbackKeywords) {
        if (normalizedText.includes(kw)) domainHits++;
      }

      for (const sub of domainObj.subdomains) {
        for (const top of sub.topics) {
          let topicHits = domainHits;
          for (const kw of top.keywords) {
            if (normalizedText.includes(kw)) {
              topicHits += 3; // Weighted priority for granular topic match
            }
          }

          if (topicHits > highestHits && topicHits >= 2) {
            highestHits = topicHits;
            bestDomain = domainObj.domain;
            bestSubdomain = sub.name;
            bestTopic = top.name;
          }
        }
      }
    }

    // If explicit hint provided from Prompt Studio or Parser, blend gracefully
    if (hintedTopic && highestHits === 0) {
      bestTopic = hintedTopic;
      if (hintedTopic.toLowerCase().includes("sql") || hintedTopic.toLowerCase().includes("db")) bestDomain = "Database & Storage";
      else if (hintedTopic.toLowerCase().includes("dsa") || hintedTopic.toLowerCase().includes("code")) bestDomain = "Programming";
      else if (hintedTopic.toLowerCase().includes("apti") || hintedTopic.toLowerCase().includes("reason")) bestDomain = "Aptitude & Logical Reasoning";
    }

    return {
      hierarchy: `${bestDomain} → ${bestSubdomain} → ${bestTopic}`,
      domain: bestDomain,
      subdomain: bestSubdomain,
      subtopic: bestTopic
    };
  }

  /**
   * Component 8: Heuristic Difficulty Verification against requested test settings.
   */
  verifyDifficulty(normalizedText, targetDifficulty, modality) {
    const target = (targetDifficulty || "Medium").trim();
    const scores = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };

    // Tally indicator occurrences in text
    for (const [level, phrases] of Object.entries(this.difficultyIndicators)) {
      for (const phrase of phrases) {
        if (normalizedText.includes(phrase)) {
          scores[level] += (level === "Expert" || level === "Hard" ? 3 : 2);
        }
      }
    }

    // Adjust heuristics by modality depth
    if (modality === "Coding" && (normalizedText.includes("time complexity") || normalizedText.includes("dp") || normalizedText.includes("graph"))) {
      scores.Hard += 3;
    } else if (modality === "Subjective" || modality === "AI Viva") {
      scores.Medium += 2;
      if (normalizedText.includes("architecture") || normalizedText.includes("trade-off") || normalizedText.includes("system design")) {
        scores.Expert += 4;
      }
    }

    // Determine estimated level with highest cumulative heuristic weight
    let bestLevel = "Medium"; // Canonical default
    let maxVal = -1;
    for (const [lvl, val] of Object.entries(scores)) {
      if (val > maxVal) {
        maxVal = val;
        bestLevel = lvl;
      }
    }

    // If zero phrases hit, trust requested setting as baseline
    if (maxVal <= 0) {
      bestLevel = target;
    }

    // Compute proximity match score (0-100)
    const hierarchyOrder = { Easy: 1, Medium: 2, Hard: 3, Expert: 4 };
    const dist = Math.abs((hierarchyOrder[bestLevel] || 2) - (hierarchyOrder[target] || 2));

    let difficultyScore = 100;
    let isMatch = true;
    let notes = `Verified as matching target level (${target}).`;

    if (dist === 1) {
      difficultyScore = 75;
      isMatch = true; // Tolerant operational boundary
      notes = `Minor complexity variance: requested ${target}, heuristic evaluated as ${bestLevel}.`;
    } else if (dist === 2) {
      difficultyScore = 50;
      isMatch = false;
      notes = `Moderate difficulty discrepancy: requested ${target}, evaluated as ${bestLevel}.`;
    } else if (dist >= 3) {
      difficultyScore = 20;
      isMatch = false;
      notes = `Severe difficulty misclassification: requested ${target}, evaluated as ${bestLevel}.`;
    }

    return { estimatedLevel: bestLevel, difficultyScore, isMatch, notes };
  }

  /**
   * Component 9: Bloom's Taxonomy cognitive classification based on action verb discovery.
   */
  classifyBloomLevel(normalizedText, questionStem) {
    const stemLower = (questionStem || normalizedText).toLowerCase();

    // Scan from highest cognitive order (Create) down to foundational order (Remember)
    for (const bLevel of this.bloomLevels) {
      for (const verb of bLevel.verbs) {
        // Match phrase at start of sentence or following interrogative words
        if (stemLower.includes(` ${verb} `) || stemLower.startsWith(verb) || stemLower.includes(`to ${verb}`) || stemLower.includes(`will ${verb}`)) {
          return {
            level: bLevel.level,
            confidence: "High",
            matchedVerb: verb
          };
        }
      }
    }

    // Secondary fallback heuristics based on syntax marks
    if (stemLower.includes("why ") || stemLower.includes("how does") || stemLower.includes("explain")) {
      return { level: "Understand", confidence: "Medium", matchedVerb: "interrogative explanation" };
    } else if (stemLower.includes("output of") || stemLower.includes("result of") || stemLower.includes("calculate")) {
      return { level: "Apply", confidence: "Medium", matchedVerb: "calculation / evaluation" };
    }

    // Default cognitive assignment
    return { level: "Remember", confidence: "Baseline", matchedVerb: "factual identification" };
  }
}

module.exports = new HeuristicClassifier();
