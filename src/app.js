const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes.js");
const doctorRoutes = require("./routes/doctor.routes.js");
const patientRoutes = require("./routes/patient.routes.js");
const dashboardRoutes = require("./routes/dashboard.routes.js");

const app = express();

// Allow multiple origins: comma-separated CLIENT_URL env var
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((url) => url.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
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