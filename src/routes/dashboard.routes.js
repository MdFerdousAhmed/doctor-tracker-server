const express = require("express");

const {
  getDashboardStats,
} = require("../controllers/dashboard.controller");

const protect = require("../middleware/auth.middleware");

const router = express.Router();

// Protect all dashboard routes
router.use(protect);

// Dashboard statistics
router.get("/stats", getDashboardStats);

module.exports = router;