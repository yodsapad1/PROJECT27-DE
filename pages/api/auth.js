import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'RnNVoF4XRf3UwSA8WByFOrzU7DOqVI85Htt5R7J/U4s='; // Set a secret key for JWT


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
    console.log(req.user.role); // เพิ่มบรรทัดนี้เพื่อตรวจสอบค่า role ของผู้ใช้
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};