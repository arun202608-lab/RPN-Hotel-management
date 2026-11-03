const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    department: {
      type: String,
      enum: ["Room Desk", "Food Desk", "General"],
      default: "Room Desk",
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
      default: null,
    },

    foodOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodOrder",
      required: false,
      default: null,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
      default: null,
    },

    customerName: {
      type: String,
      default: "Guest",
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentMethod: {
      type: String,
      default: "UPI",
    },

    status: {
      type: String,
      default: "Paid",
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
