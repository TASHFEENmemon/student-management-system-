const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    action: {
      type: String, // Jaise: "INSERT", "UPDATE", "DELETE"
      required: true,
    },
    rollNumber: {
      type: String, // Kis student par action hua
      required: true,
    },
    message: {
      type: String, // Detail log message (e.g., "Student Salma's GPA was updated")
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now, // Kis waqt action hua
    },
  },
  {
    collection: "activity_logs", // MongoDB Compass me is naam se collection banega
  }
);

module.exports = mongoose.model("Log", LogSchema);