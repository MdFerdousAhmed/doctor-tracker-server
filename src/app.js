const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes.js");
const doctorRoutes = require("./routes/doctor.routes.js");
const patientRoutes = require("./routes/patient.routes.js");
const dashboardRoutes = require("./routes/dashboard.routes.js");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Doctor Tracker API is Running!",
  });
});

app.use("/api/auth", authRoutes);

module.exports = app;