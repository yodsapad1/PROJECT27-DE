import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY; // Replace with your secret key

export const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from the Authorization header

    if (!token) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token is invalid.' });
        }

        req.user = decoded; // Save user info for future use
        next();
    });
};

