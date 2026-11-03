const express = require("express");

const router = express.Router();

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

// GET all hotel settings
router.get("/", getSettings);

// UPDATE hotel settings
router.put("/", updateSettings);

module.exports = router;