// routes/groups.js
const express = require("express");
const Group = require("../models/Group.js");
const multer = require("multer");
const { auth } = require("../middlewares/auth.js");
const allowRoles = require("../middlewares/allowRoles.js");
const router = express.Router();
const User = require("../models/User"); // User model
const fs = require("fs");
const path = require("path");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const groupCircularStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/groupCirculars"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const circularDir = path.join(__dirname, "uploads/groupCirculars");
if (!fs.existsSync(circularDir)) {
  fs.mkdirSync(circularDir, { recursive: true });
}

const uploadGroupCircular = multer({
  storage: groupCircularStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const groupNoticeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/groupNotices"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const noticeDir = path.join(__dirname, "uploads/groupNotices");
if (!fs.existsSync(noticeDir)) {
  fs.mkdirSync(noticeDir, { recursive: true });
}

const uploadGroupNotice = multer({
  storage: groupNoticeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const groupADStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/assistantDirector"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const adPhotoDir = path.join(__dirname, "uploads/assistantDirector");
if (!fs.existsSync(adPhotoDir)) {
  fs.mkdirSync(adPhotoDir, { recursive: true });
}

const uploadGroupAD = multer({
  storage: groupADStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

router.get("/id/:id", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("employees", "name email photo")
      .populate("currentAD.user", "name email photo");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const userId = req.user._id.toString();

    //  Allow access if user is a director
    if (req.user.role === "director" || req.user.role === "admin") {
      return res.json(group);
    }

    //  Otherwise, allow only if user is a member of the group
    const isMember = group.employees.some(
      (emp) => emp._id.toString() === userId
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ error: "Access denied: Not a group member" });
    }

    res.json(group);
  } catch (err) {
    console.error("Error fetching group by ID:", err.message);
    res.status(500).json({ error: "Failed to fetch group" });
  }
});


router.get("/my-group", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const group = await Group.findOne({ employees: userId })
      .populate("employees", "name email photo")
      .populate("currentAD.user", "name email photo");

    if (!group) {
      return res.status(404).json({ error: "Group not found for this user" });
    }

    res.json(group);
  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

// GET all groups (with employees & lab populated)
router.get("/", async (req, res) => {
  try {
    console.log("GET /groups called");

    const groups = await Group.find();
    console.log("Groups fetched (raw):", groups);

    const populatedGroups = await Group.find().populate(
      "employees",
      "name email"
    );

    console.log("Groups after populate:", populatedGroups);

    res.json(populatedGroups);
  } catch (err) {
    console.error("❌ Error fetching groups:");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.get("/name", async (req, res) => {
  try {
    const groups = await Group.find().select("name _id"); // Only return name and id
    res.status(200).json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST create new group
router.post("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { labId } = req.params;
    const { name, description, vision, mission, employees, about } = req.body;
    if (!name) return res.status(400).json({ error: "Group name required" });

    const group = new Group({
      name,
      description,
      vision,
      mission,
      labId,
      employees,
      about,
    });
    const saved = await group.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// POST add assistant director history to a group
router.post(
  "/:groupId/assistant-director-history",
  uploadGroupAD.single("image"),
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { user, name, designation, from, to, about } = req.body;

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });

      let resolvedName = name;
      let userId;
      let imageUrl;

      if (user) {
        const existingUser = await User.findById(user);
        if (!existingUser) {
          return res.status(400).json({ message: "User not found" });
        }
        userId = existingUser._id;
        resolvedName = existingUser.name;
        imageUrl = req.file
          ? `/uploads/assistantDirector/${req.file.filename}`
          : existingUser.photo || undefined;
      } else {
        imageUrl = req.file
          ? `/uploads/assistantDirector/${req.file.filename}`
          : undefined;
      }

      // Handle "to" field correctly (convert to null or Date)
      let toDate = null;
      if (to && to.trim() !== "" && to.trim().toLowerCase() !== "null") {
        toDate = new Date(to);
      }

      const newHistory = {
        user: userId,
        name: resolvedName,
        designation,
        from: new Date(from),
        to: toDate,
        about,
        image: imageUrl,
      };

      group.assistantDirectorHistory.push(newHistory);

      // Find latest open-ended (currently serving) entry
      const currentEntry = group.assistantDirectorHistory
        .filter((entry) => !entry.to)
        .sort((a, b) => new Date(b.from) - new Date(a.from))[0];

      if (currentEntry) {
        group.currentAD = currentEntry;
      } else {
        group.currentAD = null;
      }

      await group.save();

      res.status(201).json({
        message: "Assistant Director history added successfully",
        group,
      });
    } catch (error) {
      console.error("Error adding AD history:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET assistant director history for a group
router.get("/:groupId/assistant-director-history", async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate(
      "assistantDirectorHistory.user",
      "name email photo"
    ); // Populate user details in history entries
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.status(200).json(group.assistantDirectorHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// put update assistant director history entry in a group
router.put(
  "/:groupId/assistant-director-history/:historyId",
  uploadGroupAD.single("image"),
  async (req, res) => {
    try {
      const { groupId, historyId } = req.params;
      const { user, name, designation, from, to, about } = req.body;
      console.log("Received body:", req.body);
      // console.log("Updated history entry:", history);  // <-- fixed here

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });

      const history = group.assistantDirectorHistory.id(historyId);
      if (!history)
        return res.status(404).json({ message: "History entry not found" });

      let resolvedName = name;
      let userId;
      let imageUrl;

      if (user) {
        const existingUser = await User.findById(user);
        if (!existingUser) {
          return res.status(400).json({ message: "User not found" });
        }
        userId = existingUser._id;
        resolvedName = existingUser.name;
        imageUrl = req.file
          ? `/uploads/assistantDirector/${req.file.filename}`
          : existingUser.photo || history.image;
      } else {
        imageUrl = req.file
          ? `/uploads/assistantDirector/${req.file.filename}`
          : history.image;
      }

      history.user = userId || undefined;
      history.name = resolvedName || history.name;
      history.designation = designation || history.designation;
      history.from = from ? new Date(from) : history.from;
      history.to = to ? new Date(to) : history.to;
      history.about = about || history.about;
      history.image = imageUrl;

      // Save changes to group
      await group.save();

      // ✅ Update currentAD based on latest assistantDirectorHistory
      const currentEntry = group.assistantDirectorHistory.find(
        (entry) => !entry.to
      );
      group.currentAD = currentEntry?.user || null;
      await group.save(); // Save again to persist currentAD update

      res
        .status(200)
        .json({ message: "Associate Director history updated", group });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE assistant director history entry from a group
router.delete(
  "/:groupId/assistant-director-history/:historyId",
  async (req, res) => {
    try {
      const { groupId, historyId } = req.params;

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });

      const historyEntry = group.assistantDirectorHistory.id(historyId);
      if (!historyEntry)
        return res.status(404).json({ message: "History entry not found" });

      // If image exists and it's stored locally (not from user.profile)
      if (
        historyEntry.image &&
        historyEntry.image.startsWith("/uploads/assistantDirector/")
      ) {
        const imagePath = path.join(__dirname, "..", historyEntry.image);
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Failed to delete image:", err);
        });
      }

      // Remove the history entry
      group.assistantDirectorHistory = group.assistantDirectorHistory.filter(
        (entry) => entry._id.toString() !== historyId
      );

      await group.save();

      res.status(200).json({
        message: "Assistant Director history deleted",
        group,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// UPDATE group details (name, description, vision, mission, employees)
router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const {
      name,
      description,
      about,
      vision,
      mission,
      employees,
      contactInfo,
      GroupHistoryDetails,
    } = req.body;

    const updated = await Group.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        about,
        vision,
        mission,
        employees,
        contactInfo,
        GroupHistoryDetails,
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Group not found" });

    res.json(updated);
  } catch (err) {
    console.error("Error updating group:", err);
    res.status(500).json({ error: "Failed to update" });
  }
});

// POST upload a file to a group's sub-document array

router.post(
  "/:groupId/upload",
  auth,
  allowRoles("admin"),
  upload.single("file"),
  async (req, res) => {
    const { groupId } = req.params;
    const { type, name, description } = req.body;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileUrl = `/uploads/${req.file.filename}`;

    try {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const item = { name, description, fileUrl };

      // Add item to the correct array based on the type
      switch (type) {
        case "project":
          group.projects.push(item);
          break;
        case "patent":
          group.patents.push(item);
          break;
        case "technology":
          group.technologies.push(item);
          break;
        case "publication":
          group.publications.push(item);
          break;
        case "course":
          group.courses.push(item);
          break;
        default:
          return res.status(400).json({ error: "Invalid type" });
      }

      // Save the updated group document
      await group.save();
      res.json({ message: "Uploaded successfully", group: group.toObject() });
    } catch (err) {
      console.error("Error during upload:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// DELETE group
router.delete("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const del = await Group.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: "Group not found" });
    res.json({ message: "Group deleted" });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// GET single group by ID
// router.get("/:id", async (req, res) => {
//   const { id } = req.params;
//   console.log("Incoming GET /group/:id", id);

//   try {
//     const group = await Group.findById(id)
//       .populate("employees", "name email photo")
//       .populate("currentAD", "name email photo about designation from to image");

//     if (!group) {
//       return res.status(404).json({ error: "Group not found" });
//     }

//     res.json(group);
//   } catch (err) {
//     console.error("Fetch error:", err.message);
//     res.status(500).json({ error: "Failed to fetch group" });
//   }
// });

router.delete(
  "/:groupId/delete-document/:docId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    const { groupId, docId } = req.params;
    const { type } = req.query;

    const validTypes = {
      projects: "projects",
      patents: "patents",
      technologies: "technologies",
      publications: "publications",
      courses: "courses",
    };

    const subDocKey = validTypes[type];
    if (!subDocKey) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    try {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });
      console.log("🔍 Group ID:", groupId);
      console.log("🔍 Document ID:", docId);
      console.log("🔍 Document Type:", type);
      console.log("📁 SubDoc Key:", subDocKey);
      console.log("📄 Group[subDocKey]:", group[subDocKey]);

      const docArray = group[subDocKey];
      if (!Array.isArray(docArray)) {
        return res
          .status(400)
          .json({ error: `${subDocKey} array not found in group` });
      }

      const index = docArray.findIndex((doc) => doc._id.toString() === docId);
      if (index === -1) {
        return res.status(404).json({ error: "Document not found in group" });
      }

      // Delete file from disk
      const filePath = path.join(__dirname, "..", docArray[index].fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      // Remove from array
      docArray.splice(index, 1);
      await group.save();

      res.json({ message: "Document deleted successfully", group });
    } catch (err) {
      console.error("❌ Error deleting document:", err.message);
      console.error(err.stack);
      res.status(500).json({ error: "Deletion failed", message: err.message });
    }
  }
);
// Add contact info to a group
router.post(
  "/:groupId/contact-info",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { type, label, value } = req.body;
      if (!type || !value) {
        return res.status(400).json({ error: "Type and value are required" });
      }

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      group.contactInfo = group.contactInfo || [];
      group.contactInfo.push({ type, label, value });

      await group.save();
      res.json({
        message: "Contact info added",
        contactInfo: group.contactInfo,
      });
    } catch (err) {
      console.error("Error adding contact info:", err);
      res.status(500).json({ error: "Failed to add contact info" });
    }
  }
);

// Update a specific contact info entry by its ID
router.put(
  "/:groupId/contact-info/:contactId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { groupId, contactId } = req.params;
      const { type, label, value } = req.body;

      if (!type || !value) {
        return res.status(400).json({ error: "Type and value are required" });
      }

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const contact = group.contactInfo.id(contactId);
      if (!contact)
        return res.status(404).json({ error: "Contact info not found" });

      contact.type = type;
      contact.label = label;
      contact.value = value;

      await group.save();
      res.json({
        message: "Contact info updated",
        contactInfo: group.contactInfo,
      });
    } catch (err) {
      console.error("Error updating contact info:", err);
      res.status(500).json({ error: "Failed to update contact info" });
    }
  }
);

// Delete a specific contact info entry by its ID
router.delete(
  "/:groupId/contact-info/:contactId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { groupId, contactId } = req.params;

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const contact = group.contactInfo.id(contactId);
      if (!contact)
        return res.status(404).json({ error: "Contact info not found" });

      group.contactInfo.pull(contactId); // ✅ Correct way to remove subdoc

      await group.save();
      res.json({
        message: "Contact info deleted",
        contactInfo: group.contactInfo,
      });
    } catch (err) {
      console.error("Error deleting contact info:", err);
      res.status(500).json({ error: "Failed to delete contact info" });
    }
  }
);

router.post(
  "/:id/notices",
  auth,
  allowRoles("admin"),
  uploadGroupNotice.single("file"), // 'file' is the field name in Postman/form
  async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: "group not found" });

      const { name, description } = req.body;
      const fileUrl = req.file
        ? `/uploads/groupNotices/${req.file.filename}`
        : null;

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      group.notices.push({ name, description, fileUrl });
      await group.save();

      res.status(200).json({ message: "Notice added", notices: group.notices });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

// Add a circular to a lab
router.post(
  "/:id/circulars",
  auth,
  allowRoles("admin"),
  uploadGroupCircular.single("file"), // Field name must match in Postman/form
  async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: "group not found" });

      const { name, description } = req.body;
      const fileUrl = req.file
        ? `/uploads/groupCirculars/${req.file.filename}`
        : null;

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      group.circulars.push({ name, description, fileUrl });
      await group.save();

      res
        .status(200)
        .json({ message: "Circular added", circulars: group.circulars });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

// UPDATE a notice
router.put(
  "/:id/notices/:noticeId",
  auth,
  allowRoles("admin"),
  uploadGroupNotice.single("file"),
  async (req, res) => {
    try {
      const { id, noticeId } = req.params;
      const group = await Group.findById(id);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const notice = group.notices.id(noticeId);
      if (!notice) return res.status(404).json({ error: "Notice not found" });

      const { name, description } = req.body;
      if (name) notice.name = name;
      if (description) notice.description = description;
      if (req.file) {
        notice.fileUrl = `/uploads/groupNotices/${req.file.filename}`;
      }

      await group.save();
      res.json({ message: "Notice updated", notices: group.notices });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

// DELETE a notice
router.delete(
  "/:id/notices/:noticeId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id, noticeId } = req.params;
      const group = await Group.findById(id);
      if (!group) return res.status(404).json({ error: "Group not found" });

      group.notices.id(noticeId).remove();
      await group.save();
      res.json({ message: "Notice deleted", notices: group.notices });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

// UPDATE a circular
router.put(
  "/:id/circulars/:circularId",
  auth,
  allowRoles("admin"),
  uploadGroupCircular.single("file"),
  async (req, res) => {
    try {
      const { id, circularId } = req.params;
      const group = await Group.findById(id);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const circ = group.circulars.id(circularId);
      if (!circ) return res.status(404).json({ error: "Circular not found" });

      const { name, description } = req.body;
      if (name) circ.name = name;
      if (description) circ.description = description;
      if (req.file) {
        circ.fileUrl = `/uploads/groupCirculars/${req.file.filename}`;
      }

      await group.save();
      res.json({ message: "Circular updated", circulars: group.circulars });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

// DELETE a circular
router.delete(
  "/:id/circulars/:circularId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id, circularId } = req.params;
      const group = await Group.findById(id);
      if (!group) return res.status(404).json({ error: "Group not found" });

      group.circulars.id(circularId).remove();
      await group.save();
      res.json({ message: "Circular deleted", circulars: group.circulars });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

// contact us routes

router.post("/:groupId/contact-info", async (req, res) => {
  try {
    const { type, label, value } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const contactInfo = { type, label, value };
    group.contactInfo.push(contactInfo);
    await group.save();

    res.status(201).json(group.contactInfo[group.contactInfo.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Update a specific contact info
router.put("/:groupId/contact-info/:contactId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const contact = group.contactInfo.id(req.params.contactId);
    if (!contact)
      return res.status(404).json({ error: "Contact info not found" });

    contact.type = req.body.type || contact.type;
    contact.label = req.body.label || contact.label;
    contact.value = req.body.value || contact.value;

    await group.save();
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Delete a specific contact info
router.delete("/:groupId/contact-info/:contactId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    group.contactInfo.id(req.params.contactId).deleteOne();
    await group.save();

    res.json({ message: "Contact info deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Get all contact info for a group
router.get("/:groupId/contact-info", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    res.json(group.contactInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Office of Assistant Director routes

router.post("/:id/office", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const newOffice = {
      name: req.body.name,
      designation: req.body.designation,
      contactNumber: req.body.contactNumber,
      email: req.body.email,
    };
    // console.log("Adding new office:", newOffice);
    console.log(req.body);
    group.officeOfGroup.push(newOffice);
    await group.save();

    res.status(200).json({
      message: "Office added successfully",
      officeOfGroup: group.officeOfGroup,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:groupId/office/:officeId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const office = group.officeOfGroup.id(req.params.officeId);
    if (!office) return res.status(404).json({ message: "Office not found" });

    office.name = req.body.name || office.name;
    office.designation = req.body.designation || office.designation;
    office.contactNumber = req.body.contactNumber || office.contactNumber;
    office.email = req.body.email || office.email;

    await group.save();
    res.status(200).json({ message: "Office updated", office });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:groupId/office/:officeId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.officeOfGroup.id(req.params.officeId).remove();
    await group.save();

    res.status(200).json({ message: "Office removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
