const InterviewConfig = require("../models/InterviewConfig");

exports.getAllConfigs = async (req, res) => {
  try {
    const configs = await InterviewConfig.find();
    res.status(200).json({ success: true, configs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { modeId } = req.params;
    const { tokenCost, enabled } = req.body;
    
    // Validate inputs
    if (tokenCost !== undefined && (isNaN(tokenCost) || tokenCost < 0)) {
      return res.status(400).json({ success: false, message: "Invalid token cost" });
    }

    const config = await InterviewConfig.findOneAndUpdate(
      { modeId },
      { $set: { tokenCost, enabled } },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ success: false, message: "Configuration not found" });
    }

    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
