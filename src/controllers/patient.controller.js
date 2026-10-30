const mongoose = require("mongoose");
const Patient = require("../models/Patient.js");
const Doctor = require("../models/Doctor.js");

// Add Patient
const createPatient = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      email,
      condition,
      doctor,
    } = req.body;

    // Required field validation
    if (
      !name ||
      age === undefined ||
      !gender ||
      !phone ||
      !condition ||
      !doctor
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!mongoose.isValidObjectId(doctor)) {
  return res.status(400).json({
    success: false,
    message: "Invalid doctor ID",
  });
}

    // Check doctor ID
    const existingDoctor = await Doctor.findById(doctor);

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Create patient
    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      email,
      condition,
      doctor,
    });

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Create Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create patient",
    });
  }
};

// Get All Patients
const getAllPatients = async (req, res) => {
  try {
    const {
      search,
      condition,
      doctor,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate date filters
if (startDate && isNaN(Date.parse(startDate))) {
  return res.status(400).json({
    success: false,
    message: "Invalid start date",
  });
}

if (endDate && isNaN(Date.parse(endDate))) {
  return res.status(400).json({
    success: false,
    message: "Invalid end date",
  });
}

if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
  return res.status(400).json({
    success: false,
    message: "Start date cannot be after end date",
  });
}

    const filter = {};

    // Search by name, phone, email, condition
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { condition: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by condition
    if (condition) {
      filter.condition = { $regex: condition, $options: "i" };
    }

    // Filter by doctor
    if (doctor) {
  if (!mongoose.isValidObjectId(doctor)) {
    return res.status(400).json({
      success: false,
      message: "Invalid doctor ID filter",
    });
  }

  filter.doctor = doctor;
}

    // Filter by date
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Pagination
    // Validate pagination
const pageNumber = Number(page);
const limitNumber = Number(limit);

const currentPage =
  Number.isInteger(pageNumber) && pageNumber > 0
    ? pageNumber
    : 1;

const pageLimit =
  Number.isInteger(limitNumber) && limitNumber > 0
    ? Math.min(100, limitNumber)
    : 10;

const skip = (currentPage - 1) * pageLimit;

    const [patients, totalPatients] = await Promise.all([
      Patient.find(filter)
        .populate("doctor", "name specialization hospital")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),

      Patient.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Patients fetched successfully",
      data: patients,
      pagination: {
        totalPatients,
        currentPage,
        totalPages: Math.ceil(totalPatients / pageLimit),
        limit: pageLimit,
      },
    });
  } catch (error) {
    console.error("Get Patients Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
    });
  }
};

// Get Single Patient
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid patient ID",
  });
}

    const patient = await Patient.findById(id).populate(
      "doctor",
      "name specialization hospital"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient fetched successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Get Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
    });
  }
};


const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const allowedFields = [
      "name",
      "age",
      "gender",
      "phone",
      "email",
      "condition",
      "doctor",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Check doctor if doctor ID is updated
    if (updates.doctor) {
      if (!mongoose.isValidObjectId(updates.doctor)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor ID",
        });
      }

      const existingDoctor = await Doctor.findById(updates.doctor);

      if (!existingDoctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }
    }

    const patient = await Patient.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("doctor", "name specialization hospital");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Update Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update patient",
    });
  }
};


// Delete Patient
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid patient ID",
  });
}

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Delete Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete patient",
    });
  }
};

// Get Patients By Doctor
const getPatientsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.isValidObjectId(doctorId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid doctor ID",
  });
}

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const patients = await Patient.find({
      doctor: doctorId,
    })
      .populate("doctor", "name specialization hospital")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Doctor patients fetched successfully",
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
      },
      totalPatients: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error("Get Doctor Patients Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor patients",
    });
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientsByDoctor,
};