const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message content is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Normal", "High", "Urgent"],
      default: "Normal",
    },
    targetRole: {
      type: String,
      enum: ["All", "Room Manager", "Food Manager"],
      default: "All",
    },
    createdByName: {
      type: String,
      default: "Hotel Administrator",
    },
    createdByRole: {
      type: String,
      default: "Super Admin",
    },
    readBy: [
      {
        type: String, // emails of users who marked read
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);

