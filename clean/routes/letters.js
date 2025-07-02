const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Letter = require("../models/Letter");
const { auth } = require("../middlewares/auth.js");
const allowRoles = require("../middlewares/allowRoles");
const fs = require("fs");
// === Multer Setup ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/letters/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

// === Create Letter ===
router.post(
  "/",
  auth,
  allowRoles("admin", "employee", "associate_director"),
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        letterLanguage,
        letterCommunBy,
        docketDate,
        category,
        letterNo,
        letterDate,
        establishment,
        letterSub,
        docketNo,
      } = req.body;

      if (!req.file) return res.status(400).json({ error: "File is required" });

      const newLetter = new Letter({
        letterLanguage,
        letterCommunBy,
        docketDate,
        category,
        letterNo,
        letterDate,
        establishment,
        letterSub,
        docketNo,
        fileName: req.file.filename,
        fileExt: path.extname(req.file.originalname).replace(".", ""),
        uploadedBy: req.user._id,
      });

      await newLetter.save();
      res.status(201).json({ message: "Letter uploaded", letter: newLetter });
    } catch (err) {
      res.status(500).json({ error: "Upload failed", details: err.message });
    }
  }
);

// === Get All Letters ===
router.get("/", auth, async (req, res) => {
  try {
    let letters;
    const role = req.user.role;  // assuming your auth middleware attaches `role`

    if (role === "admin" || role === "director") {
      // Admins & directors get everything
      letters = await Letter.find().populate("uploadedBy", "name email");
    } else {
      // Everyone else only gets their own uploads
      letters = await Letter
        .find({ uploadedBy: req.user._id })
        .populate("uploadedBy", "name email");
    }

    res.json(letters);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Fetching letters failed", details: err.message });
  }
});

// === Get Single Letter by ID ===
// === Get Single Letter by ID (owner-only) ===
router.get("/:id", auth, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id).populate(
      "uploadedBy",
      "name email"
    );
    if (!letter) 
      return res.status(404).json({ error: "Letter not found" });

    // Only allow the uploader (or admins, if you choose) to view
    if (letter.uploadedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to view this letter" });
    }

    res.json(letter);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Fetching letter failed", details: err.message });
  }
});


// === Update Letter ===
router.put("/:id", auth, async (req, res) => {
  try {
    const updates = req.body;
    const letter = await Letter.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!letter) return res.status(404).json({ error: "Letter not found" });
    res.json({ message: "Letter updated", letter });
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message });
  }
});

// === Delete Letter ===
router.delete("/:id", auth, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ error: "Letter not found" });

    // Build full path to the file
    const filePath = path.join(
      __dirname,
      "../uploads/letters/",
      letter.fileName
    );

    // Delete file from disk
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Failed to delete file:", err);
        // You can choose to continue or return error here
      }
    });

    // Delete letter document
    await letter.deleteOne();

    res.json({ message: "Letter and associated file deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

module.exports = router;
