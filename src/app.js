const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes.js");
const doctorRoutes = require("./routes/doctor.routes.js");
const patientRoutes = require("./routes/patient.routes.js");
const dashboardRoutes = require("./routes/dashboard.routes.js");

const app = express();

// Parse and normalize configured origins
const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, "");

  // Match default local origins
  if (defaultOrigins.includes(normalized)) return true;

  // Match explicitly configured origins from CLIENT_URL
  if (configuredOrigins.includes(normalized)) return true;

  // Allow all Vercel deployments (*.vercel.app)
  if (/^https:\/\/.*\.vercel\.app$/.test(normalized)) return true;

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        // Return null, false to reject CORS cleanly without throwing 500 error
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
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
