const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const SoftwareRepo = require("../models/SoftwareRepo");
const Group = require("../models/Group");
const { auth } = require("../middlewares/auth");
const allowRoles = require("../middlewares/allowRoles");

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/softwareRepository/");
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

// GET all software uploads
router.get("/", auth, allowRoles("admin", "director"), async (req, res) => {
  try {
    const repos = await SoftwareRepo.find()
      .populate("group", "name")
      .populate("uploadedBy", "personalDetails.name email");

    res.json(repos);
  } catch (error) {
    console.error("Error fetching repos:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST: create a new software repo entry
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

      let originalName = null,
        storedName = null,
        filePath = null;
      if (req.file) {
        originalName = req.file.originalname;
        storedName = req.file.filename;
        filePath = req.file.path;
      }

      const upload = new SoftwareRepo({
        group,
        type,
        originalName,
        storedName,
        filePath,
        githubUrl,
        clonedRepoPath,
        metadata: metadataObj,
        uploadedBy: req.user._id,
      });

      await upload.save();

      await Group.findByIdAndUpdate(group, {
        $push: { SoftwareRepo: upload._id },
      });

      const populatedUpload = await SoftwareRepo.findById(upload._id)
        .populate("group", "name")
        .populate("uploadedBy", "name email role");

      res.status(201).json(populatedUpload);
    } catch (error) {
      console.error("Error creating upload:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// GET by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const upload = await SoftwareRepo.findById(req.params.id);
    if (!upload) {
      return res.status(404).json({ message: "Upload not found" });
    }
    res.json(upload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: update upload
router.put(
  "/:uploadId",
  auth,
  allowRoles("admin", "associate_director"),
  uploadMiddleware.single("file"),
  async (req, res) => {
    try {
      const { uploadId } = req.params;
      const upload = await SoftwareRepo.findById(uploadId);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      const isAdmin =
        req.user.role === "admin" || req.user.role === "associate_director";
      const isUploader =
        upload.uploadedBy.toString() === req.user._id.toString();

      if (!isAdmin && !isUploader) {
        return res.status(403).json({ message: "Forbidden" });
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
        upload.storedName = req.file.filename;
        upload.filePath = req.file.path;
      }

      await upload.save();
      res.json(upload);
    } catch (error) {
      console.error("Error updating upload:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// DELETE upload
router.delete(
  "/:uploadId",
  auth,
  allowRoles("admin", "associate_director"),
  async (req, res) => {
    try {
      const { uploadId } = req.params;
      const upload = await SoftwareRepo.findById(uploadId);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      const isAdmin =
        req.user.role === "admin" || req.user.role === "associate_director";
      const isUploader =
        upload.uploadedBy.toString() === req.user._id.toString();

      if (!isAdmin && !isUploader) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (upload.filePath) {
        const filePath = path.resolve(upload.filePath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await Group.findByIdAndUpdate(upload.group, {
        $pull: { SoftwareRepo: upload._id },
      });

      await SoftwareRepo.findByIdAndDelete(uploadId);

      res.json({ message: "Upload deleted successfully" });
    } catch (error) {
      console.error("Error deleting upload:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
