const mongoose = require("mongoose");

const assessmentAIBlueprintSchema = new mongoose.Schema(
  {
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      required: true,
      unique: true,
      index: true,
    },
    systemPrompt: {
      type: String,
      required: true,
      default: "",
      // The full AI system prompt for question generation
    },
    topics: {
      type: [String],
      default: [],
      // e.g. ["OOP", "Collections", "JVM", "Streams"]
    },
    outputSchema: {
      type: String,
      default: `Return a JSON array of questions. Each question must have:
{
  "text": "Question text",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "Why this is correct",
  "difficulty": "easy|medium|hard|expert",
  "topics": ["topic1"]
}`,
    },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    lastUpdatedBy: { type: String, default: "admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssessmentAIBlueprint", assessmentAIBlueprintSchema);
