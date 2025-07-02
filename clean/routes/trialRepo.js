const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const TrialRepo = require("../models/TrialRepository");
const Group = require("../models/Group");
const { auth } = require("../middlewares/auth");
const allowRoles = require("../middlewares/allowRoles");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/trialRepository/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "text/plain",
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type"), false);
};

const uploadMiddleware = multer({ storage, fileFilter });

router.get("/", auth, allowRoles("admin", "director"), async (req, res) => {
  try {
    const repos = await TrialRepo.find()
      .populate("group", "name")
      .populate("uploadedBy", "personalDetails.name email");
    res.json(repos);
  } catch (error) {
    console.error("Error fetching trial repos:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/",
  auth,
  allowRoles("admin", "associate_director"),
  uploadMiddleware.single("file"),
  async (req, res) => {
    try {
      const { group, type, githubUrl, clonedRepoPath } = req.body;

      if (!group || !type) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const groupDoc = await Group.findById(group);
      if (!groupDoc) {
        return res.status(404).json({ message: "Group not found" });
      }

      let metadataObj = {};
      if (req.body.metadata) {
        try {
          metadataObj = JSON.parse(req.body.metadata);
          if (metadataObj.sizeInKB)
            metadataObj.sizeInKB = Number(metadataObj.sizeInKB);
          if (metadataObj.duration)
            metadataObj.duration = Number(metadataObj.duration);
          if (typeof metadataObj.languageUsed === "string") {
            metadataObj.languageUsed = metadataObj.languageUsed
              .split(",")
              .map((s) => s.trim());
          }
        } catch (err) {
          return res.status(400).json({ message: "Invalid JSON in metadata" });
        }
      }

      const upload = new TrialRepo({
        group,
        type,
        githubUrl,
        clonedRepoPath,
        metadata: metadataObj,
        filePath: req.file.path,
        originalName: req.file.originalname,
        uploadedBy: req.user._id,
      });

      await upload.save();

      res.status(201).json(upload);
    } catch (error) {
      console.error("Error uploading trial repo:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// GET /my-group-repos
router.get("/my-group-repos", auth, async (req, res) => {
  try {
    // Ensure the user has a group
    const userGroup = req.user.group;
    if (!userGroup) {
      return res
        .status(403)
        .json({ message: "User does not belong to any group" });
    }

    const repos = await TrialRepo.find({ group: userGroup })
      .populate("group", "name")
      .populate("uploadedBy", "personalDetails.name email");

    res.json(repos);
  } catch (error) {
    console.error("Error fetching group repos:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get(
  "/:id",
  auth,
  allowRoles("admin", "associate_director"),
  async (req, res) => {
    try {
      const upload = await TrialRepo.findById(req.params.id);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      res.json(upload);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/:uploadId",
  auth,
  allowRoles("admin", "associate_director"),
  uploadMiddleware.single("file"),
  async (req, res) => {
    try {
      const { uploadId } = req.params;
      const upload = await TrialRepo.findById(uploadId);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      const { group, type, githubUrl, clonedRepoPath } = req.body;
      let metadataObj = upload.metadata || {};

      if (req.body.metadata) {
        try {
          metadataObj = JSON.parse(req.body.metadata);
          if (metadataObj.sizeInKB)
            metadataObj.sizeInKB = Number(metadataObj.sizeInKB);
          if (metadataObj.duration)
            metadataObj.duration = Number(metadataObj.duration);
          if (typeof metadataObj.languageUsed === "string") {
            metadataObj.languageUsed = metadataObj.languageUsed
              .split(",")
              .map((s) => s.trim());
          }
        } catch (err) {
          return res.status(400).json({ message: "Invalid metadata" });
        }
      }

      if (group) upload.group = group;
      if (type) upload.type = type;
      if (githubUrl) upload.githubUrl = githubUrl;
      if (clonedRepoPath) upload.clonedRepoPath = clonedRepoPath;
      upload.metadata = metadataObj;

      if (req.file) {
        upload.originalName = req.file.originalname;
        upload.filePath = req.file.path;
      }

      await upload.save();
      res.json(upload);
    } catch (error) {
      console.error("Error updating trial repo:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/:uploadId",
  auth,
  allowRoles("admin", "associate_director"),
  async (req, res) => {
    try {
      const { uploadId } = req.params;
      const upload = await TrialRepo.findById(uploadId);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      if (upload.filePath && fs.existsSync(upload.filePath)) {
        fs.unlinkSync(upload.filePath);
      }

      await TrialRepo.findByIdAndDelete(uploadId);
      res.json({ message: "Upload deleted successfully" });
    } catch (error) {
      console.error("Error deleting trial repo:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
