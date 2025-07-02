const mongoose = require("mongoose");
const TrialRepoSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Document", "video", "ZIP"],
      required: true,
    },
    githubUrl: {
      type: String,
      default: "",
    },
    clonedRepoPath: {
      type: String,
      default: "",
    },
    metadata: {
      sizeInKB: { type: Number, default: 0 },
      description: { type: String, default: "" },
      languageUsed: { type: [String], default: [] },
      duration: { type: Number, default: 0 },
    },
    filePath: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Typically an admin or director
    },
    reviewedAt: {
      type: Date,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrialRepository", TrialRepoSchema);
