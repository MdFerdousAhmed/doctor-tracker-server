const express = require("express");

const {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientsByDoctor,
} = require("../controllers/patient.controller.js");

const protect = require("../middleware/auth.middleware.js");

const router = express.Router();

// Protect all patient routes
router.use(protect);

// Patient CRUD
router.post("/", createPatient);
router.get("/", getAllPatients);
router.get("/:id", getPatientById);
router.patch("/:id", updatePatient);
router.delete("/:id", deletePatient);
router.get("/doctor/:doctorId", getPatientsByDoctor);

module.exports = router;