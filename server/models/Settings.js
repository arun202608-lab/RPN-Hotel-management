const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    hotelName: {
      type: String,
      required: true,
      trim: true,
      default: "My Hotel",
    },

    hotelEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    hotelPhone: {
      type: String,
      trim: true,
      default: "",
    },

    hotelAddress: {
      type: String,
      trim: true,
      default: "",
    },

    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },

    taxPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 5,
    },

    checkInTime: {
      type: String,
      default: "12:00",
    },

    checkOutTime: {
      type: String,
      default: "11:00",
    },

    cancellationPolicy: {
      type: String,
      default: "Contact reception for cancellation.",
    },

    emailNotifications: {
      type: Boolean,
      default: true,
    },

    smsNotifications: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);