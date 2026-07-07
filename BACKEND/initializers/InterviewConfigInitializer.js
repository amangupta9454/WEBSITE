const InterviewConfig = require("../models/InterviewConfig");

class InterviewConfigInitializer {
  static async seedDefaultConfigs() {
    try {
      const configsCount = await InterviewConfig.countDocuments();
      if (configsCount === 0) {
        await InterviewConfig.create([
          {
            modeId: "Standard",
            name: "Standard Interview",
            enabled: true,
            tokenCost: 5,
            durationOptions: [15, 30, 45, 60],
            description: "1-on-1 mock interview with an AI HR or Technical recruiter.",
          },
          {
            modeId: "Panel",
            name: "FAANG Panel Interview",
            enabled: true,
            tokenCost: 15,
            durationOptions: [30, 45, 60],
            description: "Multi-round mock interview with multiple AI interviewers like Sarah & David.",
          }
        ]);
        console.log("Seeded default Interview Configurations.");
      }
    } catch (err) {
      console.error("Error seeding Interview Configurations:", err);
    }
  }
}

module.exports = InterviewConfigInitializer;
