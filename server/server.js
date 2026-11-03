const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const { seedDefaultAdmin } = require("./controllers/authController");
const { seedDefaultRooms } = require("./controllers/RoomController");
const { seedDefaultFoods } = require("./controllers/FoodController");
const { seedDefaultUpdates } = require("./controllers/chatController");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const roomRoutes = require("./routes/RoomRoutes");
const foodRoutes = require("./routes/FoodRoutes");
const foodOrderRoutes = require("./routes/FoodOrderRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

// Bulletproof universal CORS headers for cloud serverless & local
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(cors());

app.use(express.json());

// Ensure MongoDB is connected before handling requests (vital for Vercel Serverless cold starts)
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.warn("DB connection attempt failed during request:", err.message);
    }
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/food-orders", foodOrderRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/chat", chatRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hotel Management API is running",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    message: isDbConnected ? "Backend server is healthy" : "Database not connected",
    database: isDbConnected ? "Connected" : "Disconnected",
    hasMongoUri: Boolean(process.env.MONGODB_URI || "mongodb+srv://Hotel-Management:hotel123@cluster0.xdtmv2q.mongodb.net/"),
  });
});

const PORT = process.env.PORT || 5000;

let isSeeding = false;
async function initializeData() {
  if (isSeeding) return;
  isSeeding = true;
  try {
    await seedDefaultAdmin();
    await seedDefaultRooms();
    await seedDefaultFoods();
    await seedDefaultUpdates();
  } catch (err) {
    console.warn("Data seeding note:", err.message);
  }
}

async function startServer() {
  await connectDB();
  if (mongoose.connection.readyState === 1) {
    await initializeData();
  }

  // Only bind port when running locally or in standalone Node container (not on Vercel Serverless)
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

startServer();

// Export express app for Vercel Serverless Functions
module.exports = app;
