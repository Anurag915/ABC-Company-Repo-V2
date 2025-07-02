const express = require("express");
const router = express.Router();
const CloseGroup = require("../models/CloseGroup");
const upload = require("../middlewares/multer");
const { auth } = require("../middlewares/auth");
const fs = require("fs").promises; // Use promise-based fs
const path = require("path");
// Upload document to a CloseGroup
router.post(
  "/:id/upload",
  auth,
  upload.single("document"),
  async (req, res) => {
    const groupId = req.params.id;

    try {
      const group = await CloseGroup.findById(groupId);
      if (!group)
        return res.status(404).json({ message: "CloseGroup not found" });

      // Check if user belongs to the group
      if (!group.requestedBy.includes(req.user._id)) {
        return res
          .status(403)
          .json({ message: "You are not authorized to upload to this group" });
      }

      // Save document info
      const fileUrl = `/uploads/close-group-documents/${req.file.filename}`;
      group.documents.push({
        uploadedBy: req.user._id,
        filename: req.file.originalname,
        url: fileUrl,
      });

      await group.save();

      res.status(200).json({ message: "Document uploaded", fileUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  }
);
// GET /api/close-groups/:id/documents
router.get("/:id/documents", auth, async (req, res) => {
  try {
    const group = await CloseGroup.findById(req.params.id).populate(
      "documents.uploadedBy",
      "name email"
    );

    if (!group)
      return res.status(404).json({ message: "CloseGroup not found" });

    // Only members or admins can view
    if (
      !group.requestedBy.includes(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(group.documents);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/:groupId/documents/:docId", auth, async (req, res) => {
  try {
    const { groupId, docId } = req.params;
    const group = await CloseGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const doc = group.documents.find((d) => d._id.toString() === docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (!doc.uploadedBy.equals(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const filePath = path.join(__dirname, "..", doc.url);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn("File unlink warning:", err.message);
    }

    // Remove doc manually
    group.documents = group.documents.filter(d => d._id.toString() !== docId);

    await group.save();

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Error deleting document", error: error.message });
  }
});



// PUT /api/close-groups/:groupId/documents/:docId
router.put("/:groupId/documents/:docId", auth, async (req, res) => {
  const { newFilename } = req.body;

  try {
    const group = await CloseGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const doc = group.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Only uploader or admin can rename
    if (!doc.uploadedBy.equals(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    doc.filename = newFilename;
    await group.save();

    res.status(200).json({ message: "Filename updated", updatedDoc: doc });
  } catch (err) {
    res.status(500).json({ message: "Error updating document" });
  }
});

module.exports = router;
