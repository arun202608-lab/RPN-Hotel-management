const Food = require("../models/Food");

const defaultDishes = [
  { name: "Special Masala Dosa", category: "Breakfast", price: 120, description: "Crispy golden crepe with potato masala and trio of chutneys", isAvailable: true },
  { name: "Ghee Idli & Medu Vada", category: "Breakfast", price: 95, description: "Steamed rice cakes & crispy lentil donut with piping hot sambar", isAvailable: true },
  { name: "Continental Breakfast Platter", category: "Breakfast", price: 280, description: "Scrambled eggs, toast, hashbrowns, baked beans & chicken sausage", isAvailable: true },
  { name: "Fluffy Poori Masala", category: "Breakfast", price: 110, description: "Golden puffed wheat bread with spicy potato curry", isAvailable: true },

  { name: "Royal South Indian Thali", category: "Lunch", price: 260, description: "Complete feast with 3 curries, kootu, rasam, curd & payasam", isAvailable: true },
  { name: "Hyderabadi Dum Biryani", category: "Lunch", price: 340, description: "Fragrant basmati rice slow-cooked with tender spiced chicken & saffron", isAvailable: true },
  { name: "Paneer Butter Masala & Naan", category: "Lunch", price: 250, description: "Cottage cheese cubes in rich tomato cashew gravy with 2 butter naans", isAvailable: true },
  { name: "Wok Tossed Fried Rice & Manchurian", category: "Lunch", price: 220, description: "Indo-Chinese classic vegetable fried rice with crispy manchurian balls", isAvailable: true },

  { name: "Clay Oven Tandoori Platter", category: "Dinner", price: 440, description: "Assorted kebabs, tikkas and roasted vegetables with mint dip", isAvailable: true },
  { name: "Murgh Butter Chicken with Garlic Naan", category: "Dinner", price: 360, description: "Slow simmered velvety butter chicken with 2 fluffy garlic naans", isAvailable: true },
  { name: "Slow Cooked Dal Makhani & Jeera Rice", category: "Dinner", price: 230, description: "Black lentils simmered overnight with cream and cumin tempered rice", isAvailable: true },
  { name: "Creamy Fettuccine Alfredo", category: "Dinner", price: 270, description: "Italian pasta tossed in parmesan garlic herb butter sauce", isAvailable: true },

  { name: "Golden Paneer Tikka", category: "Snacks", price: 220, description: "Marinated cottage cheese char-grilled with capsicum and onions", isAvailable: true },
  { name: "Truffle Herb French Fries", category: "Snacks", price: 140, description: "Crisp potato fries dusted with rosemary herb salt & cheese dip", isAvailable: true },
  { name: "Triple Decker Club Sandwich", category: "Snacks", price: 170, description: "Toasted sandwich loaded with cheese, crisp lettuce, tomatoes and cucumber", isAvailable: true },

  { name: "Authentic Kumbakonam Degree Coffee", category: "Beverages", price: 60, description: "Freshly brewed chicory filter coffee with foamy fresh milk", isAvailable: true },
  { name: "Sweet Kesari Mango Lassi", category: "Beverages", price: 120, description: "Thick churned yogurt smoothie infused with Alphonso mango pulp", isAvailable: true },
  { name: "Fresh Mint Lime Soda", category: "Beverages", price: 85, description: "Refreshing crushed lime with fresh garden mint and sparkling soda", isAvailable: true },
  { name: "Cold Brew Iced Latte", category: "Beverages", price: 150, description: "Smooth 18-hour cold steeped coffee with chilled milk and caramel syrup", isAvailable: true },
];

async function seedDefaultFoods() {
  try {
    const count = await Food.countDocuments();
    if (count < 10) {
      for (const d of defaultDishes) {
        const exists = await Food.findOne({ name: d.name });
        if (!exists) {
          await Food.create(d);
        }
      }
      console.log("✅ Default luxury dishes initialized in catalog");
    }
  } catch (err) {
    console.error("Error seeding food dishes:", err.message);
  }
}

// 1. Get all food items
async function getFoods(req, res) {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }
    if (req.query.available === "true") {
      filter.isAvailable = true;
    }

    const foods = await Food.find(filter).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch food items",
    });
  }
}

// 2. Get a single food item
async function getFoodById(req, res) {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: food,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid food item ID",
    });
  }
}

// 3. Create a food item
async function createFood(req, res) {
  try {
    const {
      name,
      category,
      price,
      description,
      image,
      isAvailable,
    } = req.body;

    if (!name?.trim() || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide food name, category and price",
      });
    }

    const food = await Food.create({
      name: name.trim(),
      category,
      price: Number(price),
      description,
      image,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    res.status(201).json({
      success: true,
      message: "Food item created successfully",
      data: food,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create food item",
    });
  }
}

// 4. Update a food item
async function updateFood(req, res) {
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Food item updated successfully",
      data: food,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update food item",
    });
  }
}

// 5. Delete a food item
async function deleteFood(req, res) {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Food item deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to delete food item",
    });
  }
}

module.exports = {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  seedDefaultFoods,
};
