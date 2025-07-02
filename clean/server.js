require("dotenv").config(); // Ensure environment variables are loaded
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const groupRoutes = require("./routes/group");
const labRoutes = require("./routes/lab");
const logRoutes = require("./routes/log");
const courseRoutes = require("./routes/courseConducted.js");
const projectRoutes = require("./routes/project.js");
const patentRoutes = require("./routes/patent.js");
const technologyRoutes = require("./routes/technologyDeveloped.js");
const publicationRoutes = require("./routes/publication.js");
const documentRoutes = require("./routes/document.js");
const allowRoles = require("./middlewares/allowRoles.js");
const groupFileRoutes = require("./routes/groupFiles.routes");
const adminRoutes = require("./routes/admin");
const closeGroupRoutes = require("./routes/closeGroupRoutes");
const letters = require("./routes/letters.js");
const contactRoutes = require("./routes/contact.js");
const softwareRepoRoute = require("./routes/softwareRepo.js");
const trialRepository = require("./routes/trialRepo.js");
const app = express();
const path = require("path");

const staticPath = path.join(__dirname, "../DRDOApp/dist");
console.log("📂 Static Path:", staticPath);

app.use(express.static(staticPath));

const multer = require("multer");
// const { GridFsStorage } = require("multer-gridfs-storage");
// const Grid = require("gridfs-stream");
// const trialRepository = require("./models/TrialRepository.js");
// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/drdo", {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected");

    // Ensure unique index is created
    await mongoose.connection
      .collection("groups")
      .createIndex({ name: 1, labId: 1 }, { unique: true });
    await mongoose.connection
      .collection("labs")
      .createIndex({ name: 1 }, { unique: true });

    const PORT = process.env.PORT || 5000;

    // Start server after index is ensured
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// mongoose
//   .connect(process.env.MONGO_URI || "mongodb://localhost:27017/drdo")
//   .then(async () => {
//     console.log("MongoDB connected");

//     // Setup GridFS stream
//     const conn = mongoose.connection;
//     let gfs;
//     conn.once("open", () => {
//       gfs = Grid(conn.db, mongoose.mongo);
//       gfs.collection("uploads");
//     });

//     // Setup multer storage engine
//     const storage = new GridFsStorage({
//       url: process.env.MONGO_URI || "mongodb://localhost:27017/drdo",
//       file: (req, file) => {
//         return {
//           filename: `${Date.now()}-${file.originalname}`,
//           bucketName: "uploads",
//         };
//       },
//     });

//     const upload = multer({ storage });

//     // Create routes here or import from another file
//     app.post("/api/upload", upload.single("file"), (req, res) => {
//       res.json({ file: req.file });
//     });

//     app.get("/api/files/:filename", (req, res) => {
//       gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//         if (!file || file.length === 0) {
//           return res.status(404).json({ error: "File not found" });
//         }
//         // Stream file to response
//         const readstream = gfs.createReadStream(file.filename);
//         readstream.pipe(res);
//       });
//     });

//     // Your unique indexes (optional)
//     await conn
//       .collection("groups")
//       .createIndex({ name: 1, labId: 1 }, { unique: true });
//     await conn.collection("labs").createIndex({ name: 1 }, { unique: true });

//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("MongoDB connection error:", err);
//   });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/logs", logRoutes);
// app.use('/api/profile', profileRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/patents", patentRoutes);
app.use("/api/technologies", technologyRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/documents", documentRoutes);
// app.use("/uploads", express.static("uploads"));
app.use("/api/contact-info", contactRoutes);

app.use("/api/group-files", groupFileRoutes);
app.use("/admin", adminRoutes);
app.use("/api/close-groups", closeGroupRoutes);
app.use("/api/dac", letters);
app.use("/api/softwareRepo", softwareRepoRoute);
app.use("/api/trialRepo", trialRepository);

// Base route
// app.get("/", (req, res) => {
//   res.send("Welcome to the API");
// });
// app.use(express.static(path.join(__dirname, "../DRDOApp/dist")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../DRDOApp/dist/index.html"));
// });

// const staticPath = path.join(__dirname, "../DRDOApp/dist");
// console.log("📂 Static Path:", staticPath);



// app.get("*", (req, res) => {
//   console.log("Fallback route hit for:", req.url);
//   res.sendFile(path.resolve(staticPath, "index.html"));
// });


// Place this AFTER all other route definitions
app.get("/*", (req, res) => {
  res.sendFile(path.resolve(staticPath, "index.html"));
});
