import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY; // ตั้งค่าลับในไฟล์ .env ของคุณ

export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // ดึง token จาก headers

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' }); // ใช้ res.status()
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' }); // ใช้ res.status()
        }

        req.user = user; // เก็บข้อมูลผู้ใช้ที่ตรวจสอบใน req
        next(); // เรียกใช้ฟังก์ชันถัดไป
    });
};