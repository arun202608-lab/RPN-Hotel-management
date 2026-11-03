const express = require("express");

const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} = require("../controllers/staffController");

// GET all staff + Search + Filter
router.get("/", getAllStaff);

// GET single staff
router.get("/:id", getStaffById);

// CREATE staff
router.post("/", createStaff);

// UPDATE staff
router.put("/:id", updateStaff);

// DELETE staff (strictly restricted to Admin)
router.delete("/:id", protect, adminOnly, deleteStaff);

module.exports = router;
