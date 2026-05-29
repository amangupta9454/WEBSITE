const fs = require('fs');
let content = fs.readFileSync('controllers/adminController.js', 'utf8');

// Replace updateOfferStatus
content = content.replace(/const updateOfferStatus = async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ message: "Server error" \}\);\n  \}\n\};/, 
`const updateOfferStatus = async (req, res) => {
  try {
    const { applicationId, applicationIds, status } = req.body;
    const ids = applicationIds || (applicationId ? [applicationId] : []);
    if (ids.length === 0 || !status) {
      return res
        .status(400)
        .json({ message: "Application ID(s) and status required" });
    }

    let modifiedCount = 0;
    for (const appId of ids) {
      const result = await User.updateOne(
        { "internships._id": appId },
        { $set: { "internships.$.offerLetterStatus": status } },
      );
      if (result.matchedCount > 0) modifiedCount++;
    }

    if (modifiedCount === 0) {
      return res.status(404).json({ message: "No applications found" });
    }

    res.json({ message: \`Offer letter marked as \${status} for \${modifiedCount} application(s)\` });
  } catch (error) {
    console.error("[Admin] Error updating offer status:", error);
    res.status(500).json({ message: "Server error" });
  }
};`);

// Replace updateBatch
content = content.replace(/const updateBatch = async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ message: "Server error" \}\);\n  \}\n\};/, 
`const updateBatch = async (req, res) => {
  try {
    const { applicationId, applicationIds, batch } = req.body;
    const ids = applicationIds || (applicationId ? [applicationId] : []);
    if (ids.length === 0) {
      return res.status(400).json({ message: "Application ID(s) required" });
    }

    let modifiedCount = 0;
    for (const appId of ids) {
      const result = await User.updateOne(
        { "internships._id": appId },
        { $set: { "internships.$.batch": batch || "" } },
      );
      if (result.matchedCount > 0) modifiedCount++;
    }

    if (modifiedCount === 0) {
      return res.status(404).json({ message: "No applications found" });
    }

    res.json({ message: \`Batch updated successfully for \${modifiedCount} application(s)\` });
  } catch (error) {
    console.error("[Admin] Error updating batch:", error);
    res.status(500).json({ message: "Server error" });
  }
};`);

// Replace updateInternshipType
content = content.replace(/const updateInternshipType = async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ message: "Server error" \}\);\n  \}\n\};/, 
`const updateInternshipType = async (req, res) => {
  try {
    const { applicationId, applicationIds, internshipType } = req.body;
    const ids = applicationIds || (applicationId ? [applicationId] : []);
    if (ids.length === 0) {
      return res.status(400).json({ message: "Application ID(s) required" });
    }

    let modifiedCount = 0;
    for (const appId of ids) {
      const result = await User.updateOne(
        { "internships._id": appId },
        {
          $set: {
            "internships.$.internshipType": internshipType || "Normal Intern",
          },
        },
      );
      if (result.matchedCount > 0) modifiedCount++;
    }

    if (modifiedCount === 0) {
      return res.status(404).json({ message: "No applications found" });
    }

    res.json({ message: \`Internship type updated successfully for \${modifiedCount} application(s)\` });
  } catch (error) {
    console.error("[Admin] Error updating internship type:", error);
    res.status(500).json({ message: "Server error" });
  }
};`);

// Replace updateCertificateSent
content = content.replace(/const updateCertificateSent = async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ message: "Server error" \}\);\n  \}\n\};/, 
`const updateCertificateSent = async (req, res) => {
  try {
    const { applicationId, applicationIds, isCertificateSent } = req.body;
    const ids = applicationIds || (applicationId ? [applicationId] : []);
    if (ids.length === 0) {
      return res.status(400).json({ message: "Application ID(s) required" });
    }

    let modifiedCount = 0;
    for (const appId of ids) {
      const result = await User.updateOne(
        { "internships._id": appId },
        { $set: { "internships.$.isCertificateSent": isCertificateSent } },
      );
      if (result.matchedCount > 0) modifiedCount++;
    }

    if (modifiedCount === 0) {
      return res.status(404).json({ message: "No applications found" });
    }

    res.json({
      message: \`Certificate sent status updated for \${modifiedCount} application(s)\`,
    });
  } catch (error) {
    console.error("[Admin] Error updating certificate sent status:", error);
    res.status(500).json({ message: "Server error" });
  }
};`);

fs.writeFileSync('controllers/adminController.js', content);
console.log('Backend endpoints updated');
