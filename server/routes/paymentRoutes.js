const express = require("express");

const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentController");

// GET: Get all payments
router.get("/", getPayments);

// GET: Get a payment by ID
router.get("/:id", getPaymentById);

// POST: Create a payment record
router.post("/", createPayment);

// PUT: Update a payment
router.put("/:id", updatePayment);

// DELETE: Delete a payment (strictly restricted to Admin)
router.delete("/:id", protect, adminOnly, deletePayment);

module.exports = router;
