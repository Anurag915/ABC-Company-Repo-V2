const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Group = require("../models/Group");

// Allowed file types
const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "video/mp4",
  "video/x-msvideo",
  "video/quicktime",
];

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "group_files");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"));
};
const upload = multer({ storage, fileFilter });

// Allowed fields
const validFields = ["projects", "patents", "technologies", "courses", "publications"];

// POST (Add file)
router.post("/:groupId/:field", upload.single("file"), async (req, res) => {
  const { groupId, field } = req.params;
  if (!validFields.includes(field)) return res.status(400).json({ error: "Invalid field" });

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const newItem = {
      name: req.body.name,
      description: req.body.description,
      fileUrl: `/uploads/group_files/${req.file.filename}`,
    };

    group[field].push(newItem);
    await group.save();

    res.status(201).json({ message: `${field} added successfully`, data: newItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (Update file metadata and optionally file)
router.put("/:groupId/:field/:itemId", upload.single("file"), async (req, res) => {
  const { groupId, field, itemId } = req.params;
  if (!validFields.includes(field)) return res.status(400).json({ error: "Invalid field" });

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const item = group[field].id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.name = req.body.name || item.name;
    item.description = req.body.description || item.description;

    if (req.file) {
      // delete old file
      if (item.fileUrl) {
        const oldPath = path.join(__dirname, "..", item.fileUrl);
        fs.existsSync(oldPath) && fs.unlinkSync(oldPath);
      }
      item.fileUrl = `/uploads/group_files/${req.file.filename}`;
    }

    await group.save();
    res.json({ message: `${field} updated`, data: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (Remove file item)
router.delete("/:groupId/:field/:itemId", async (req, res) => {
  const { groupId, field, itemId } = req.params;
  if (!validFields.includes(field)) return res.status(400).json({ error: "Invalid field" });

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const item = group[field].id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    // delete file
    if (item.fileUrl) {
      const filePath = path.join(__dirname, "..", item.fileUrl);
      fs.existsSync(filePath) && fs.unlinkSync(filePath);
    }

    item.deleteOne();
    await group.save();
    res.json({ message: `${field} deleted` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET (Get all items of a type)
router.get("/:groupId/:field", async (req, res) => {
  const { groupId, field } = req.params;
  if (!validFields.includes(field)) return res.status(400).json({ error: "Invalid field" });

  try {
    const group = await Group.findById(groupId).select(field);
    if (!group) return res.status(404).json({ error: "Group not found" });

    res.json(group[field]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
