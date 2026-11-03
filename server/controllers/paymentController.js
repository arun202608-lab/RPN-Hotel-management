const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const FoodOrder = require("../models/FoodOrder");

// Helper to normalize payment method
function normalizePaymentMethod(method = "") {
  const m = String(method || "").toLowerCase();
  if (m.includes("card") || m.includes("credit") || m.includes("debit")) return "Card";
  if (m.includes("net") || m.includes("bank")) return "Net Banking";
  if (m.includes("cash")) return "Cash";
  return "UPI";
}

// ==================================
// GET ALL PAYMENTS (with auto-sync)
// ==================================

const getPayments = async (req, res) => {
  try {
    // 🌟 Auto-Sync: Check for any existing Bookings without Payment records
    try {
      const existingBookingPayments = await Payment.find({ booking: { $ne: null } }).select("booking");
      const recordedBookingIds = new Set(existingBookingPayments.map((p) => p.booking?.toString()));

      const unrecordedBookings = await Booking.find({
        _id: { $nin: Array.from(recordedBookingIds) },
        status: { $ne: "Cancelled" },
      }).populate("customer", "name email phone");

      for (const b of unrecordedBookings) {
        const payNum = `PAY-RM-${String(b._id).slice(-6).toUpperCase()}`;
        await Payment.create({
          paymentNumber: payNum,
          department: "Room Desk",
          booking: b._id,
          customer: b.customer?._id || b.customer,
          customerName: b.customer?.name || "Guest",
          amount: Number(b.totalAmount || 0),
          paymentMethod: normalizePaymentMethod(b.paymentMethod),
          status: b.paymentStatus || "Paid",
          transactionId: `TXN-RM-${String(b.tokenNumber || b.bookingNumber || b._id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`,
          notes: `Stay Pass Booking #${b.bookingNumber} (${b.tokenNumber || "Direct Check-In"})`,
          paymentDate: b.createdAt || new Date(),
        });
      }

      // Auto-Sync: Check for any existing FoodOrders without Payment records
      const existingFoodPayments = await Payment.find({ foodOrder: { $ne: null } }).select("foodOrder");
      const recordedFoodIds = new Set(existingFoodPayments.map((p) => p.foodOrder?.toString()));

      const unrecordedFoodOrders = await FoodOrder.find({
        _id: { $nin: Array.from(recordedFoodIds) },
        status: { $ne: "Cancelled" },
      });

      for (const fo of unrecordedFoodOrders) {
        const payNum = `PAY-FD-${String(fo._id).slice(-6).toUpperCase()}`;
        await Payment.create({
          paymentNumber: payNum,
          department: "Food Desk",
          foodOrder: fo._id,
          customerName: fo.customerName || "Dining Guest",
          amount: Number(fo.totalAmount || 0),
          paymentMethod: normalizePaymentMethod(fo.paymentMethod),
          status: fo.paymentStatus || "Paid",
          transactionId: `TXN-FD-${String(fo.billNumber || fo.orderNumber || fo._id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`,
          notes: `Dining Order #${fo.billNumber || fo.orderNumber}`,
          paymentDate: fo.createdAt || new Date(),
        });
      }
    } catch (syncErr) {
      console.warn("Payment auto-sync notice:", syncErr.message);
    }

    const filter = {};
    if (req.query.department && req.query.department !== "All") {
      filter.department = req.query.department;
    }
    const payments = await Payment.find(filter)
      .populate("booking", "bookingNumber totalAmount status tokenNumber")
      .populate("customer", "name email phone")
      .populate("foodOrder", "orderNumber billNumber totalAmount customerName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// ==================================
// GET PAYMENT BY ID
// ==================================

const getPaymentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(req.params.id)
      .populate("booking", "bookingNumber totalAmount status")
      .populate("customer", "name email phone");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

// ==================================
// CREATE PAYMENT
// ==================================

const createPayment = async (req, res) => {
  try {
    const {
      paymentNumber,
      booking,
      paymentMethod,
      status,
      transactionId,
      notes,
    } = req.body;

    if (!paymentNumber || !booking || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "Payment number, booking and payment method are required",
      });
    }

    if (!mongoose.isValidObjectId(booking)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const allowedMethods = [
      "Cash",
      "Card",
      "UPI",
      "Net Banking",
    ];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Paid",
      "Failed",
      "Refunded",
    ];

    const paymentStatus = status || "Pending";

    if (!allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const bookingExists = await Booking.findById(booking);

    if (!bookingExists) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (bookingExists.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot create payment for a cancelled booking",
      });
    }

    const duplicatePayment = await Payment.findOne({
      paymentNumber,
    });

    if (duplicatePayment) {
      return res.status(409).json({
        success: false,
        message: "Payment number already exists",
      });
    }

    const customerExists = await Customer.findById(
      bookingExists.customer
    );

    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: "Booking customer not found",
      });
    }

    // Amount is calculated from the booking on the server.
    // Do not accept an arbitrary amount from the frontend.
    const amount = bookingExists.totalAmount;

    const payment = await Payment.create({
      paymentNumber,
      booking: bookingExists._id,
      customer: customerExists._id,
      amount,
      paymentMethod,
      status: paymentStatus,
      transactionId: transactionId || "",
      notes: notes || "",
    });

    // Keep booking payment status synchronized.
    // This is a tracking update, not proof of a real transaction.
    if (paymentStatus === "Paid") {
      bookingExists.paymentStatus = "Paid";
      await bookingExists.save();
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate("booking", "bookingNumber totalAmount status")
      .populate("customer", "name email phone");

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: populatedPayment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Payment number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
};

// ==================================
// UPDATE PAYMENT STATUS
// ==================================

const updatePayment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const allowedFields = [
      "status",
      "transactionId",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Paid",
      "Failed",
      "Refunded",
    ];

    if (
      updates.status !== undefined &&
      !allowedStatuses.includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    Object.assign(payment, updates);

    await payment.save();

    // Synchronize booking status using all its payment records.
    const relatedPayments = await Payment.find({
      booking: payment.booking,
    });

    const booking = await Booking.findById(payment.booking);

    if (booking) {
      const allPaid = relatedPayments.some(
        (item) => item.status === "Paid"
      );

      const hasRefunded = relatedPayments.some(
        (item) => item.status === "Refunded"
      );

      if (allPaid) {
        booking.paymentStatus = "Paid";
      } else if (hasRefunded) {
        booking.paymentStatus = "Refunded";
      } else if (
        relatedPayments.some((item) => item.status === "Pending")
      ) {
        booking.paymentStatus = "Pending";
      } else if (
        relatedPayments.every((item) => item.status === "Failed")
      ) {
        booking.paymentStatus = "Failed";
      } else {
        booking.paymentStatus = "Pending";
      }

      await booking.save();
    }

    const updatedPayment = await Payment.findById(payment._id)
      .populate("booking", "bookingNumber totalAmount status")
      .populate("customer", "name email phone");

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: updatedPayment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update payment",
      error: error.message,
    });
  }
};

// ==================================
// DELETE PAYMENT (Admin only)
// ==================================

const deletePayment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const bookingId = payment.booking;

    await payment.deleteOne();

    // If associated with a booking, re-synchronize the booking's payment status
    if (bookingId) {
      const remainingPayments = await Payment.find({
        booking: bookingId,
      });

      const booking = await Booking.findById(bookingId);

      if (booking) {
        if (remainingPayments.some((item) => item.status === "Paid")) {
          booking.paymentStatus = "Paid";
        } else if (
          remainingPayments.some((item) => item.status === "Refunded")
        ) {
          booking.paymentStatus = "Refunded";
        } else if (
          remainingPayments.some((item) => item.status === "Pending")
        ) {
          booking.paymentStatus = "Pending";
        } else if (
          remainingPayments.length > 0 &&
          remainingPayments.every((item) => item.status === "Failed")
        ) {
          booking.paymentStatus = "Failed";
        } else {
          booking.paymentStatus = "Pending";
        }

        await booking.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete payment",
      error: error.message,
    });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
};