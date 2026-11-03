const Settings = require("../models/Settings");

// GET Settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message,
    });
  }
};

// UPDATE Settings
const updateSettings = async (req, res) => {
  try {
    const allowedFields = [
      "hotelName",
      "hotelEmail",
      "hotelPhone",
      "hotelAddress",
      "currency",
      "taxPercentage",
      "checkInTime",
      "checkOutTime",
      "cancellationPolicy",
      "emailNotifications",
      "smsNotifications",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(updates);
    } else {
      settings = await Settings.findByIdAndUpdate(
        settings._id,
        { $set: updates },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};