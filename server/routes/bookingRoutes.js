const express = require("express");

const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  checkOutBooking,
} = require("../controllers/bookingController");

// GET: Get all bookings
router.get("/", getBookings);

// GET: Get booking by ID
router.get("/:id", getBookingById);

// POST: Create a booking
router.post("/", createBooking);

// PUT/POST: Check-out booking & release room
router.put("/:id/checkout", checkOutBooking);
router.post("/:id/checkout", checkOutBooking);

// PUT: Update a booking
router.put("/:id", updateBooking);

// DELETE: Delete a booking (strictly restricted to Admin)
router.delete("/:id", protect, adminOnly, deleteBooking);

module.exports = router;
