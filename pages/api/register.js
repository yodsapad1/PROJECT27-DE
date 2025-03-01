import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Ensure bcrypt library is installed
import jwt from 'jsonwebtoken'; // Import jsonwebtoken

const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key'; // Set a secret key for JWT

export default async function handler(req, res) {
    console.log('Register handler called with method:', req.method);

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed.' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // ตรวจสอบอีเมลว่าไม่ควรมีคำว่า "admin"
    if (email.includes('admin')) {
        return res.status(400).json({ message: 'Email cannot contain the word "admin".' });
    }

    try {
        console.log('Checking for existing user with email:', email);

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });

        // Create JWT token
        const token = jwt.sign({ id: newUser.id, email: newUser.email }, SECRET_KEY, { expiresIn: '1h' });

        // Success response
        res.status(201).json({
            message: 'User registered successfully!',
            token, // Include the JWT token in the response
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Failed to register user.', detail: error.message });
    } finally {
        await prisma.$disconnect();
    }
}