import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'


dotenv.config()

const SECRET_KEY = process.env.JWT_SECRET || 'RnNVoF4XRf3UwSA8WByFOrzU7DOqVI85Htt5R7J/U4s='; // ใช้ JWT_SECRET จาก .env


export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.status(403).json({ message: 'Forbidden' });
        }

  
        console.log("Decoded token user:", user);
      
        req.user = user;
        next();

    });
};