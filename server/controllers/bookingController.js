const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const Room = require("../models/Room");
const Payment = require("../models/Payment");

// Get all bookings
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "name email phone address")
      .populate("room", "roomNumber roomType pricePerNight capacity status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("customer", "name email phone address")
      .populate("room", "roomNumber roomType pricePerNight capacity status");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

// Create a booking & generate stay token
const createBooking = async (req, res) => {
  try {
    const {
      bookingNumber,
      tokenNumber,
      customer,
      room,
      checkIn,
      checkOut,
      guests,
      status = "Confirmed",
      paymentStatus = "Paid",
      paymentMethod = "UPI",
      notes,
    } = req.body;

    // Validate required fields
    if (!customer || !room || !checkIn || !checkOut || guests === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details",
      });
    }

    // Validate MongoDB IDs
    if (!mongoose.isValidObjectId(customer) || !mongoose.isValidObjectId(room)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID or room ID",
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const guestCount = Number(guests);

    if (
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime()) ||
      checkOutDate <= checkInDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be strictly after check-in",
      });
    }

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Guests must be a positive whole number",
      });
    }

    // Find customer and room
    const [customerExists, roomExists] = await Promise.all([
      Customer.findById(customer),
      Room.findById(room),
    ]);

    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: "Customer record not found",
      });
    }

    if (!roomExists) {
      return res.status(404).json({
        success: false,
        message: "Room not found in inventory",
      });
    }

    // Verify room is currently available
    if (roomExists.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: `Room #${roomExists.roomNumber} is currently ${roomExists.status} and cannot be booked.`,
      });
    }

    // Check capacity
    if (guestCount > roomExists.capacity) {
      return res.status(400).json({
        success: false,
        message: `Room #${roomExists.roomNumber} (${roomExists.roomType}) can accommodate maximum ${roomExists.capacity} guests`,
      });
    }

    // Generate unique booking number and stay token
    const finalBookingNumber =
      bookingNumber || `BK-${Date.now().toString().slice(-6)}`;
    const finalToken =
      tokenNumber ||
      `RPN-PASS-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    // Calculate total amount
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.max(
      1,
      Math.ceil((checkOutDate - checkInDate) / millisecondsPerDay)
    );
    const totalAmount = nights * roomExists.pricePerNight;

    const booking = await Booking.create({
      bookingNumber: finalBookingNumber,
      tokenNumber: finalToken,
      customer,
      room,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guestCount,
      totalAmount,
      status,
      paymentStatus,
      notes,
    });

    // 🌟 Crucial: Mark room as OCCUPIED so it cannot be selected by anyone else
    await Room.findByIdAndUpdate(room, { status: "Occupied" });

    // Automatically record payment transaction
    try {
      const payNumber = `PAY-RM-${Date.now().toString().slice(-6)}`;
      await Payment.create({
        paymentNumber: payNumber,
        department: "Room Desk",
        booking: booking._id,
        customer,
        customerName: customerExists?.name || "Guest",
        amount: totalAmount,
        paymentMethod: paymentMethod || "UPI",
        status: paymentStatus || "Paid",
        transactionId: `TXN-RM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        notes: `Stay Pass Booking for Room ${roomExists.roomNumber}`,
      });
    } catch (payErr) {
      console.warn("Auto payment record creation notice:", payErr.message);
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email phone address")
      .populate("room", "roomNumber roomType pricePerNight capacity status");

    res.status(201).json({
      success: true,
      message: "Room successfully booked & Stay Pass generated!",
      tokenNumber: finalToken,
      data: populatedBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

// Check-out guest: releases room immediately back to "Available"
const checkOutBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.status = "Checked-Out";
    booking.paymentStatus = "Paid";
    await booking.save();

    // 🌟 Crucial: Release room back to AVAILABLE immediately
    const updatedRoom = await Room.findByIdAndUpdate(
      booking.room,
      { status: "Available" },
      { new: true }
    );

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email phone address")
      .populate("room", "roomNumber roomType pricePerNight capacity status");

    res.status(200).json({
      success: true,
      message: `Guest checked out successfully! Room #${updatedRoom?.roomNumber || ""} is now Available.`,
      data: populatedBooking,
      room: updatedRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process check-out",
      error: error.message,
    });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const updates = req.body;
    const oldStatus = booking.status;
    const newStatus = updates.status || oldStatus;

    Object.assign(booking, updates);
    await booking.save();

    // Room status sync on update
    if (newStatus === "Checked-Out" || newStatus === "Cancelled") {
      await Room.findByIdAndUpdate(booking.room, { status: "Available" });
    } else if (newStatus === "Confirmed" || newStatus === "Checked-In") {
      await Room.findByIdAndUpdate(booking.room, { status: "Occupied" });
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email phone address")
      .populate("room", "roomNumber roomType pricePerNight capacity status");

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Release room on delete
    await Room.findByIdAndUpdate(booking.room, { status: "Available" });

    res.status(200).json({
      success: true,
      message: "Booking deleted and room released back to Available",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete booking",
      error: error.message,
    });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  checkOutBooking,
};
