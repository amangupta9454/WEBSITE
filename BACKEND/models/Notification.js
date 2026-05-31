const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    audience: { 
      type: String, 
      enum: ['All', 'Normal Intern', 'Summer/Winter Intern'], 
      required: true 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
