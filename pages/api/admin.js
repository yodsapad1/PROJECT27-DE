import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './middleware/authenticateToken.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const users = [{ id: 1, email: 'admin@example.com', password: 'password', role: 'admin' }];

// Login route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user && user.role === 'admin') {
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY, { expiresIn: '1h' });
        return res.json({ message: 'Login successful', token });
    }
    return res.status(401).json({ message: 'Invalid email or password' });
});

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});