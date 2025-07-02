const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const Log = require("../models/Log.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth } = require("../middlewares/auth.js");
// const localStorage = require('localStorage');

//register a new user
// routes/auth.js
// router.post("/register", async (req, res) => {
//   try {
//     let { name, email, password, role } = req.body;

//     // Check for existing user
//     const existingUser = await User.findOne({ email });
//     if (existingUser)
//       return res.status(400).json({ error: "User already exists" });

//     // Role logic
//     const finalRole = role === "director" ? "pending_director" : "employee";
//     const hashed = await bcrypt.hash(password, 10);

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password: hashed,
//       role: finalRole,
//     });

//     // Log registration
//     await Log.create({
//       userId: user._id,
//       action: "User registered",
//     });

//     const { password: _, ...userWithoutPassword } = user.toObject();
//     res.status(201).json(userWithoutPassword);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      personalDetails,
      professionalDetails,
      about,
      employmentPeriod,
      lab,
      group,
      closeGroup,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" }); // RETURN here!
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine the final role and status
    const finalRole =
      role === "director" ? "pending_director" : role || "employee";

    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: finalRole,
      personalDetails: {
        name: personalDetails.name,
        dob: personalDetails.dob,
        mobile: personalDetails.mobile,
        address: personalDetails.address,
        gender: personalDetails.gender,
        bloodGroup: personalDetails.bloodGroup,
        maritalStatus: personalDetails.maritalStatus,
        emergencyContact: personalDetails.emergencyContact,
        // emergencyContact: {
        //   name: personalDetails.emergencyContact.name,
        //   relationship: personalDetails.emergencyContact.relationship,
        //   mobile: personalDetails.emergencyContact.mobile,
        // },
      },
      professionalDetails: {
        designation: professionalDetails.designation,
        cadre: professionalDetails.cadre,
        intercom: professionalDetails.intercom,
        internetEmail: professionalDetails.internetEmail,
        dronaEmail: professionalDetails.dronaEmail,
        pis: professionalDetails.pis,
        aebasId: professionalDetails.aebasId,
        joiningDate: professionalDetails.joiningDate,
      },
      about,
      employmentPeriod,
      lab,
      group,
      closeGroup,
    });

    // Log the registration
    await Log.create({
      userId: newUser._id,
      action: "User registered",
    });

    // Send response without password
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) return res.status(400).json({ error: "Invalid credentials" });

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

//   const token = jwt.sign(
//     { id: user._id, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" }
//   );

//   await Log.create({
//     userId: user._id,
//     action: "User logged in",
//   });

//   res.json({
//     token,
//     user: {
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//     },
//   });
// });

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  await Log.create({
    userId: user._id,
    action: "User logged in",
  });

  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

//  Update Profile
router.put("/update-profile", auth, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    await Log.create({ userId: req.user._id, action: "User updated profile" });

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
