const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/RoomController");

// GET - Get all rooms
router.get("/", getRooms);

// GET - Get one room by ID
router.get("/:id", getRoomById);

// POST - Create a new room (strictly restricted to Admin)
router.post("/", protect, adminOnly, createRoom);

// PUT - Update a room (strictly restricted to Admin)
router.put("/:id", protect, adminOnly, updateRoom);

// DELETE - Delete a room (strictly restricted to Admin)
router.delete("/:id", protect, adminOnly, deleteRoom);

module.exports = router;
