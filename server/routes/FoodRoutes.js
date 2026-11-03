const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

 
const {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} = require("../controllers/FoodController");

// GET - Get all food items
router.get("/", getFoods);

// GET - Get one food item by ID
router.get("/:id", getFoodById);

// POST - Create a new food item (strictly restricted to Admin)
router.post("/", protect, adminOnly, createFood);

// PUT - Update a food item (Price/Dish changes require Admin; Availability toggle allowed for Food Manager)
router.put("/:id", protect, (req, res, next) => {
  const isPriceOrInfoChange =
    req.body.price !== undefined ||
    req.body.name !== undefined ||
    req.body.category !== undefined;

  if (isPriceOrInfoChange) {
    return adminOnly(req, res, () => updateFood(req, res));
  }
  return updateFood(req, res);
});

// DELETE - Delete a food item (strictly restricted to Admin)
router.delete("/:id", protect, adminOnly, deleteFood);

module.exports = router;
