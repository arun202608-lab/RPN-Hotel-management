const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMessages,
  sendMessage,
  markMessagesRead,
  getNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification,
  getChatContacts,
} = require("../controllers/chatController");

// All chat routes require authenticated staff login
router.use(protect);

// Messages endpoints
router.get("/messages", getMessages);
router.post("/messages", sendMessage);
router.put("/messages/read", markMessagesRead);

// Contacts & Channels endpoints
router.get("/contacts", getChatContacts);

// Notifications & Hotel Updates endpoints
router.get("/notifications", getNotifications);
router.post("/notifications", createNotification);
router.put("/notifications/:id/read", markNotificationRead);
router.delete("/notifications/:id", deleteNotification);

module.exports = router;

