const mongoose = require("mongoose");

let isConnecting = false;

async function connectDB() {
  // If already connected, reuse connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If currently connecting, wait for existing connection attempt
  if (isConnecting) {
    while (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return mongoose.connection;
  }

  const uri =
    process.env.MONGODB_URI ||
    "mongodb+srv://Hotel-Management:hotel123@cluster0.xdtmv2q.mongodb.net/";

  try {
    isConnecting = true;
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnecting = false;
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    isConnecting = false;
    console.error("MongoDB connection failed:", error.message);
    if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    return null;
  }
}

module.exports = connectDB;
