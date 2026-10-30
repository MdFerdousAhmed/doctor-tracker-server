const mongoose = require("mongoose");
const Doctor = require("../models/Doctor.js");
const Patient = require("../models/Patient.js");

// Add Doctor
const createDoctor = async (req, res) => {
  try {
    const { name, specialization, hospital, phone, email } = req.body;

    if (!name || !specialization || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const existingDoctor = await Doctor.findOne({
      email: email.toLowerCase(),
    });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: "Doctor already exists with this email",
      });
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      hospital,
      phone,
      email,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Create Doctor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create doctor",
    });
  }
};


// Get All Doctors
const getAllDoctors = async (req, res) => {
  try {
    const {
      search,
      specialization,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate start date
if (startDate && isNaN(Date.parse(startDate))) {
  return res.status(400).json({
    success: false,
    message: "Invalid start date",
  });
}

// Validate end date
if (endDate && isNaN(Date.parse(endDate))) {
  return res.status(400).json({
    success: false,
    message: "Invalid end date",
  });
}

// Validate date range
if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
  return res.status(400).json({
    success: false,
    message: "Start date cannot be after end date",
  });
}

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    if (specialization) {
      filter.specialization = {
        $regex: specialization,
        $options: "i",
      };
    }

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
    const [doctors, totalDoctors] = await Promise.all([
      Doctor.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),
      Doctor.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctors,
      pagination: {
        totalDoctors,
        currentPage,
        totalPages: Math.ceil(totalDoctors / pageLimit),
        limit: pageLimit,
      },
    });
  } catch (error) {
    console.error("Get Doctors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor fetched successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Get Doctor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor",
    });
  }
};


const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid doctor ID",
  });
}

    const allowedFields = [
      "name",
      "specialization",
      "hospital",
      "phone",
      "email",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();

      const existingDoctor = await Doctor.findOne({
        email: updates.email,
        _id: { $ne: id },
      });

      if (existingDoctor) {
        return res.status(409).json({
          success: false,
          message: "Email already used by another doctor",
        });
      }
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Update Doctor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update doctor",
    });
  }
};


const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid doctor ID",
  });
}

    // Check if doctor exists
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Check if any patients are assigned to this doctor
    const patientCount = await Patient.countDocuments({
      doctor: id,
    });

    if (patientCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete doctor while patients are assigned. Reassign or delete patients first.",
        totalPatients: patientCount,
      });
    }

    // Delete doctor if no patients are assigned
    await Doctor.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Delete Doctor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
    });
  }
};



module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};