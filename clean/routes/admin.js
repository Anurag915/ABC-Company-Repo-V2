const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth, ensureAdmin } = require("../middlewares/auth");
const Log = require("../models/Log.js");
const allowRoles = require("../middlewares/allowRoles");
const CloseGroup = require("../models/CloseGroup.js");
// Approve user and assign lab/group
router.post("/approve-user/:userId", auth, ensureAdmin, async (req, res) => {
  try {
    const { labId, groupId, role } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).send("User not found");

    user.status = "approved";
    user.lab = labId;
    user.group = groupId;

    if (role) {
      if (user.role === "pending_director" && role === "director") {
        user.role = "director";
      } else {
        user.role = role; // fallback (e.g., change from employee to admin)
      }
    }

    await user.save();

    if (groupId) {
      const Group = require("../models/Group");
      await Group.findByIdAndUpdate(groupId, {
        $addToSet: { employees: user._id },
      });
    }

    res.json({ message: "User approved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all pending users
router.get("/pending-users", auth, ensureAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" })
      .populate("lab", "name")
      .populate("group", "name")
      .populate("closeGroup", "groupName")
      .select("-password"); // hide password for security

    res.status(200).json(pendingUsers);
  } catch (error) {
    console.error("Error fetching pending users:", error.message);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
});

router.get("/logs", auth, ensureAdmin, async (req, res) => {
  const logs = await Log.find().populate("userId");
  res.json(logs);
});

router.post("/close-group", auth, ensureAdmin, async (req, res) => {
  try {
    const {
      groupName,
      groupPurpose,
      groupDuration,
      requestedBy,
      adminRemarks,
    } = req.body;

    // Check if group with same name already exists
    const existingGroup = await CloseGroup.findOne({
      groupName: groupName.trim(),
    });
    if (existingGroup) {
      return res
        .status(400)
        .json({ message: "A group with this name already exists." });
    }

    const group = new CloseGroup({
      groupName: groupName.trim(),
      groupPurpose,
      groupDuration,
      requestedBy,
      status: "approved", // direct approval since admin creates
      adminRemarks: adminRemarks || "Created manually by admin",
    });

    await group.save();

    await User.updateMany(
      { _id: { $in: requestedBy } },
      { $addToSet: { closeGroup: group._id } }
    );

    res.status(201).json({ message: "Close group created by admin", group });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.groupName) {
      return res.status(400).json({ error: "Group name already exists" });
    }
    res
      .status(500)
      .json({ message: "Error creating close group", error: err.message });
  }
});

router.get("/close-group", ensureAdmin, async (req, res) => {
  try {
    const groups = await CloseGroup.find().populate(
      "requestedBy",
      "name email"
    );
    res.status(200).json(groups);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching groups", error: err.message });
  }
});

// Get a specific group
router.get("/close-group/:id", ensureAdmin, async (req, res) => {
  try {
    const group = await CloseGroup.findById(req.params.id).populate(
      "requestedBy",
      "name email"
    );
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Update a close group
router.put("/close-group/:id", ensureAdmin, async (req, res) => {
  try {
    const { groupName, groupPurpose, groupDuration, adminRemarks } = req.body;
    const group = await CloseGroup.findByIdAndUpdate(
      req.params.id,
      { groupName, groupPurpose, groupDuration, adminRemarks },
      { new: true }
    );
    res.status(200).json(group);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating group", error: err.message });
  }
});

// Delete a close group
router.delete("/close-group/:id", ensureAdmin, async (req, res) => {
  try {
    const group = await CloseGroup.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    await User.updateMany(
      { closeGroup: group._id },
      { $pull: { closeGroup: group._id } }
    );

    res.status(200).json({ message: "Group deleted", group });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting group", error: err.message });
  }
});

module.exports = router;
