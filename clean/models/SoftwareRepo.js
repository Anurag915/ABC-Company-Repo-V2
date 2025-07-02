const mongoose = require("mongoose");
const { Schema } = mongoose;
const SoftwareRepoSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  type: {
    type: String,
    enum: ["document", "video", "code_zip", "github_repo", "ZIP", "N/A"],
    required: true,
  },
  originalName: String,
  storedName: String,
  filePath: String,
  githubUrl: String,
  clonedRepoPath: String,
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Or the correct name of your user model
    required: true,
  },
  metadata: {
    sizeInKB: Number,
    description: String,
    languageUsed: [String],
    duration: Number,
    developerName: String,
    developerEmail: String,
    developerRole: String,
    // Add more fields if needed
  },
});

module.exports = mongoose.model("SoftwareRepo", SoftwareRepoSchema);
