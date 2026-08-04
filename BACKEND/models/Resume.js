const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    name: { 
      type: String, 
      required: true,
      default: "Untitled Resume"
    },
    template: { 
      type: String, 
      default: "modern" 
    },
    isFree: { 
      type: Boolean, 
      default: false // Set to true if this is the user's first free resume
    },
    downloadsUsed: { 
      type: Number, 
      default: 0 
    },
    whatsappDownloadsUsed: {
      type: Number,
      default: 0
    },
    status: { 
      type: String, 
      enum: ["Draft", "Completed"], 
      default: "Draft" 
    },
    atsScore: {
      type: Number,
      default: null
    },
    atsSuggestions: {
      type: [String],
      default: []
    },
    atsDataHash: {
      type: String,
      default: null
    },
    data: {
      personalInfo: {
        firstName: { type: String, default: "" },
        lastName: { type: String, default: "" },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        location: { type: String, default: "" },
        github: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        portfolio: { type: String, default: "" },
        summary: { type: String, default: "" }
      },
      experience: [
        {
          id: { type: String }, // For dnd-kit sorting
          company: { type: String },
          position: { type: String },
          startDate: { type: String },
          endDate: { type: String },
          description: { type: String }, // HTML or plain text bullet points
        }
      ],
      education: [
        {
          id: { type: String },
          institution: { type: String },
          degree: { type: String },
          fieldOfStudy: { type: String },
          location: { type: String }, // New field
          startDate: { type: String },
          endDate: { type: String },
          score: { type: String } // GPA/Percentage
        }
      ],
      skills: {
        type: mongoose.Schema.Types.Mixed,
        default: []
      },
      projects: [
        {
          id: { type: String },
          title: { type: String },
          link: { type: String }, // Legacy field
          liveLink: { type: String }, // New field
          githubLink: { type: String }, // New field
          startDate: { type: String }, // New field
          endDate: { type: String }, // New field
          technologies: { type: String },
          description: { type: String }
        }
      ],
      achievements: [
        {
          id: { type: String },
          title: { type: String },
          date: { type: String },
          description: { type: String }
        }
      ],
      certifications: [
        {
          id: { type: String },
          name: { type: String },
          issuer: { type: String },
          date: { type: String },
          link: { type: String }
        }
      ],
      customSections: [
        {
          id: { type: String },
          heading: { type: String },
          items: [
            {
              id: { type: String },
              title: { type: String },
              subtitle: { type: String },
              date: { type: String },
              description: { type: String }
            }
          ]
        }
      ],
      sectionOrder: { 
        type: [String], 
        default: ['experience', 'projects', 'education', 'skills', 'achievements', 'certifications'] 
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
