const mongoose = require("mongoose");
const DocumentSchema = new mongoose.Schema({
  filename: String,
  url: String,
});
const UserSchema = new mongoose.Schema(
  {
    // Role and Approval
    role: {
      type: String,
      enum: [
        "employee",
        "admin",
        "director",
        "associate_director",
        "pending_director",
      ],
      default: "employee",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Lab and Group
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    closeGroup: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CloseGroup",
      },
    ],

    // Authentication
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },

    // Documents
    documents: [DocumentSchema],

    // Personal Details
    personalDetails: {
      name: { type: String, required: true },
      dob: { type: Date },
      mobile: { type: String },
      address: { type: String },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        default: "Male",
      },
      maritalStatus: {
        type: String,
        enum: ["Single", "Married", "Divorced", "Widowed"],
        default: "Single",
      },
      emergencyContact: {
        name: { type: String },
        relationship: { type: String },
        mobile: { type: String },
      },
      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
        default: "Unknown",
      },
    },

    // Professional Details
    professionalDetails: {
      designation: { type: String },
      cadre: {
        type: String,
        enum: ["DRDS", "DRTC", "Admin", "Other"],
      },
      intercom: { type: String },
      internetEmail: { type: String },
      dronaEmail: { type: String },
      pis: { type: String },
      aebasId: { type: String },
      joiningDate: { type: Date },
    },

    // Others
    photo: { type: String, default: "" },
    about: { type: String, default: "" },
    employmentPeriod: {
      from: { type: Date },
      to: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
