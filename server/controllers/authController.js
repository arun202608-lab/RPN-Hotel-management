const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// Generate JWT helper
const generateToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || "hotel_management_secret_jwt_key_2026_super_secure",
    { expiresIn: "7d" }
  );
};

// Seed default portal accounts for all 3 roles if they don't exist
const seedDefaultAdmin = async () => {
  try {
    const defaultAccounts = [
      {
        name: "Hotel Administrator",
        email: "admin@hotel.com",
        password: "admin123",
        role: "Super Admin",
        phone: "+91 98765 43210",
        securityQuestion: "What is your hotel name?",
        securityAnswer: "RPN Hotel",
      },
      {
        name: "Priya Sharma (Room Desk)",
        email: "room@hotel.com",
        password: "room123",
        role: "Room Manager",
        phone: "+91 98450 11223",
        securityQuestion: "What is your hotel name?",
        securityAnswer: "RPN Hotel",
      },
      {
        name: "Chef Rajesh (Food Desk)",
        email: "food@hotel.com",
        password: "food123",
        role: "Food Manager",
        phone: "+91 98450 44556",
        securityQuestion: "What is your hotel name?",
        securityAnswer: "RPN Hotel",
      },
    ];

    for (const acc of defaultAccounts) {
      const exists = await Admin.findOne({ email: acc.email });
      if (!exists) {
        const newAcc = new Admin(acc);
        await newAcc.save();
        console.log(`✅ Default ${acc.role} account created: ${acc.email} / ${acc.password}`);
      }
    }
  } catch (error) {
    console.error("Failed to seed default accounts:", error.message);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const rawInput = req.body.email || req.body.username || "";
    const { password } = req.body;

    if (!rawInput || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both username/email and password",
      });
    }

    const searchStr = rawInput.toLowerCase().trim();
    let admin = await Admin.findOne({
      $or: [
        { email: searchStr },
        { name: new RegExp(`^${searchStr}$`, "i") },
      ],
    });

    // Fallback if user typed short aliases
    if (!admin) {
      if (searchStr === "admin" || searchStr === "administrator") {
        admin = await Admin.findOne({ email: "admin@hotel.com" });
      } else if (searchStr === "room" || searchStr === "roomdesk") {
        admin = await Admin.findOne({ email: "room@hotel.com" });
      } else if (searchStr === "food" || searchStr === "fooddesk" || searchStr === "kitchen") {
        admin = await Admin.findOne({ email: "food@hotel.com" });
      }
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, admin.email, admin.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        avatar: admin.avatar,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
      error: error.message,
    });
  }
};

// GET /api/auth/profile (Protected)
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("-password -resetOtp -resetOtpExpires");
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// PUT /api/auth/profile (Protected)
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body;
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (email && email.toLowerCase() !== admin.email.toLowerCase()) {
      const emailExists = await Admin.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: admin._id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another administrator",
        });
      }
      admin.email = email.toLowerCase().trim();
    }

    if (name) admin.name = name.trim();
    if (phone !== undefined) admin.phone = phone.trim();
    if (avatar !== undefined) admin.avatar = avatar.trim();

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        avatar: admin.avatar,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// PUT /api/auth/change-password (Protected)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match",
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your admin email address",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "No admin account found with that email address",
      });
    }

    // Generate 6-digit OTP code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetOtp = resetCode;
    admin.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password reset code generated successfully",
      resetCode, // provided so testing can proceed smoothly without email setup
      securityQuestion: admin.securityQuestion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
      error: error.message,
    });
  }
};

// POST /api/auth/verify-code
const verifyResetCode = async (req, res) => {
  try {
    const { email, code, securityAnswer } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const isValidCode =
      admin.resetOtp &&
      admin.resetOtp === code &&
      admin.resetOtpExpires &&
      admin.resetOtpExpires > new Date();

    const isValidAnswer =
      securityAnswer &&
      securityAnswer.trim().toLowerCase() ===
        (admin.securityAnswer || "").trim().toLowerCase();

    if (!isValidCode && !isValidAnswer) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code / security answer",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification successful. You may now set a new password.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
    });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, code, securityAnswer, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const isValidCode =
      admin.resetOtp &&
      admin.resetOtp === code &&
      admin.resetOtpExpires &&
      admin.resetOtpExpires > new Date();

    const isValidAnswer =
      securityAnswer &&
      securityAnswer.trim().toLowerCase() ===
        (admin.securityAnswer || "").trim().toLowerCase();

    if (!isValidCode && !isValidAnswer) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification. Please request a new code.",
      });
    }

    // Set new password (pre-save hook hashes it)
    admin.password = newPassword;
    admin.resetOtp = null;
    admin.resetOtpExpires = null;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

module.exports = {
  seedDefaultAdmin,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};

