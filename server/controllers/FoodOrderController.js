const mongoose = require("mongoose");
const Food = require("../models/Food");
const FoodOrder = require("../models/FoodOrder");
const Payment = require("../models/Payment");

// 1. Get all food orders
async function getFoodOrders(req, res) {
  try {
    const orders = await FoodOrder.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch food orders",
    });
  }
}

// 2. Get a single food order
async function getFoodOrderById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await FoodOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Food order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch food order",
    });
  }
}

// 3. Create a new food order & generate bill
async function createFoodOrder(req, res) {
  try {
    const {
      orderNumber,
      billNumber,
      customerName,
      roomNumber,
      items,
      status = "Delivered",
      paymentStatus = "Paid",
      paymentMethod = "Cash",
      notes,
    } = req.body;

    if (!customerName?.trim() || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer/Table name and at least one food item are required",
      });
    }

    // Validate food IDs and quantities
    for (const item of items) {
      if (
        !mongoose.isValidObjectId(item.food) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Each item needs a valid food ID and positive quantity",
        });
      }
    }

    // Get current food prices from MongoDB
    const foodIds = items.map((item) => item.food);
    const uniqueFoodIds = [...new Set(foodIds.map(String))];

    const foods = await Food.find({
      _id: { $in: uniqueFoodIds },
      isAvailable: true,
    });

    if (foods.length !== uniqueFoodIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more food items are unavailable or sold out",
      });
    }

    const foodMap = new Map(
      foods.map((food) => [food._id.toString(), food])
    );

    const orderItems = items.map((item) => {
      const food = foodMap.get(item.food.toString());
      return {
        food: food._id,
        name: food.name,
        price: food.price,
        quantity: Number(item.quantity),
      };
    });

    // Calculate total on server
    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const finalOrderNumber =
      orderNumber?.trim() || `ORD-${Date.now().toString().slice(-6)}`;
    const finalBillNumber =
      billNumber?.trim() ||
      `BILL-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    const order = await FoodOrder.create({
      orderNumber: finalOrderNumber,
      billNumber: finalBillNumber,
      customerName: customerName.trim(),
      roomNumber: roomNumber || "",
      items: orderItems,
      totalAmount,
      status,
      paymentStatus,
      paymentMethod,
      notes: notes || "",
    });

    // Automatically record payment under Food Desk
    try {
      const payNumber = `PAY-FD-${Date.now().toString().slice(-6)}`;
      await Payment.create({
        paymentNumber: payNumber,
        department: "Food Desk",
        foodOrder: order._id,
        customerName: customerName.trim(),
        amount: totalAmount,
        paymentMethod: paymentMethod || "Cash",
        status: "Paid",
        transactionId: `TXN-FD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        notes: `Dining Bill ${finalBillNumber} (${roomNumber || "Table/Dine-in"})`,
      });
    } catch (payErr) {
      console.warn("Food payment creation note:", payErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Dining order placed and Bill generated successfully!",
      billNumber: finalBillNumber,
      orderNumber: finalOrderNumber,
      data: order,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Order number or bill number already exists",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create food order and bill",
      error: error.message,
    });
  }
}

// 4. Update order status and details
async function updateFoodOrder(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const allowedFields = [
      "customerName",
      "roomNumber",
      "status",
      "paymentStatus",
      "paymentMethod",
      "notes",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const order = await FoodOrder.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Food order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Food order updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update food order",
    });
  }
}

// 5. Delete a food order
async function deleteFoodOrder(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await FoodOrder.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Food order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Food order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete food order",
    });
  }
}

module.exports = {
  getFoodOrders,
  getFoodOrderById,
  createFoodOrder,
  updateFoodOrder,
  deleteFoodOrder,
};
