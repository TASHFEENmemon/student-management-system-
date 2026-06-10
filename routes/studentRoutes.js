const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Log = require("../models/Log"); // 🔥 Logs Model for Database Trigger Audit Trail

// ==========================================
// 📊 ADVANCED DATABASE AGGREGATION ROUTE
// ==========================================
router.get("/analytics", async (req, res) => {
    try {
        // MongoDB Engine khud aggregate pipeline ke zariye real-time math calculate karega
        const stats = await Student.aggregate([
            {
                $group: {
                    _id: null, // Saare documents ko ek sath group karo
                    totalStudents: { $sum: 1 }, // Total count
                    avgGpa: { $avg: "$gpa" }, // Database level Average GPA
                    avgAttendance: { $avg: "$attendance" } // Database level Average Attendance
                }
            }
        ]);

        if (stats.length > 0) {
            res.status(200).json({
                success: true,
                totalStudents: stats[0].totalStudents,
                avgGpa: stats[0].avgGpa ? stats[0].avgGpa.toFixed(2) : "0.00",
                avgAttendance: stats[0].avgAttendance ? Math.round(stats[0].avgAttendance) : 0
            });
        } else {
            res.status(200).json({
                success: true,
                totalStudents: 0,
                avgGpa: "0.00",
                avgAttendance: 0
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Aggregation Pipeline Error ❌", error: error.message });
    }
});

// ==========================================
// 1. ROUTE: Naya Student Add + Auto Log Trigger (POST)
// ==========================================
router.post("/add", async (req, res) => {
    try {
        const { rollNumber, name, department, semester, attendance, gpa, parentPhone, parentEmail, studentAddress } = req.body;

        // Core Validation checks
        if (!rollNumber?.trim() || !name?.trim() || !department?.trim()) {
            return res.status(400).json({ message: "Roll Number, Name, aur Department khali nahi ho sakte! ❌" });
        }

        if (attendance < 0 || attendance > 100 || isNaN(attendance)) {
            return res.status(400).json({ message: "Attendance sirf 0% se 100% ke darmiyan honi chahiye! ❌" });
        }

        if (gpa < 0 || gpa > 4 || isNaN(gpa)) {
            return res.status(400).json({ message: "GPA sirf 0.00 se 4.00 ke darmiyan hona chahiye! ❌" });
        }

        // Handle case-insensitivity during duplicate checks
        const existingStudent = await Student.findOne({ rollNumber: rollNumber.trim().toUpperCase() });
        if (existingStudent) {
            return res.status(400).json({ message: "Yeh Roll Number pehle se register hai! ❌" });
        }

        const newStudent = new Student({
            rollNumber: rollNumber.trim().toUpperCase(),
            name: name.trim(),
            department: department.trim().toUpperCase(),
            semester,
            attendance, 
            gpa,
            parentPhone: parentPhone ? parentPhone.trim() : "",    
            parentEmail: parentEmail ? parentEmail.trim().toLowerCase() : "",    
            studentAddress: studentAddress ? studentAddress.trim() : "" 
        });

        const savedStudent = await newStudent.save();

        // 📝 DATABASE TRIGGER: Auto Save Activity Log for Insert Action
        const newLog = new Log({
            action: "INSERT",
            rollNumber: savedStudent.rollNumber,
            message: `Student '${savedStudent.name}' was successfully registered into the database.`
        });
        await newLog.save();

        res.status(201).json({ message: "Student Added Successfully! 🎉", data: savedStudent });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(", ") });
        }
        res.status(400).json({ message: "Error adding student ❌", error: error.message });
    }
});

// ==========================================
// 2. ROUTE: Saare Students Ka Data Dekhne Ke Liye (GET)
// ==========================================
router.get("/all", async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: "Error fetching data ❌", error: error.message });
    }
});

// ==========================================
// 3. ROUTE: Student Record Update + Auto Log Trigger (PUT)
// ==========================================
router.put("/update/:rollNumber", async (req, res) => {
    try {
        const { name, department, semester, attendance, gpa, parentPhone, parentEmail, studentAddress } = req.body;

        // Extra Backend Format-Validation Guard
        if (parentPhone && parentPhone.trim() !== "" && !/^\d{10,15}$/.test(parentPhone.trim())) {
            return res.status(400).json({ message: "Update Failed: Parent Phone number 10 se 15 digits ka hona chahiye! ❌" });
        }

        if (parentEmail && parentEmail.trim() !== "" && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(parentEmail.trim())) {
            return res.status(400).json({ message: "Update Failed: Invalid Email structure! ❌" });
        }

        const updatedStudent = await Student.findOneAndUpdate(
          { rollNumber: req.params.rollNumber.toUpperCase() },
          {
            name: name ? name.trim() : undefined,
            department: department ? department.trim().toUpperCase() : undefined,
            semester,
            attendance,
            gpa,
            parentPhone: parentPhone ? parentPhone.trim() : "",
            parentEmail: parentEmail ? parentEmail.trim().toLowerCase() : "",
            studentAddress: studentAddress ? studentAddress.trim() : "",
          },
          { new: true, runValidators: true } // Mongoose schema validators execute update ke waqt bhi active rakhta hai
        );

        if (!updatedStudent) {
            return res.status(404).json({ message: "Student record not found! ❌" });
        }

        // 📝 DATABASE TRIGGER: Auto Save Log for Update Action
        const updateLog = new Log({
            action: "UPDATE",
            rollNumber: updatedStudent.rollNumber,
            message: `Student record for '${updatedStudent.name}' was modified. Changes applied to schema parameters.`
        });
        await updateLog.save();

        res.status(200).json({ message: "Student Record Updated Successfully! 📝", data: updatedStudent });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(", ") });
        }
        res.status(400).json({ message: "Error updating student ❌", error: error.message });
    }
});

// ==========================================
// 4. ROUTE: Delete student + Auto Log Trigger (DELETE)
// ==========================================
router.delete("/delete/:rollNumber", async (req, res) => {
    try {
        const targetRoll = req.params.rollNumber.toUpperCase();
        
        const deletedStudent = await Student.findOneAndDelete({ rollNumber: targetRoll });
        if (!deletedStudent) {
            return res.status(404).json({ message: "Student not found!" });
        }

        // 📝 DATABASE TRIGGER: Auto Save Log for Delete Action
        const deleteLog = new Log({
            action: "DELETE",
            rollNumber: targetRoll,
            message: `Student '${deletedStudent.name}' was permanently removed from active collections.`
        });
        await deleteLog.save();

        res.status(200).json({ message: "Student Record Deleted Successfully! 🗑️" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;