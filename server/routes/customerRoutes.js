const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

// const {
//   getCustomers,
//   createCustomer,
//   updateCustomer,
//   deleteCustomer,
// } = require("../controllers/customerController");
const {
   getCustomers,
   createCustomer,
   updateCustomer,
   deleteCustomer,
}=require("../controllers/customerController");

router.get("/", getCustomers);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
// Only Admin can delete customers
router.delete("/:id", protect, adminOnly, deleteCustomer);

module.exports = router;
