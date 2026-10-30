require("dotenv").config();

const app = require("./app.js");
const connectDB = require("./config/db.js");

// Connect to DB once (Vercel reuses the lambda container across requests)
let isConnected = false;

const ensureDB = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// Serverless handler — Vercel calls this for every request
module.exports = async (req, res) => {
  await ensureDB();
  return app(req, res);
};
