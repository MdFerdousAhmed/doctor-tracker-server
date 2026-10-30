const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    // Throw so callers can handle the error (avoids killing serverless lambdas)
    throw error;
  }
};

module.exports = connectDB;