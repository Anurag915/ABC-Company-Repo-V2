// const allowRoles =
//   (...roles) =>
//   (req, res, next) => {
//     console.log("User role in allowRoles:", req.user?.role);
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ error: "Access denied" });
//     }
//     next();
//   };

// module.exports = allowRoles;


const allowRoles = (...roles) => (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  const allowed = roles.map(r => r.toLowerCase());
  console.log("User role normalized:", userRole);
  if (!allowed.includes(userRole)) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};
module.exports = allowRoles;
