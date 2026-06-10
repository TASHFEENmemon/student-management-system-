const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

// 🔑 ROUTE: Admin Login Check
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username aur Password lazmi hain! ❌" });
        }

        // Database me admin ko dhoondna
        const admin = await Admin.findOne({ username: username.trim() });

        if (!admin) {
            return res.status(401).json({ success: false, message: "Ghalat Username ya Admin majood nahi hai! ❌" });
        }

        // Plain text password check
        if (admin.password !== password) {
            return res.status(401).json({ success: false, message: "Ghalat Password! Dobara koshish karein. ❌" });
        }

        // Success message
        res.status(200).json({ success: true, message: "Login Successful! Welcome Admin 🎉" });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server error during login", error: error.message });
    }
});

module.exports = router;