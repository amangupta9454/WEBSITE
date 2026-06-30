const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");
const ProjectSubmission = require("./models/ProjectSubmission");

async function allocatePoints() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const users = await User.find({});
    console.log(`Found ${users.length} users. Allocating points...`);

    let updatedUsersCount = 0;
    let totalPointsAwarded = 0;

    for (let user of users) {
      let userUpdated = false;

      for (let internship of user.internships) {
        let pointsToAdd = 0;
        let reasons = [];

        // 1. Summer Projects - Accepted
        if (internship.assignedRepos && internship.assignedRepos.length > 0) {
          for (let repo of internship.assignedRepos) {
            if (repo.reviewStatus === "Accepted" && !repo.pointsAwarded) {
              pointsToAdd += 50;
              repo.pointsAwarded = true;
              reasons.push("Summer Project Accepted (Back-allocated)");
            }
          }
        }

        // 2. Normal Projects - Submissions
        // We find submissions matching this internship. We'll use studentId.
        if (internship.studentId) {
          const submissions = await ProjectSubmission.find({ studentId: internship.studentId });
          // Check if we already awarded points for these submissions
          // We can check pointsHistory to see if we already awarded for "Normal Project Submitted (Back-allocated) - Month X"
          for (let sub of submissions) {
            const reasonStr = `Normal Project Submitted (Back-allocated) - Month ${sub.month}`;
            const alreadyAwarded = internship.pointsHistory && internship.pointsHistory.some(p => p.reason === reasonStr);
            if (!alreadyAwarded) {
              pointsToAdd += 30; // 30 points for a normal project submission
              reasons.push(reasonStr);
            }
          }
        }

        if (pointsToAdd > 0) {
          internship.synergyPoints = (internship.synergyPoints || 0) + pointsToAdd;
          if (!internship.pointsHistory) internship.pointsHistory = [];
          
          for (let reason of reasons) {
            const points = reason.includes("Summer Project") ? 50 : 30;
            internship.pointsHistory.push({
              reason: reason,
              pointsAdded: points,
              date: new Date()
            });
          }

          userUpdated = true;
          totalPointsAwarded += pointsToAdd;
        }
      }

      if (userUpdated) {
        await user.save();
        updatedUsersCount++;
        console.log(`Updated user ${user.name} with points.`);
      }
    }

    console.log("-----------------------------------------");
    console.log(`Successfully updated ${updatedUsersCount} users.`);
    console.log(`Total Synergy Points Awarded: ${totalPointsAwarded}`);
    console.log("-----------------------------------------");

  } catch (err) {
    console.error("Error allocating points:", err);
  } finally {
    mongoose.connection.close();
  }
}

allocatePoints();
