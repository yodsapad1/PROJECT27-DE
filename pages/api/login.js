import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY; // กำหนดกุญแจลับสำหรับ JWT

export default async function handler(req, res) {
    console.log('Login handler called with method:', req.method); // Log the method called

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed.' });
    }

    // ดึงค่า email และ password จาก request body
    const { email, password } = req.body;

    // Validate that the necessary data is provided
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        // Check if the user exists
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Compare the provided password with the stored hashed password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Create JWT token
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '12h' });

        // Determine role based on email
        const isAdmin = email.includes('admin');

        // Respond with success message and user info (omit password for security)
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: isAdmin ? 'admin' : 'user' // Set role based on email
            },
            adminMenu: isAdmin // Send flag for admin menu access
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to log in.', detail: error.message });
    } finally {
        await prisma.$disconnect(); // Ensure Prisma client is disconnected
    }
}