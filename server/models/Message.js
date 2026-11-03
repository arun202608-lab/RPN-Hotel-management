const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      required: true,
      enum: ["Super Admin", "Admin", "Room Manager", "Receptionist", "Food Manager"],
    },
    senderEmail: {
      type: String,
      required: true,
      trim: true,
    },
    receiverRole: {
      type: String,
      required: true,
      enum: ["Super Admin", "Admin", "Room Manager", "Receptionist", "Food Manager", "All"],
    },
    receiverEmail: {
      type: String,
      default: "",
    },
    receiverName: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: String, // emails of users who read it
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);

