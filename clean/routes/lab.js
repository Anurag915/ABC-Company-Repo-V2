const express = require("express");
const Lab = require("../models/Lab.js");
const { auth } = require("../middlewares/auth.js");
const allowRoles = require("../middlewares/allowRoles.js");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const User = require("../models/User.js");
const path = require("path");
const Project = require("../models/Project.js");
const TechnologyDeveloped = require("../models/TechnologyDeveloped.js");
const Patent = require("../models/Patent.js");
const CourseConducted = require("../models/CourseConducted.js");
const Publication = require("../models/Publication.js");

// ==== Gallery Upload ====
const galleryDir = path.join(__dirname, "../uploads/labPhotos");
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}
const galleryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, galleryDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const galleryUpload = multer({
  storage: galleryStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    if (extName && mimeType) cb(null, true);
    else cb(new Error("Only JPG, JPEG, and PNG files are allowed"));
  },
});

// ==== Notices Upload ====
const noticeDir = path.join(__dirname, "../uploads/notices");
if (!fs.existsSync(noticeDir)) {
  fs.mkdirSync(noticeDir, { recursive: true });
}
const noticeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, noticeDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage: noticeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// ==== Products Upload ====
const productDir = path.join(__dirname, "../uploads/products");
if (!fs.existsSync(productDir)) {
  fs.mkdirSync(productDir, { recursive: true });
}
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// ==== Circulars Upload ====
const circularDir = path.join(__dirname, "../uploads/circulars");
if (!fs.existsSync(circularDir)) {
  fs.mkdirSync(circularDir, { recursive: true });
}
const circularStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, circularDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const uploadCircular = multer({
  storage: circularStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ==== Advertisements Upload ====
const advertisementDir = path.join(__dirname, "../uploads/advertisements");
if (!fs.existsSync(advertisementDir)) {
  fs.mkdirSync(advertisementDir, { recursive: true });
}
const advertisementStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, advertisementDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const uploadAdvertisement = multer({
  storage: advertisementStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ==== Directors Upload ====
const directorDir = path.join(__dirname, "../uploads/directors");
if (!fs.existsSync(directorDir)) {
  fs.mkdirSync(directorDir, { recursive: true });
}
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, directorDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `director_${Date.now()}${ext}`);
  },
});
const photoUpload = multer({ storage: photoStorage });




router.get("/only", async (req, res) => {
  try {
    const lab = await Lab.findOne();
    if (!lab) return res.status(404).json({ message: "No lab found" });
    res.json(lab);
  } catch (error) {
    res.status(500).json({ message: "Error fetching lab" });
  }
});

// GET all labs with full details
router.get("/", async (req, res) => {
  try {
    const labs = await Lab.find()
      .populate("manpowerList")
      .populate("technologiesDeveloped")
      .populate("courses")
      .populate("projects")
      .populate("publications")
      .populate("patents")
      .populate({
        path: "directorHistory.user",
        select: "name email photo",
      });

    const processedLabs = labs.map((lab) => {
      const labObj = lab.toObject();

      const prependImageURL = (imgPath) =>
        imgPath ? `${req.protocol}://${req.get("host")}/${imgPath}` : null;

      labObj.directorHistory = labObj.directorHistory.map((director) => {
        if (director.user && director.user.photo) {
          director.photo = prependImageURL(director.user.photo);
        } else if (director.image) {
          director.photo = prependImageURL(director.image);
        } else {
          director.photo = null;
        }
        return director;
      });

      if (labObj.currentDirector) {
        if (labObj.currentDirector.user?.photo) {
          labObj.currentDirector.photo = prependImageURL(
            labObj.currentDirector.user.photo
          );
        } else if (labObj.currentDirector.image) {
          labObj.currentDirector.photo = prependImageURL(
            labObj.currentDirector.image
          );
        } else {
          labObj.currentDirector.photo = null;
        }
      }

      return labObj;
    });

    res.json(processedLabs);
  } catch (error) {
    console.error("Error fetching labs:", error);
    res.status(500).json({ error: "Failed to fetch labs" });
  }
});

// GET lab by ID with full details
router.get("/:id", async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id)
      .populate("manpowerList")
      .populate("technologiesDeveloped")
      .populate("courses")
      .populate("projects")
      .populate("publications")
      .populate("patents")
      .populate({
        path: "directorHistory.user",
        select: "name email photo",
      });

    if (!lab) return res.status(404).json({ error: "Lab not found" });

    const labObj = lab.toObject();
    const prependImageURL = (imgPath) =>
      imgPath ? `${req.protocol}://${req.get("host")}/${imgPath}` : null;

    labObj.directorHistory = labObj.directorHistory.map((director) => {
      if (director.user && director.user.photo) {
        director.photo = prependImageURL(director.user.photo);
      } else if (director.image) {
        director.photo = prependImageURL(director.image);
      } else {
        director.photo = null;
      }
      return director;
    });

    if (labObj.currentDirector) {
      if (labObj.currentDirector.user?.photo) {
        labObj.currentDirector.photo = prependImageURL(
          labObj.currentDirector.user.photo
        );
      } else if (labObj.currentDirector.image) {
        labObj.currentDirector.photo = prependImageURL(
          labObj.currentDirector.image
        );
      } else {
        labObj.currentDirector.photo = null;
      }
    }

    res.json(labObj);
  } catch (err) {
    console.error("Error fetching lab:", err);
    res.status(400).json({ error: "Invalid lab ID" });
  }
});

// POST create a new lab (admin only)
router.post("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { name, mission, vision, about, domain } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Lab name is required" });
    }

    const labData = {
      name: name.trim(),
      mission: mission?.trim() || "",
      vision: vision?.trim() || "",
      about: about?.trim() || "",
      domain: domain?.trim() || "",
    };

    const newLab = await Lab.create(labData);
    res.status(201).json(newLab);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.name) {
      return res.status(400).json({ error: "Lab name must be unique" });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT update lab by ID (admin only)
router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const updatedLab = await Lab.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedLab) return res.status(404).json({ error: "Lab not found" });
    res.json(updatedLab);
  } catch (err) {
    res
      .status(400)
      .json({ error: "Failed to update lab", details: err.message });
  }
});

// Add a notice to a lab
router.post(
  "/:id/notices",
  auth,
  allowRoles("admin"),
  upload.single("file"), // 'file' is the field name in Postman/form
  async (req, res) => {
    try {
      const lab = await Lab.findById(req.params.id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const { name, description } = req.body;
      const fileUrl = req.file ? `/uploads/notices/${req.file.filename}` : null;

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      lab.notices.push({ name, description, fileUrl });
      await lab.save();

      res.status(200).json({ message: "Notice added", notices: lab.notices });
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
  uploadCircular.single("file"), // Field name must match in Postman/form
  async (req, res) => {
    try {
      const lab = await Lab.findById(req.params.id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const { name, description } = req.body;
      const fileUrl = req.file
        ? `/uploads/circulars/${req.file.filename}`
        : null;

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      lab.circulars.push({ name, description, fileUrl });
      await lab.save();

      res
        .status(200)
        .json({ message: "Circular added", circulars: lab.circulars });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

// Add a advertisement to a lab
router.post(
  "/:labId/advertisements",
  auth,
  allowRoles("admin"),
  uploadAdvertisement.single("file"),
  async (req, res) => {
    try {
      const { labId } = req.params;
      const { name, description } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File is required." });
      }

      const fileUrl = req.file
        ? `/uploads/advertisements/${req.file.filename}`
        : null;
      const advertisement = {
        name,
        description,
        fileUrl,
      };

      const updatedLab = await Lab.findByIdAndUpdate(
        labId,
        { $push: { advertisements: advertisement } },
        { new: true }
      );

      if (!updatedLab) {
        return res.status(404).json({ message: "Lab not found" });
      }

      res.status(201).json({ message: "Advertisement added", advertisement });
    } catch (error) {
      console.error("Error posting advertisement:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//put request for advertisment
router.put(
  "/:labId/advertisements/:id",
  auth,
  allowRoles("admin"),
  uploadAdvertisement.single("file"),
  async (req, res) => {
    try {
      const { labId, id } = req.params;
      const { name, description } = req.body;
      const file = req.file;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const ad = lab.advertisements.id(id);
      if (!ad)
        return res.status(404).json({ message: "Advertisement not found" });

      // Store old file path
      const oldFilePath = ad.fileUrl
        ? path.join(__dirname, "..", ad.fileUrl)
        : null;

      // Update fields
      ad.name = name || ad.name;
      ad.description = description || ad.description;

      if (file) {
        ad.fileUrl = `/uploads/advertisements/${file.filename}`;

        // Delete old file from server
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error("Error deleting old file:", err);
          });
        }
      }

      await lab.save();
      res.json({ message: "Advertisement updated", advertisement: ad });
    } catch (error) {
      console.error("Error updating advertisement:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete advertisement
router.delete(
  "/:labId/advertisements/:adId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { labId, adId } = req.params;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const ad = lab.advertisements.id(adId);
      if (!ad)
        return res.status(404).json({ message: "Advertisement not found" });

      // Extract filename from fileUrl
      const filename = path.basename(ad.fileUrl); // This gives '12345-myfile.pdf'

      // Build absolute file path
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        "advertisements",
        filename
      );

      // Delete the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove advertisement entry from DB
      ad.deleteOne(); // Remove the embedded subdocument
      await lab.save();

      res.json({
        message: "Advertisement and associated file deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//Deletion of project , patents, technologiesDeveloped, courses, publications
const deleteAndUnreference = async (labId, field, itemId, Model) => {
  const lab = await Lab.findByIdAndUpdate(
    labId,
    { $pull: { [field]: itemId } },
    { new: true }
  );
  if (!lab) throw new Error("Lab not found");

  const deleted = await Model.findByIdAndDelete(itemId);
  if (!deleted) throw new Error(`${field} document not found`);

  return lab;
};

// Delete Project
router.delete(
  "/:labId/projects/:projectId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const lab = await deleteAndUnreference(
        req.params.labId,
        "projects",
        req.params.projectId,
        Project
      );
      res.json({ message: "Project deleted and removed from lab", lab });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Delete Technology Developed
router.delete(
  "/:labId/technologies/:techId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const lab = await deleteAndUnreference(
        req.params.labId,
        "technologiesDeveloped",
        req.params.techId,
        TechnologyDeveloped
      );
      res.json({ message: "Technology deleted and removed from lab", lab });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Delete Patent
router.delete(
  "/:labId/patents/:patentId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const lab = await deleteAndUnreference(
        req.params.labId,
        "patents",
        req.params.patentId,
        Patent
      );
      res.json({ message: "Patent deleted and removed from lab", lab });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Delete Course Conducted
router.delete(
  "/:labId/courses/:courseId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const lab = await deleteAndUnreference(
        req.params.labId,
        "courses",
        req.params.courseId,
        CourseConducted
      );
      res.json({ message: "Course deleted and removed from lab", lab });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Delete Publication
router.delete(
  "/:labId/publications/:publicationId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const lab = await deleteAndUnreference(
        req.params.labId,
        "publications",
        req.params.publicationId,
        Publication
      );
      res.json({ message: "Publication deleted and removed from lab", lab });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// Add a product to a lab
router.post(
  "/:labId/products",
  auth,
  allowRoles("admin"),
  uploadProduct.single("file"), // You can rename this multer config if needed
  async (req, res) => {
    try {
      const { labId } = req.params;
      const { name, description } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File is required." });
      }

      const fileUrl = req.file
        ? `/uploads/products/${req.file.filename}` // You can rename directory to /uploads/products
        : null;

      const product = {
        name,
        description,
        fileUrl,
      };

      const updatedLab = await Lab.findByIdAndUpdate(
        labId,
        { $push: { products: product } },
        { new: true }
      );

      if (!updatedLab) {
        return res.status(404).json({ message: "Lab not found" });
      }

      res.status(201).json({ message: "Product added", product });
    } catch (error) {
      console.error("Error posting product:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/:labId/products/:id",
  auth,
  allowRoles("admin"),
  uploadProduct.single("file"),
  async (req, res) => {
    try {
      const { labId, id } = req.params;
      const { name, description } = req.body;
      const file = req.file;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const ad = lab.products.id(id);
      if (!ad) return res.status(404).json({ message: "products not found" });

      // Store old file path
      const oldFilePath = ad.fileUrl
        ? path.join(__dirname, "..", ad.fileUrl)
        : null;

      // Update fields
      ad.name = name || ad.name;
      ad.description = description || ad.description;

      if (file) {
        ad.fileUrl = `/uploads/products/${file.filename}`;

        // Delete old file from server
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error("Error deleting old file:", err);
          });
        }
      }

      await lab.save();
      res.json({ message: "products updated", product: ad });
    } catch (error) {
      console.error("Error updating products:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete(
  "/:labId/products/:adId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { labId, adId } = req.params;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const ad = lab.products.id(adId);
      if (!ad) return res.status(404).json({ message: "Products not found" });

      // Extract filename from fileUrl
      const filename = path.basename(ad.fileUrl); // This gives '12345-myfile.pdf'

      // Build absolute file path
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        "products",
        filename
      );

      // Delete the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove advertisement entry from DB
      ad.deleteOne(); // Remove the embedded subdocument
      await lab.save();

      res.json({
        message: "Products and associated file deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting Products:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/:id/products-advertisements", async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id).select(
      "products advertisements"
    );
    if (!lab) return res.status(404).json({ message: "Lab not found" });

    res.json({
      products: lab.products,
      advertisements: lab.advertisements,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

//director post requeste

router.get("/:labId/directors", async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.labId)
      .populate("directorHistory.user") // populate user reference
      .populate("currentDirector.user");

    if (!lab) return res.status(404).json({ message: "Lab not found" });

    res.json({
      directorHistory: lab.directorHistory || [],
      currentDirector: lab.currentDirector || null,
    });
  } catch (err) {
    console.error("Error fetching directors", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add a director to a lab
// router.post(
//   "/:labId/directors",
//   auth,
//   allowRoles("admin"),
//   async (req, res) => {
//     try {
//       const { labId } = req.params;
//       // const { user, name, designation, image, from, to, about } = req.body;
//       console.log(req.body)
//       const { user, name, designation, from, to, about } = req.body || {};

//       if (!from) {
//         return res.status(400).json({ message: "'from' date is required" });
//       }

//       const lab = await Lab.findById(labId);
//       if (!lab) {
//         return res.status(404).json({ message: "Lab not found" });
//       }

//       const newDirector = {
//         from: new Date(from),
//         to: to ? new Date(to) : null,
//         about: about || "",
//       };

//       if (user) {
//         // End current director's term if any
//         if (lab.currentDirector) {
//           const currentDirectorEntry = lab.directorHistory.find(
//             (d) =>
//               d.user?.toString() === lab.currentDirector.toString() && !d.to
//           );
//           if (currentDirectorEntry) {
//             currentDirectorEntry.to = new Date(from);
//           }
//         }

//         newDirector.user = user;
//         lab.currentDirector = user;
//       } else {
//         // Manual entry
//         newDirector.name = name || "Unknown";
//         newDirector.designation = designation || "Unknown";
//         newDirector.image = image || null;

//         // If no user provided, clear currentDirector if needed
//         lab.currentDirector = undefined;
//       }

//       lab.directorHistory.push(newDirector);
//       await lab.save();
//       await lab.populate("directorHistory.user", "name email photo");

//       res.status(201).json({
//         message: "Director added successfully",
//         director: newDirector,
//       });
//     } catch (error) {
//       console.error("Error adding director:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

router.post(
  "/:labId/directors",
  auth,
  allowRoles("admin"),
  photoUpload.single("image"), // this must match the frontend field name
  async (req, res) => {
    try {
      const {
        user,
        name,
        designation = "Director",
        from,
        to,
        about,
      } = req.body;

      if (!user && !name) {
        return res.status(400).json({ message: "User or name is required" });
      }

      const imagePath = req.file
        ? `/uploads/directors/${req.file.filename}`
        : null;

      const lab = await Lab.findById(req.params.labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const newDirector = {
        user: user || undefined,
        name: name || undefined,
        designation,
        from,
        to: to || null,
        about,
        image: imagePath,
      };

      lab.directorHistory.push(newDirector);

      // If no "to" field, assume this is the current director
      if (!to) {
        lab.currentDirector = newDirector;
      }

      await lab.save();
      res.status(201).json({ message: "Director added successfully" });
    } catch (err) {
      console.error("Error adding director:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update a director in the history
// router.put(
//   "/:labId/directors/:directorId",
//   auth,
//   allowRoles("admin"),
//   photoUpload.single("image"),
//   async (req, res) => {
//     try {
//       const { labId, directorId } = req.params;
//       const { user, name, designation, from, to, about } = req.body;

//       const lab = await Lab.findById(labId);
//       if (!lab) {
//         return res.status(404).json({ message: "Lab not found" });
//       }

//       const directorIndex = lab.directorHistory.findIndex(
//         (d) => d._id.toString() === directorId
//       );

//       if (directorIndex === -1) {
//         return res.status(404).json({
//           message: "Director not found in history",
//         });
//       }

//       const director = lab.directorHistory[directorIndex];

//       director.from = new Date(from);
//       director.to = to ? new Date(to) : null;
//       director.about = about || "";
//       // director.image = `/uploads/directors/${req.file.filename}`;
//       if (req.file) {
//         director.image = `/uploads/directors/${req.file.filename}`;
//       }

//       if (user) {
//         director.user = user;
//         director.name = name;
//         director.designation = undefined;
//         director.image = `/uploads/directors/${req.file.filename}`;
//       } else {
//         director.user = undefined;
//         director.name = name || "Unknown";
//         director.designation = designation || "Unknown";

//         if (req.file) {
//           director.image = `/uploads/directors/${req.file.filename}`;
//         } else if (req.body.image) {
//           director.image = req.body.image;
//         } else {
//           director.image = null;
//         }
//       }

//       await lab.save();

//       if (user) {
//         const updateData = { about };
//         if (req.file) {
//           updateData.photo = `/uploads/directors/${req.file.filename}`;
//         }
//         await User.findByIdAndUpdate(user, updateData, { new: true });
//       }

//       await lab.populate("directorHistory.user", "name email photo");

//       res.status(200).json({
//         message: "Director updated successfully",
//         directorId,
//       });
//     } catch (error) {
//       console.error("Error updating director:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// router.put(
//   "/:labId/directors/:directorId",
//   auth,
//   allowRoles("admin"),
//   photoUpload.single("image"),
//   async (req, res) => {
//     try {
//       const { labId, directorId } = req.params;
//       const { user, name, designation, from, to, about } = req.body;

//       if (!from) {
//         return res.status(400).json({ message: "`from` date is required" });
//       }

//       const parsedFrom = new Date(from);
//       const parsedTo = to ? new Date(to) : null;

//       if (isNaN(parsedFrom.getTime())) {
//         return res.status(400).json({ message: "`from` is not a valid date" });
//       }
//       if (to && isNaN(parsedTo.getTime())) {
//         return res.status(400).json({ message: "`to` is not a valid date" });
//       }

//       const lab = await Lab.findById(labId);
//       if (!lab) {
//         return res.status(404).json({ message: "Lab not found" });
//       }

//       const directorIndex = lab.directorHistory.findIndex(
//         (d) => d._id.toString() === directorId
//       );

//       if (directorIndex === -1) {
//         return res
//           .status(404)
//           .json({ message: "Director not found in history" });
//       }

//       const director = lab.directorHistory[directorIndex];

//       // Update only provided fields (preserve existing values if not passed)
//       director.from = parsedFrom;
//       director.to = parsedTo;

//       if (typeof about !== "undefined") {
//         director.about = about;
//       }

//       if (user) {
//         director.user = user;
//         if (typeof name !== "undefined") director.name = name;
//         director.designation = undefined;
//       } else {
//         director.user = undefined;
//         if (typeof name !== "undefined") director.name = name;
//         if (typeof designation !== "undefined")
//           director.designation = designation;
//       }

//       // Handle image upload safely
//       if (req.file) {
//         director.image = `/uploads/directors/${req.file.filename}`;
//       } else if (req.body.image) {
//         director.image = req.body.image;
//       }

//       // Update User profile if linked
//       if (user) {
//         const updateData = {};
//         if (typeof about !== "undefined") updateData.about = about;
//         if (req.file) {
//           updateData.photo = `/uploads/directors/${req.file.filename}`;
//         }
//         await User.findByIdAndUpdate(user, updateData, { new: true });
//       }

//       // Update currentDirector from updated directorHistory
//       // if (!parsedTo) {
//       //   // This is the new current director
//       //   lab.currentDirector = lab.directorHistory[directorIndex];
//       // } else if (
//       //   lab.currentDirector &&
//       //   lab.currentDirector._id?.toString() === directorId
//       // ) {
//       //   // If current director is ending term
//       //   lab.currentDirector = null;
//       // }

//       // Check if the currentDirector matches the one being edited
//       const isCurrentDirector =
//         lab.currentDirector &&
//         lab.currentDirector.name === director.name &&
//         new Date(lab.currentDirector.from).getTime() === parsedFrom.getTime();

//       // Update currentDirector based on new "to" field
//       if (!parsedTo) {
//         // Assign as new current director
//         lab.currentDirector = lab.directorHistory[directorIndex];
//       } else if (isCurrentDirector) {
//         // If same director was current and now has "to", remove it
//         lab.currentDirector = null;
//       }

//       await lab.save();

//       await lab.populate("directorHistory.user", "name email photo");

//       res.status(200).json({
//         message: "Director updated successfully",
//         directorId,
//       });
//     } catch (error) {
//       console.error("Error updating director:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

router.put(
  "/:labId/directors/:directorId",
  auth,
  allowRoles("admin"),
  photoUpload.single("image"),
  async (req, res) => {
    try {
      const { labId, directorId } = req.params;
      const { user, name, designation, from, to, about } = req.body;

      if (!from) {
        return res.status(400).json({ message: "`from` date is required" });
      }

      const parsedFrom = new Date(from);
      const parsedTo = to ? new Date(to) : null; // parsedTo will be a Date object or null

      if (isNaN(parsedFrom.getTime())) {
        return res.status(400).json({ message: "`from` is not a valid date" });
      }
      if (to && isNaN(parsedTo.getTime())) {
        return res.status(400).json({ message: "`to` is not a valid date" });
      }

      const lab = await Lab.findById(labId);
      if (!lab) {
        return res.status(404).json({ message: "Lab not found" });
      }

      const directorIndex = lab.directorHistory.findIndex(
        (d) => d._id.toString() === directorId
      );

      if (directorIndex === -1) {
        return res
          .status(404)
          .json({ message: "Director not found in history" });
      }

      const director = lab.directorHistory[directorIndex]; // This is the specific director subdocument being updated

      // Update only provided fields (preserve existing values if not passed)
      director.from = parsedFrom;
      director.to = parsedTo;

      if (typeof about !== "undefined") {
        director.about = about;
      }

      if (user) {
        director.user = user;
        if (typeof name !== "undefined") director.name = name;
        director.designation = undefined;
      } else {
        director.user = undefined;
        if (typeof name !== "undefined") director.name = name;
        if (typeof designation !== "undefined")
          director.designation = designation;
      }

      // Handle image upload safely
      if (req.file) {
        director.image = `/uploads/directors/${req.file.filename}`;
      } else if (req.body.image) {
        director.image = req.body.image;
      }

      // Update User profile if linked
      if (user) {
        const updateData = {};
        if (typeof about !== "undefined") updateData.about = about;
        if (req.file) {
          updateData.photo = `/uploads/directors/${req.file.filename}`;
        }
        await User.findByIdAndUpdate(user, updateData, { new: true });
      }

      // --- CRITICAL LOGIC FOR `currentDirector` UPDATE ---

      // Check if the director being updated is currently set as the lab's currentDirector
      // It's best to compare by _id for accuracy.
      const isDirectorBeingUpdatedCurrent =
        lab.currentDirector &&
        lab.currentDirector.from &&
        lab.currentDirector.name &&
        lab.currentDirector.name === director.name &&
        new Date(lab.currentDirector.from).getTime() === parsedFrom.getTime();

      // Logic to update currentDirector based on the new 'to' field
      if (parsedTo) {
        // If a 'to' date is provided (meaning the director's term is ending or has ended)
        if (isDirectorBeingUpdatedCurrent) {
          // If the director being updated WAS the current director, unset currentDirector
          lab.currentDirector = null;
        }
        // If parsedTo exists but the director being updated is NOT the current director,
        // then lab.currentDirector should remain unchanged (correct behavior).
      } else {
        // If 'to' is NOT provided (meaning this director is the new current director or term is ongoing)
        lab.currentDirector = director; // Assign the updated director object as the new current director
      }

      // --- END CRITICAL LOGIC ---

      await lab.save();

      // Populate after saving if you need the populated user data in the response
      await lab.populate("directorHistory.user", "name email photo");

      res.status(200).json({
        message: "Director updated successfully",
        directorId,
      });
    } catch (error) {
      console.error("Error updating director:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete a director by directorId in a specific lab
// router.delete(
//   "/:labId/directors/:directorId",
//   auth,
//   allowRoles("admin"),
//   async (req, res) => {
//     try {
//       const { labId, directorId } = req.params;

//       const updatedLab = await Lab.findByIdAndUpdate(
//         labId,
//         { $pull: { directorHistory: { _id: directorId } } },
//         { new: true }
//       );

//       if (!updatedLab) {
//         return res.status(404).json({ message: "Lab or Director not found" });
//       }

//       res.status(200).json({ message: "Director deleted", directorId });
//     } catch (error) {
//       console.error("Error deleting director:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

router.delete(
  "/:labId/directors/:directorId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { labId, directorId } = req.params;

      const lab = await Lab.findById(labId);
      if (!lab) {
        return res.status(404).json({ message: "Lab not found" });
      }

      // Find the director being deleted
      const deletedDirector = lab.directorHistory.find(
        (d) => d._id.toString() === directorId
      );

      if (!deletedDirector) {
        return res
          .status(404)
          .json({ message: "Director not found in history" });
      }

      // Remove the director from the history
      lab.directorHistory = lab.directorHistory.filter(
        (d) => d._id.toString() !== directorId
      );

      // If currentDirector matches the one being deleted, remove it
      const isCurrentDirector =
        lab.currentDirector &&
        lab.currentDirector.name === deletedDirector.name &&
        new Date(lab.currentDirector.from).getTime() ===
          new Date(deletedDirector.from).getTime();

      if (isCurrentDirector) {
        lab.currentDirector = null;
      }

      await lab.save();

      res.status(200).json({
        message: "Director deleted successfully",
        directorId,
      });
    } catch (error) {
      console.error("Error deleting director:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update a notice or circular
router.put(
  "/:id/notices/:noticeId",
  auth,
  allowRoles("admin"),
  upload.single("file"),
  async (req, res) => {
    const { id, noticeId } = req.params;

    try {
      const name = (req.body.name || "").trim();
      const description = (req.body.description || "").trim();
      const fileUrl = req.file
        ? `/uploads/notices/${req.file.filename}` // relative URL here
        : (req.body.fileUrl || "").trim();

      // If file is uploaded, create fileUrl from file info
      // const fileUrl = req.file ? req.file.path : req.body.fileUrl;
      console.log("req.body:", req.body);
      console.log("req.file:", req.file);

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const lab = await Lab.findById(id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const notice = lab.notices.id(noticeId);
      if (!notice) return res.status(404).json({ error: "Notice not found" });

      // Update notice fields
      notice.name = name;
      notice.description = description;
      notice.fileUrl = fileUrl;

      await lab.save();
      res.json({ message: "Notice updated successfully", notice });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update a circular
router.put(
  "/:id/circulars/:circularId",
  auth,
  allowRoles("admin"),
  uploadCircular.single("file"), // assumes you're uploading a file
  async (req, res) => {
    try {
      const { id, circularId } = req.params;

      // Defensive extraction and trimming
      const name = (req.body.name || "").trim();
      const description = (req.body.description || "").trim();
      const fileUrl = req.file
        ? `/uploads/circulars/${req.file.filename}` // relative URL here
        : (req.body.fileUrl || "").trim();

      if (!name || !description || !fileUrl) {
        console.log("Missing field(s):", { name, description, fileUrl });
        return res.status(400).json({ error: "All fields are required" });
      }

      const lab = await Lab.findById(id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const circular = lab.circulars.id(circularId);
      if (!circular)
        return res.status(404).json({ error: "Circular not found" });

      // Update fields
      circular.name = name;
      circular.description = description;
      circular.fileUrl = fileUrl;

      await lab.save();
      res.json({ message: "Circular updated successfully", circular });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// deletion of notice
router.delete(
  "/:id/notices/:noticeId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id, noticeId } = req.params;

      const lab = await Lab.findById(id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const notice = lab.notices.id(noticeId);
      if (!notice) return res.status(404).json({ error: "Notice not found" });

      // Delete the associated file from the server
      const filePath = path.join(__dirname, "..", notice.fileUrl); // Assuming fileUrl is relative like "uploads/notices/filename.pdf"
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove notice from array
      lab.notices.pull(noticeId);
      await lab.save();

      res.json({ message: "Notice deleted successfully" });
    } catch (error) {
      console.error("Delete Notice Error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  }
);

// deletion of circular
router.delete(
  "/:id/circulars/:circularId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id, circularId } = req.params;

      const lab = await Lab.findById(id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const circular = lab.circulars.id(circularId);
      if (!circular)
        return res.status(404).json({ error: "Circular not found" });

      // Delete associated file from server
      const filePath = path.join(__dirname, "..", circular.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove circular from array
      lab.circulars.pull(circularId);
      await lab.save();

      res.json({ message: "Circular deleted successfully" });
    } catch (error) {
      console.error("Delete Circular Error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  }
);
// GET /api/labs/:id/documents
router.get("/:id/documents", async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id); // Assuming your Lab model is imported
    if (!lab) {
      return res.status(404).json({ error: "Lab not found" });
    }

    res.json({
      notices: lab.notices || [],
      circulars: lab.circulars || [],
    });
  } catch (error) {
    console.error("Error fetching lab documents:", error);
    res.status(500).json({ error: "Failed to fetch lab documents" });
  }
});

//office of director
// POST a new officeOfDirector member
router.post(
  "/:labId/office-of-director",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { labId } = req.params;
      const newMember = req.body; // { name, designation, contactNumber, email }

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      lab.officeOfDirector.push(newMember);
      await lab.save();

      res.status(201).json({
        message: "Member added successfully",
        officeOfDirector: lab.officeOfDirector,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// PUT update an officeOfDirector member
// UPDATE an officeOfDirector member
router.put(
  "/:labId/office-of-director/:memberId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { labId, memberId } = req.params;
      const updatedData = req.body; // { name, designation, contactNumber, email }

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const member = lab.officeOfDirector.id(memberId);
      if (!member) return res.status(404).json({ message: "Member not found" });

      Object.assign(member, updatedData);
      await lab.save();

      res.json({
        message: "Member updated successfully",
        officeOfDirector: lab.officeOfDirector,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// DELETE an officeOfDirector member

// DELETE an officeOfDirector member
router.delete(
  "/:labId/office-of-director/:memberId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { labId, memberId } = req.params;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const member = lab.officeOfDirector.id(memberId);
      if (!member) return res.status(404).json({ message: "Member not found" });

      member.remove();
      await lab.save();

      res.json({
        message: "Member deleted successfully",
        officeOfDirector: lab.officeOfDirector,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Upload and manage lab photos
router.post(
  "/:labId/upload-photo",
  auth,
  allowRoles("admin"),
  galleryUpload.single("photo"),
  async (req, res) => {
    try {
      const { labId } = req.params;
      const { name, description } = req.body;
      const fileUrl = `/uploads/labPhotos/${req.file.filename}`;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      lab.labPhotos.push({ name, description, fileUrl });
      await lab.save();

      res.status(200).json({
        message: "Photo uploaded successfully",
        photo: { name, description, fileUrl },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.put(
  "/:labId/photos/:photoId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const lab = await Lab.findById(req.params.labId);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const photo = lab.labPhotos.id(req.params.photoId);
      if (!photo) return res.status(404).json({ error: "Photo not found" });

      photo.name = name || photo.name;
      photo.description = description || photo.description;

      await lab.save();
      res.status(200).json({ message: "Photo updated", photo });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// router.delete("/:labId/photos/:photoId", async (req, res) => {
//   try {
//     const lab = await Lab.findById(req.params.labId);
//     if (!lab) return res.status(404).json({ error: "Lab not found" });

//     const photo = lab.labPhotos.id(req.params.photoId);
//     if (!photo) return res.status(404).json({ error: "Photo not found" });

//     const filePath = path.join(__dirname, "..", "public", photo.fileUrl);
//     console.log("Trying to delete:", filePath);

//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//       console.log("File deleted from disk");
//     } else {
//       console.warn("File not found at:", filePath);
//     }

//     lab.labPhotos.pull({ _id: req.params.photoId });
//     await lab.save();

//     res.status(200).json({ message: "Photo deleted from DB and disk" });
//   } catch (err) {
//     console.error("Deletion error:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });


router.delete("/:labId/photos/:photoId", async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.labId);
    if (!lab) return res.status(404).json({ error: "Lab not found" });

    const photo = lab.labPhotos.id(req.params.photoId);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    // Construct the correct path assuming you saved files in ../uploads/labPhotos/
    const uploadsDir = path.join(__dirname, "../uploads/labPhotos");
    const filePath = path.join(uploadsDir, path.basename(photo.fileUrl));

    console.log("Trying to delete:", filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("File deleted from disk");
    } else {
      console.warn("File not found at:", filePath);
    }

    lab.labPhotos.pull({ _id: req.params.photoId });
    await lab.save();

    res.status(200).json({ message: "Photo deleted from DB and disk" });
  } catch (err) {
    console.error("Deletion error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:labId/photos", async (req, res) => {
  const { labId } = req.params;
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const lab = await Lab.findById(labId).select("labPhotos");
    if (!lab) return res.status(404).json({ error: "Lab not found" });

    // Paginate the photos array manually
    const photos = lab.labPhotos.slice(skip, skip + limit);
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// POST /api/labs/:labId/external-links
router.post(
  "/:labId/external-links",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { title, url, description } = req.body;
      const lab = await Lab.findById(req.params.labId);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      lab.externalLinks.push({ title, url, description });
      await lab.save();

      res
        .status(201)
        .json({ message: "External link added", links: lab.externalLinks });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/labs/:labId/external-links
router.get("/:labId/external-links", async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.labId).select("externalLinks");
    if (!lab) return res.status(404).json({ error: "Lab not found" });

    res.json(lab.externalLinks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/labs/:labId/external-links/:linkId
router.put("/:labId/external-links/:linkId", async (req, res) => {
  try {
    if (!req.body)
      return res.status(400).json({ error: "Request body is missing." });

    const { title, url, description } = req.body;
    const lab = await Lab.findById(req.params.labId);
    if (!lab) return res.status(404).json({ error: "Lab not found" });

    const link = lab.externalLinks.id(req.params.linkId);
    if (!link) return res.status(404).json({ error: "Link not found" });

    link.title = title || link.title;
    link.url = url || link.url;
    link.description = description || link.description;

    await lab.save();
    res.json({ message: "Link updated", links: lab.externalLinks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/labs/:labId/external-links/:linkId
router.delete(
  "/:labId/external-links/:linkId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const lab = await Lab.findById(req.params.labId);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const link = lab.externalLinks.id(req.params.linkId);
      if (!link) return res.status(404).json({ error: "Link not found" });

      // Fix: Manually filter out the link
      lab.externalLinks = lab.externalLinks.filter(
        (item) => item._id.toString() !== req.params.linkId
      );

      await lab.save();

      res.json({ message: "Link deleted", links: lab.externalLinks });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
