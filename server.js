const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🛡️ CUSTOM NOSQL INJECTION SANITIZER (No Package Needed - Bug Free!)
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj instanceof Object) {
            for (let key in obj) {
                if (key.startsWith('$') || key.includes('.')) {
                    delete obj[key]; // Hacking keys ko delete kar do
                } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]); // Deep cleaning for nested objects
                }
            }
        }
    };
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    next();
});

app.use(express.static("public"));

// Routes Middleware
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes"); // 🔥 1. Admin Login Route ko import kiya

app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes); // 🔥 2. Admin Login Route ko backend server par register kiya

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/studentDB")
.then(() => console.log("MongoDB Connected Successfully... ✅"))
.catch((err) => console.error("MongoDB Connection Error: ❌", err));

// Server Port
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT} 🏃‍♂️`);
});