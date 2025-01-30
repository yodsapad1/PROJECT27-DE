const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// ตัวแปรเก็บรายงานในรูปแบบ array
let reports = [];

// API สำหรับเพิ่มรายงาน
app.post('/report', (req, res) => {
    const { title, description, date } = req.body;

    const newReport = {
        id: reports.length + 1,  // สร้าง ID สำหรับรายงาน
        title,
        description,
        date: date || new Date().toISOString()  // ใช้วันที่ปัจจุบันถ้าไม่ระบุ
    };

    reports.push(newReport);  // เพิ่มรายงานเข้าไปใน array
    res.status(201).json(newReport);  // ส่งกลับรายงานใหม่
});

// API สำหรับแสดงรายงานทั้งหมด
app.get('/reports', (req, res) => {
    res.json(reports);  // ส่งกลับ array ของรายงาน
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});