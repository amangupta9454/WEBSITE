const mongoose = require('mongoose');

const hackathonSettingSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      default: 'Code-A-Nova National Hackathon 2026',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Innovate, Build & Lead the Tech Revolution',
      trim: true,
    },
    description: {
      type: String,
      default:
        'Code-A-Nova presents a premier national-level hackathon bringing together students, developers, and innovators to build cutting-edge solutions across AI, Web3, Full Stack, and Cloud technologies.',
    },
    startDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days ahead
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Default 10 days ahead
    },
    submissionDeadline: {
      type: Date,
      default: () => new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    },
    resultDate: {
      type: Date,
      default: () => new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    },
    participationFee: {
      type: Number,
      default: 49,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    whatsAppLink: {
      type: String,
      default: '',
      trim: true,
    },
    rules: {
      type: [String],
      default: [
        'Teams must consist of 1 to 4 members.',
        'Initial registration and PPT submission was completed on Unstop.',
        'Shortlisted teams must confirm participation by paying the ₹49 confirmation fee.',
        'All code submissions must be original and built during the designated hackathon timeline.',
        'Plagiarism or copying pre-existing repositories will result in immediate disqualification.',
        'Judges decisions are final and binding.',
      ],
    },
    tracks: {
      type: [
        {
          name: { type: String, required: true },
          description: { type: String, default: '' },
          icon: { type: String, default: 'code' },
        },
      ],
      default: [
        {
          name: 'AI & Machine Learning',
          description: 'Autonomous agents, LLM apps, computer vision, predictive intelligence, and deep learning systems.',
          icon: 'bot',
        },
        {
          name: 'Web3 & Decentralized Tech',
          description: 'Smart contracts, DeFi, distributed identity, transparent governance, and dApps.',
          icon: 'link',
        },
        {
          name: 'Full Stack & Cloud Native',
          description: 'Scalable SaaS platforms, real-time collaboration engines, dev tools, and microservices.',
          icon: 'server',
        },
        {
          name: 'Open Innovation & Social Good',
          description: 'EdTech, HealthTech, Agritech, green energy, sustainability, and civic technology.',
          icon: 'sparkles',
        },
      ],
    },
    judgingCriteria: {
      type: [
        {
          title: { type: String, required: true },
          maxScore: { type: Number, default: 25 },
          description: { type: String, default: '' },
        },
      ],
      default: [
        { title: 'Innovation & Originality', maxScore: 25, description: 'Creativity, uniqueness, and problem approach' },
        { title: 'Technical Complexity', maxScore: 25, description: 'Architecture, code quality, and engineering difficulty' },
        { title: 'Usability & Design', maxScore: 25, description: 'User experience, UI polish, and accessibility' },
        { title: 'Impact & Viability', maxScore: 25, description: 'Real-world applicability, scalability, and market fit' },
      ],
    },
    prizes: {
      type: [
        {
          position: { type: String, required: true },
          amount: { type: String, required: true },
          perks: { type: [String], default: [] },
        },
      ],
      default: [
        { position: 'Winner (1st Place)', amount: '₹15,000 + Certificate + Trophy', perks: ['Direct Internship Interview', 'Swag Kit'] },
        { position: '1st Runner Up (2nd Place)', amount: '₹10,000 + Certificate', perks: ['Internship Interview', 'Swag Kit'] },
        { position: '2nd Runner Up (3rd Place)', amount: '₹5,000 + Certificate', perks: ['Internship Interview'] },
      ],
    },
    announcements: {
      type: [
        {
          id: { type: String, default: () => Math.random().toString(36).substring(2, 10) },
          title: { type: String, required: true },
          message: { type: String, required: true },
          isUrgent: { type: Boolean, default: false },
          createdAt: { type: Date, default: Date.now },
          active: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isRegistrationOpen: {
      type: Boolean,
      default: true,
    },
    isSubmissionOpen: {
      type: Boolean,
      default: false,
    },
    isResultsPublished: {
      type: Boolean,
      default: false,
    },
    resultsPublishedAt: {
      type: Date,
      default: null,
    },
    resultsLocked: {
      type: Boolean,
      default: false,
    },
    resultsLockedAt: {
      type: Date,
      default: null,
    },
    resultsLockedBy: {
      type: String,
      default: null,
    },
    winnerCategories: {
      type: [
        {
          categoryId: { type: String, required: true },
          name: { type: String, required: true },
          description: { type: String, default: '' },
          prize: { type: String, default: '' },
          rankRestriction: { type: Number, default: null },
          trackRestriction: { type: String, default: null },
          maxWinners: { type: Number, default: 1 },
          isActive: { type: Boolean, default: true },
        },
      ],
      default: [
        {
          categoryId: 'WINNER_1ST',
          name: 'Winner (1st Place)',
          description: 'Overall Top Performing Team',
          prize: '₹15,000 + Certificate + Trophy',
          rankRestriction: 1,
          maxWinners: 1,
          isActive: true,
        },
        {
          categoryId: 'RUNNER_UP_2ND',
          name: '1st Runner Up (2nd Place)',
          description: 'Overall Second Ranked Team',
          prize: '₹10,000 + Certificate',
          rankRestriction: 2,
          maxWinners: 1,
          isActive: true,
        },
        {
          categoryId: 'RUNNER_UP_3RD',
          name: '2nd Runner Up (3rd Place)',
          description: 'Overall Third Ranked Team',
          prize: '₹5,000 + Certificate',
          rankRestriction: 3,
          maxWinners: 1,
          isActive: true,
        },
        {
          categoryId: 'BEST_INNOVATION',
          name: 'Best Innovation Award',
          description: 'Most innovative architecture and original solution',
          prize: 'Certificate + Special Recognition',
          rankRestriction: null,
          maxWinners: 1,
          isActive: true,
        },
        {
          categoryId: 'BEST_TECHNICAL',
          name: 'Best Technical Implementation',
          description: 'Highest code quality, complexity, and technical execution',
          prize: 'Certificate + Special Recognition',
          rankRestriction: null,
          maxWinners: 1,
          isActive: true,
        },
      ],
    },
    updatedBy: {
      type: String,
      default: 'system',
    },
  },
  {
    timestamps: true,
  }
);

// Helper static to get or initialize default setting
hackathonSettingSchema.statics.getOrCreateSettings = async function (hackathonId = 'can-hackathon-2026') {
  let settings = await this.findOne({ hackathonId });
  if (!settings) {
    settings = await this.findOne();
  }
  if (!settings) {
    settings = await this.create({
      hackathonId: 'can-hackathon-2026',
    });
  }
  return settings;
};

module.exports = mongoose.model('HackathonSetting', hackathonSettingSchema);
