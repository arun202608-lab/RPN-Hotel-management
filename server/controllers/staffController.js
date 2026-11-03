const Staff = require("../models/Staff");
const Admin = require("../models/Admin");

// GET: Get all staff
const getAllStaff = async (req, res) => {
  try {
    const { search, department, status, portalRole } = req.query;
    const filter = {};

    // Search by name, staff ID, email or phone
    if (search) {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { fullName: searchRegex },
        { staffId: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (department) filter.department = department;
    if (status) filter.status = status;
    if (portalRole) filter.portalRole = portalRole;

    const staff = await Staff.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
      error: error.message,
    });
  }
};

// GET: Get staff by ID
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid staff ID",
    });
  }
};

// POST: Create new staff & assign portal login if specified
const createStaff = async (req, res) => {
  try {
    const {
      staffId,
      fullName,
      email,
      phone,
      gender,
      department,
      designation,
      salary,
      joiningDate,
      address,
      portalRole = "None",
      password,
      status = "Active",
    } = req.body;

    const normalizedStaffId = staffId?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    // Check duplicate staff ID
    const existingStaffId = await Staff.findOne({
      staffId: normalizedStaffId,
    });

    if (existingStaffId) {
      return res.status(409).json({
        success: false,
        message: "Staff ID already exists",
      });
    }

    // Check duplicate email
    const existingEmail = await Staff.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Staff email already registered",
      });
    }

    const staff = await Staff.create({
      ...req.body,
      staffId: normalizedStaffId,
      email: normalizedEmail,
      portalRole: portalRole || "None",
      status,
    });

    // 🌟 RBAC Assignment: If assigned a portal role, provision their login account!
    if (portalRole && portalRole !== "None") {
      try {
        const existingAdmin = await Admin.findOne({ email: normalizedEmail });
        if (!existingAdmin) {
          const newAdmin = new Admin({
            name: fullName,
            email: normalizedEmail,
            password: password || "hotel123",
            role: portalRole,
            phone: phone || "",
          });
          await newAdmin.save();
        } else {
          existingAdmin.role = portalRole;
          if (password) existingAdmin.password = password;
          await existingAdmin.save();
        }
      } catch (adminErr) {
        console.warn("Notice syncing staff portal login:", adminErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Staff created successfully" + (portalRole !== "None" ? " and portal access assigned" : ""),
      data: staff,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Staff ID or email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create staff",
      error: error.message,
    });
  }
};

// PUT: Update staff
const updateStaff = async (req, res) => {
  try {
    const { portalRole, password, status } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // 🌟 Sync portal login credentials if role or password was updated
    if (staff.email) {
      try {
        let adminUser = await Admin.findOne({ email: staff.email.toLowerCase() });
        if (portalRole && portalRole !== "None") {
          if (!adminUser) {
            adminUser = new Admin({
              name: staff.fullName,
              email: staff.email.toLowerCase(),
              password: password || "hotel123",
              role: portalRole,
              phone: staff.phone || "",
            });
            await adminUser.save();
          } else {
            adminUser.role = portalRole;
            adminUser.name = staff.fullName;
            if (password) adminUser.password = password;
            await adminUser.save();
          }
        } else if (portalRole === "None" && adminUser && adminUser.email !== "admin@hotel.com") {
          // If revoked, remove login
          await Admin.deleteOne({ _id: adminUser._id });
        }
      } catch (err) {
        console.warn("Notice updating staff portal login:", err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Staff profile updated successfully",
      data: staff,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Staff ID or email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(400).json({
      success: false,
      message: "Failed to update staff",
      error: error.message,
    });
  }
};

// DELETE: Delete staff
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Revoke portal login if not default admin
    if (staff.email && staff.email !== "admin@hotel.com") {
      await Admin.deleteOne({ email: staff.email.toLowerCase() });
    }

    res.status(200).json({
      success: true,
      message: "Staff deleted successfully and portal credentials revoked",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to delete staff",
      error: error.message,
    });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
};
