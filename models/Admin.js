const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    }
  },
  {
    collection: "admins" // MongoDB Compass me admins ke naam se collection banega
  }
);

module.exports = mongoose.model("Admin", AdminSchema);