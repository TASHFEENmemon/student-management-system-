const API_URL = "http://127.0.0.1:5000/api/students";

// 🔥 TOP ENGINE HOOK: SECURE ADMIN CONTROL VALIDATORS
const ADMIN_API_URL = "http://127.0.0.1:5000/api/admin";
const loginOverlay = document.getElementById("loginOverlay");
const mainDashboardApp = document.getElementById("mainDashboardApp");
const loginForm = document.getElementById("loginForm");
const loginAlert = document.getElementById("loginAlert");

if (localStorage.getItem("adminSession") === "active") {
    bypassLoginGate();
}

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;
        const loginBtn = document.getElementById("loginBtn");

        loginBtn.innerText = "Verifying Credentials... ⏳";
        loginBtn.disabled = true;
        loginAlert.classList.add("d-none");

        try {
            const response = await fetch(`${ADMIN_API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem("adminSession", "active");
                bypassLoginGate();
                alert(data.message);
            } else {
                loginAlert.innerText = data.message || "Invalid Credentials! ❌";
                loginAlert.classList.remove("d-none");
            }
        } catch (error) {
            console.error("Login Server Fault:", error);
            loginAlert.innerText = "Error: Backend Identity Route is unreachable! ❌";
            loginAlert.classList.remove("d-none");
        } finally {
            loginBtn.innerText = "Verify Identity & Connect 🔌";
            loginBtn.disabled = false;
        }
    });
}

function bypassLoginGate() {
    if (loginOverlay) {
        loginOverlay.style.opacity = "0";
        setTimeout(() => {
            loginOverlay.style.display = "none";
        }, 500);
    }
    if (mainDashboardApp) {
        mainDashboardApp.classList.add("dashboard-active");
    }
}

function logoutAdmin() {
    localStorage.removeItem("adminSession");
    alert("Logged out successfully. Secure Gate locked! 🔒");
    window.location.reload();
}

// DOM Elements
const studentForm = document.getElementById("studentForm");
const studentTableBody = document.getElementById("studentTableBody");
const searchBar = document.getElementById("searchBar");

// Form Core Elements
const rollNumberInput = document.getElementById("rollNumber");
const nameInput = document.getElementById("name");
const departmentInput = document.getElementById("department"); 
const semesterInput = document.getElementById("semester");
const attendanceInput = document.getElementById("attendance");
const gpaInput = document.getElementById("gpa");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Form Extended Elements
const parentPhoneInput = document.getElementById("parentPhone");
const parentEmailInput = document.getElementById("parentEmail");
const studentAddressInput = document.getElementById("studentAddress");

// KPI & Dynamic Widget Selectors
const totalStudentsCard = document.getElementById("totalStudentsCard");
const avgGpaCard = document.getElementById("avgGpaCard");
const avgAttendanceCard = document.getElementById("avgAttendanceCard");
const aiAlertText = document.getElementById("aiAlertText");
const riskAlertsContainer = document.getElementById("riskAlertsContainer");

let allStudents = []; 
let isEditMode = false; 

let deptChartInstance = null;
let attendanceChartInstance = null;
let gpaChartInstance = null;

document.addEventListener("DOMContentLoaded", fetchStudents);

// 1. FETCH ALL DATA
async function fetchStudents() {
    try {
        const response = await fetch(`${API_URL}/all`);
        allStudents = await response.json();
        
        const analyticsResponse = await fetch(`${API_URL}/analytics`);
        const analyticsData = await analyticsResponse.json();

        if (analyticsData.success) {
            if (totalStudentsCard) totalStudentsCard.innerText = analyticsData.totalStudents;
            if (avgGpaCard) avgGpaCard.innerText = analyticsData.avgGpa;
            if (avgAttendanceCard) avgAttendanceCard.innerText = `${analyticsData.avgAttendance}%`;
        }

        renderTable(allStudents); 
        updateCharts(allStudents); 
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// 2. RENDER TABLE WITH MONGO OBJECTID AUTO-MAPPING LOGIC
function renderTable(studentsList) {
    let riskCount = 0;
    riskAlertsContainer.innerHTML = ""; 

    studentsList.forEach(s => {
        const currentGpa = s.gpa !== undefined && s.gpa !== null ? s.gpa : "N/A";
        if (currentGpa !== "N/A" && parseFloat(currentGpa) > 0 && parseFloat(currentGpa) < 2.0) {
            riskCount++;
            const alertBox = document.createElement("div");
            alertBox.className = "alert alert-danger p-2 d-flex justify-content-between align-items-center mb-2 shadow-sm";
            alertBox.style.fontSize = "0.85rem";
            alertBox.innerHTML = `<span>⚠️ <strong>${s.name}</strong> (${s.rollNumber}) has critical GPA: <strong>${currentGpa}</strong></span>`;
            riskAlertsContainer.appendChild(alertBox);
        }
    });

    if (aiAlertText) {
        if (riskCount > 0) {
            aiAlertText.innerHTML = `<span class="text-danger fw-bold">🚨 ${riskCount} Student(s) under academic risk! Review logs below.</span>`;
        } else {
            aiAlertText.innerHTML = `<span class="text-success fw-medium">✅ System stable. All student tracks are optimal.</span>`;
        }
    }

    studentTableBody.innerHTML = "";
    studentsList.forEach(student => {
        const attendanceVal = student.attendance !== undefined && student.attendance !== null ? student.attendance : "N/A";
        const gpaVal = student.gpa !== undefined && student.gpa !== null ? student.gpa : "N/A";
        
        let deptVal = student.department ? student.department : "CS";
        if (typeof deptVal === 'string') {
            const cleanId = deptVal.toLowerCase().trim();
            if (cleanId === "6a19e25df30a35a57e197ac2") deptVal = "CS";
            else if (cleanId === "6a19e2d3f30a35a57e197ac4") deptVal = "EE";
            else if (cleanId === "6a19e329f30a35a57e197ac6") deptVal = "BBA";
            else if (cleanId === "6a19e337f30a35a57e197ac8") deptVal = "BEd";
            else if (cleanId === "6a19e34af30a35a57e197aca") deptVal = "CSE";
            else { deptVal = deptVal.toUpperCase(); }
        }

        const safeName = student.name.replace(/'/g, "\\'");
        const safePhone = (student.parentPhone || "").replace(/'/g, "\\'");
        const safeEmail = (student.parentEmail || "").replace(/'/g, "\\'");
        const safeAddress = (student.studentAddress || "").replace(/'/g, "\\'").replace(/\n/g, " ");

        let attendanceBadgeClass = "badge bg-light text-dark border px-3 py-1.5 rounded-pill";
        if (attendanceVal !== "N/A" && parseFloat(attendanceVal) < 75) {
            attendanceBadgeClass = "badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1.5 rounded-pill fw-bold"; 
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><span class="fw-semibold text-primary">${student.rollNumber}</span></td>
            <td class="fw-medium text-dark">${student.name}</td>
            <td><span class="custom-badge-dept">${deptVal}</span></td>
            <td><span class="custom-badge-sem">Sem ${student.semester}</span></td>
            <td><span class="${attendanceBadgeClass}">${attendanceVal !== "N/A" ? attendanceVal + '%' : 'N/A'}</span></td>
            <td><span class="custom-badge-gpa">${gpaVal}</span></td>
            
            <td class="text-end">
                <button class="btn btn-sm px-2 py-1 border-0 rounded-2 fw-medium me-1" 
                        style="background-color: #fef3c7; color: #d97706; font-size: 0.8rem;"
                        onclick="editStudent('${student.rollNumber}', '${safeName}', '${deptVal}', ${student.semester}, ${attendanceVal === 'N/A' ? 0 : attendanceVal}, ${gpaVal === 'N/A' ? 0 : gpaVal}, '${safePhone}', '${safeEmail}', '${safeAddress}')">
                    Edit 📝
                </button>
                <button class="btn btn-sm px-2 py-1 border-0 rounded-2 fw-medium" 
                        style="background-color: #fee2e2; color: #dc2626; font-size: 0.8rem;"
                        onclick="deleteStudent('${student.rollNumber}')">
                    Delete 🗑️
                </button>
            </td>
        `;
        studentTableBody.appendChild(row);
    });
}

// 3. SEARCH / FILTER FUNCTION
function filterStudents() {
    const searchText = searchBar.value.toLowerCase();
    const filtered = allStudents.filter(student => {
        let mappedDept = student.department ? student.department.toLowerCase() : "cs";
        if (mappedDept === "6a19e25df30a35a57e197ac2") mappedDept = "cs";
        else if (mappedDept === "6a19e2d3f30a35a57e197ac4") mappedDept = "ee";
        else if (mappedDept === "6a19e329f30a35a57e197ac6") mappedDept = "bba";
        else if (mappedDept === "6a19e337f30a35a57e197ac8") mappedDept = "bed";
        else if (mappedDept === "6a19e34af30a35a57e197aca") mappedDept = "cse";

        return student.name.toLowerCase().includes(searchText) || 
               student.rollNumber.toLowerCase().includes(searchText) ||
               mappedDept.includes(searchText);
    });
    renderTable(filtered); 
}

// 4. GENERATE LIVE CHARTS
function updateCharts(studentsList) {
    const deptCounts = {};
    studentsList.forEach(s => {
        let d = s.department ? s.department.toUpperCase() : "CS";
        if (d === "6A19E25DF30A35A57E197AC2") d = "CS";
        else if (d === "6A19E2D3F30A35A57E197AC4") d = "EE";
        else if (d === "6A19E329F30A35A57E197AC6") d = "BBA";
        else if (d === "6A19E337F30A35A57E197AC8") d = "BED";
        else if (d === "6A19E34AF30A35A57E197ACA") d = "CSE";
        
        deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    const deptLabels = Object.keys(deptCounts);
    const deptData = Object.values(deptCounts);

    if (document.getElementById('deptChart')) {
        if (deptChartInstance) deptChartInstance.destroy();
        deptChartInstance = new Chart(document.getElementById('deptChart'), {
            type: 'doughnut',
            data: {
                labels: deptLabels,
                datasets: [{
                    data: deptData,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } } }
        });
    }

    if (document.getElementById('attendanceTrendChart')) {
        if (attendanceChartInstance) attendanceChartInstance.destroy();
        const attValues = studentsList.map(s => parseFloat(s.attendance) || 0).slice(-6);
        attendanceChartInstance = new Chart(document.getElementById('attendanceTrendChart'), {
            type: 'line',
            data: {
                labels: attValues.map((_, i) => i + 1),
                datasets: [{ data: attValues, borderColor: '#f59e0b', tension: 0.4, fill: false, borderWidth: 2, pointRadius: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }

    if (document.getElementById('gpaTrendChart')) {
        if (gpaChartInstance) gpaChartInstance.destroy();
        const gpaValues = studentsList.map(s => parseFloat(s.gpa) || 0).slice(-6);
        gpaChartInstance = new Chart(document.getElementById('gpaTrendChart'), {
            type: 'line',
            data: {
                labels: gpaValues.map((_, i) => i + 1),
                datasets: [{ data: gpaValues, borderColor: '#10b981', tension: 0.4, fill: false, borderWidth: 2, pointRadius: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }
}

// 5. EDIT LOGIC
function editStudent(roll, name, dept, sem, att, gpa, phone, email, address) {
    isEditMode = true;
    formTitle.innerText = "📝 Edit Student Record";
    submitBtn.innerText = "Update Record 🔄";
    submitBtn.className = "btn btn-success btn-sm w-100 shadow-sm mt-2";
    cancelEditBtn.classList.remove("d-none");

    rollNumberInput.value = roll;
    rollNumberInput.disabled = true; 

    nameInput.value = name;
    departmentInput.value = dept; 
    semesterInput.value = sem;
    attendanceInput.value = att;
    gpaInput.value = gpa;

    parentPhoneInput.value = phone || "";
    parentEmailInput.value = email || "";
    studentAddressInput.value = address || "";
}

function resetFormState() {
    isEditMode = false;
    formTitle.innerText = "📝 Add New Student";
    submitBtn.innerText = "Save Student Record 🚀";
    submitBtn.className = "btn btn-primary btn-sm w-100 shadow-sm mt-2";
    cancelEditBtn.classList.add("d-none");
    rollNumberInput.disabled = false;
    
    studentForm.reset();

    if (parentPhoneInput) parentPhoneInput.value = "";
    if (parentEmailInput) parentEmailInput.value = "";
    if (studentAddressInput) studentAddressInput.value = "";
}

// 6. SUBMIT FORM
studentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const studentData = {
        rollNumber: rollNumberInput.value.trim(),
        name: nameInput.value.trim(),
        department: departmentInput.value, 
        semester: parseInt(semesterInput.value),
        attendance: parseFloat(attendanceInput.value), 
        gpa: parseFloat(gpaInput.value),
        parentPhone: parentPhoneInput.value.trim(),
        parentEmail: parentEmailInput.value.trim(),
        studentAddress: studentAddressInput.value.trim()
    };

    let fetchUrl = `${API_URL}/add`;
    let reqMethod = "POST";

    if (isEditMode) {
        fetchUrl = `${API_URL}/update/${studentData.rollNumber}`;
        reqMethod = "PUT";
    }

    try {
        const response = await fetch(fetchUrl, {
            method: reqMethod,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || "Success! ✅");
            resetFormState();
            fetchStudents(); 
        } else {
            alert(`Validation Alert: ${result.message}`);
        }
    } catch (error) {
        console.error("Error saving data:", error);
    }
});

// 7. DELETE STUDENT
async function deleteStudent(rollNumber) {
    if (!confirm(`Kya aap Roll No: ${rollNumber} ka record delete karna chahte hain?`)) return;
    try {
        const response = await fetch(`${API_URL}/delete/${rollNumber}`, { method: "DELETE" });
        const result = await response.json();
        if (response.ok) {
            alert(result.message || "Deleted! 🗑️");
            fetchStudents();
        }
    } catch (error) {
        console.error("Error deleting:", error);
    }
}

// 🔥 8. DYNAMIC EXPORT SYSTEM (BLOB STREAM COMPILER)
function downloadCSVReport() {
    if (allStudents.length === 0) {
        alert("Database empty hai! Pehle data add karein. ❌");
        return;
    }

    // Creating Standard CSV Structure Strings
    let csvContent = "data:text/csv;charset=utf-8,Roll Number,Full Name,Department,Semester,Attendance %,GPA\n";

    allStudents.forEach(student => {
        let deptVal = student.department ? student.department : "CS";
        if (typeof deptVal === 'string') {
            const cleanId = deptVal.toLowerCase().trim();
            if (cleanId === "6a19e25df30a35a57e197ac2") deptVal = "CS";
            else if (cleanId === "6a19e2d3f30a35a57e197ac4") deptVal = "EE";
            else if (cleanId === "6a19e329f30a35a57e197ac6") deptVal = "BBA";
            else if (cleanId === "6a19e337f30a35a57e197ac8") deptVal = "BEd";
            else if (cleanId === "6a19e34af30a35a57e197aca") deptVal = "CSE";
            else { deptVal = deptVal.toUpperCase(); }
        }
        const row = `"${student.rollNumber}","${student.name}","${deptVal}","${student.semester}","${student.attendance || 0}%","${student.gpa || 0}"`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Academic_Records_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}