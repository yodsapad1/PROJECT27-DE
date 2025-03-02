import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY ;

export const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.status(403).json({ message: 'Forbidden' });
        }
        req.user = user;
        next();
    });
};

export const adminMiddleware = (req, res, next) => {
    const rur = req.user.role
    // ตรวจสอบว่า req.user มีค่าอยู่หรือไม่และมี role ถูกต้อง
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' + rur });
    }
    // ใช้งานต่อไปหากผู้ใช้มีบทบาท admin
    next();
};