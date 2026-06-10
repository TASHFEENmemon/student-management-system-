const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true, // 🔑 Yeh khud database index bana deta hai automatically, neeche dobara likhne ki zaroorat nahi hai
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      uppercase: true,
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester cannot be less than 1"],
      max: [8, "Semester cannot be more than 8"],
    },
    attendance: {
      type: Number,
      min: [0, "Attendance cannot be less than 0"],
      max: [100, "Attendance cannot be more than 100"],
      default: 0,
    },
    gpa: {
      type: Number,
      min: [0, "GPA cannot be less than 0.0"],
      max: [4, "GPA cannot exceed 4.0"],
      default: 0.0,
    },
    // 🔥 Strict Phone Matcher
    parentPhone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          // Agar khali chorna chahein toh valid hai, par agar likhein toh strict 10 to 15 digits hon
          return v === "" || /^\d{10,15}$/.test(v);
        },
        message: "Parent Phone must be between 10 to 15 digits with no letters! ❌",
      },
    },
    // 🔥 Strict Email Matcher
    parentEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      validate: {
        validator: function (v) {
          return v === "" || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(v);
        },
        message: "Please enter a valid email format (e.g., student@domain.com)! ❌",
      },
    },
    studentAddress: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true, // 🕒 Auto-creates 'createdAt' aur 'updatedAt' database collections ke liye
  }
);

// 🚀 Text search ke liye optimized indexes (Duplicate rollNumber index yahan se remove kar diya hai)
StudentSchema.index({ name: "text", department: "text" });

module.exports = mongoose.model("Student", StudentSchema);