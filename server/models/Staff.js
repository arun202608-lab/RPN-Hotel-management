const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: [true, "Staff ID is required"],
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    department: {
      type: String,
      enum: [
        "Reception",
        "Housekeeping",
        "Kitchen",
        "Maintenance",
        "Security",
        "Management",
        "Other",
      ],
      required: true,
    },

    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },

    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: [0, "Salary cannot be negative"],
    },

    joiningDate: {
      type: Date,
      required: [true, "Joining date is required"],
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    portalRole: {
      type: String,
      enum: ["None", "Receptionist", "Room Manager", "Food Manager", "Super Admin"],
      default: "None",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Staff", staffSchema);
