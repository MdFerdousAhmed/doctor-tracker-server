
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// Get Dashboard Statistics
const getDashboardStats = async (req, res) => {
  try {
    // Total doctors and patients
    const [totalDoctors, totalPatients] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
    ]);

    // Patients grouped by doctor
    const patientsPerDoctor = await Patient.aggregate([
      {
        $group: {
          _id: "$doctor",
          totalPatients: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      {
        $unwind: "$doctor",
      },
      {
        $project: {
          _id: 0,
          doctorId: "$doctor._id",
          doctorName: "$doctor.name",
          specialization: "$doctor.specialization",
          totalPatients: 1,
        },
      },
      {
        $sort: {
          totalPatients: -1,
        },
      },
    ]);

    // Last 7 days date range
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Recent patients count
    const recentPatients = await Patient.countDocuments({
      createdAt: {
        $gte: sevenDaysAgo,
      },
    });

    // Patients created per day (last 7 days)
    const patientsLast7Days = await Patient.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sevenDaysAgo,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          totalPatients: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalPatients: 1,
        },
      },
    ]);

    // Patients grouped by condition
    const patientsByCondition = await Patient.aggregate([
      {
        $group: {
          _id: "$condition",
          totalPatients: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          totalPatients: -1,
        },
      },
      {
        $project: {
          _id: 0,
          condition: "$_id",
          totalPatients: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data: {
        totalDoctors,
        totalPatients,
        recentPatients,
        patientsPerDoctor,
        patientsLast7Days,
        patientsByCondition,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

module.exports = {
  getDashboardStats,
};
