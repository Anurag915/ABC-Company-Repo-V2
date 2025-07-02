const mongoose = require("mongoose");
const { Schema } = mongoose;
const DocumentSchema = new Schema({
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});
const CloseGroup = new Schema(
  {
    groupName: { type: String, required: true },
    groupPurpose: { type: String, required: true },
    groupDuration: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    requestedBy: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminRemarks: { type: String, default: "" },
    documents: [DocumentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("CloseGroup", CloseGroup);
