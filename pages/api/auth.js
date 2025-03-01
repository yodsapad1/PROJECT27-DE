import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'RnNVoF4XRf3UwSA8WByFOrzU7DOqVI85Htt5R7J/U4s='; // Set a secret key for JWT

export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // ดึง token จาก headers

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' }); // ใช้ res.status()
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' }); // ใช้ res.status()
        }

        req.user = user;
        next();
    });
};