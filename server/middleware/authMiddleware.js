const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "hotel_management_secret_jwt_key_2026_super_secure"
      );

      req.admin = await Admin.findById(decoded.id).select("-password");

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: "User account no longer exists",
        });
      }

      return next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token invalid or expired",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

// Middleware: Restrict access strictly to Super Admin and Admin roles
const adminOnly = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const role = req.admin.role || "";
  const isAdmin = role === "Super Admin" || role === "Admin";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access restricted: Only Administrators are permitted to delete records.",
    });
  }

  next();
};

module.exports = { protect, adminOnly };

