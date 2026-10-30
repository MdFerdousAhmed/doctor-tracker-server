require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = "admin@doctortracker.com";

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      "Admin@123456",
      12
    );

    await Admin.create({
      name: "Doctor Tracker Admin",
      email,
      password: hashedPassword,
    });

    console.log("Admin created successfully");
  } catch (error) {
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();