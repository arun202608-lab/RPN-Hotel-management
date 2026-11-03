const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getFoodOrders,
  getFoodOrderById,
  createFoodOrder,
  updateFoodOrder,
  deleteFoodOrder,
} = require("../controllers/FoodOrderController");

// GET - Get all food orders
router.get("/", getFoodOrders);

// GET - Get a single food order
router.get("/:id", getFoodOrderById);

// POST - Create a food order
router.post("/", createFoodOrder);

// PUT - Update a food order
router.put("/:id", updateFoodOrder);

// DELETE - Delete a food order (strictly restricted to Admin)
router.delete("/:id", protect, adminOnly, deleteFoodOrder);

module.exports = router;
