const mongoose = require("mongoose");
const { Schema } = mongoose;

const FileItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    fileUrl: { type: String, required: true }, // Store uploaded file URL here
  },
  { _id: true }
);

const ExternalLinkSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String },
  },
  { _id: true }
);

const DirectorSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: { type: String }, // for retired or non-User ADs
    designation: { type: String, default: "Director" },
    image: { type: String },
    from: { type: Date, required: true },
    to: { type: Date }, // null if currently serving
    about: { type: String }, // Additional information about the director
  },
  { _id: true }
);
const ContactInfoSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Email", "Phone", "Address", "Other"],
      required: true,
    },
    label: { type: String },
    value: { type: String, required: true },
  },
  { _id: true }
);

// const DirectorSchema = new Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     name: { type: String }, // for retired director
//     designation: { type: String },
//     image: { type: String },
//     from: { type: Date, required: true },
//     to: { type: Date }, // null for currently serving
//     about: { type: String }, // Additional information about the director
//   },
//   { _id: true }
// );
const OfficeOfDirectorSchema = new Schema(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true }, // e.g., Scientist 'F', TO 'C', TO 'B'
    contactNumber: { type: String },
    email: { type: String },
  },
  { _id: true }
);

const LabSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // Enforce uniqueness on lab name
    domain: String,
    vision: { type: String },
    mission: { type: String },
    about: { type: String },
    directorHistory: [DirectorSchema],
    // currentDirector: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User", // assuming directors are also employees
    // },
    currentDirector: DirectorSchema, // assuming directors are also employees
    // Referencing other collections instead of embedding data directly,
    technologiesDeveloped: [
      { type: mongoose.Schema.Types.ObjectId, ref: "TechnologyDeveloped" },
    ],
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseConducted" }],
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    publications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Publication" },
    ],
    patents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Patent" }], // New reference for patents

    // Manpower list of users working in the lab
    manpowerList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    contactInfo: [ContactInfoSchema], // <-- Add this field here
    notices: [FileItemSchema],
    circulars: [FileItemSchema],
    advertisements: [FileItemSchema],
    products: [FileItemSchema],
    officeOfDirector: [OfficeOfDirectorSchema],
    LabHistoryDetails: { type: String }, // Additional field for lab history
    labPhotos: [FileItemSchema], // ← Add this line
    externalLinks: [ExternalLinkSchema],
  },
  { timestamps: true }
);

// Optional: Explicitly define index (good for clarity/debugging)
LabSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Lab", LabSchema);
