import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Ensure bcrypt library is installed
import jwt from 'jsonwebtoken'; // Import jsonwebtoken

const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || 'RnNVoF4XRf3UwSA8WByFOrzU7DOqVI85Htt5R7J/U4s='; // Set a secret key for JWT

export default async function handler(req, res) {
    console.log('Register handler called with method:', req.method);

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed.' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
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

        // ✅ สร้าง user โดยกำหนด role เป็น 'user'
        const newUser = await prisma.user.create({
            data: { 
                name, 
                email, 
                password: hashedPassword,
                role: 'user' // กำหนดค่า default เป็น 'user'
            },
        });

        // ✅ สร้าง JWT Token พร้อม role
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role }, 
            SECRET_KEY, 
            { expiresIn: '1h' }
        );

        // ✅ ส่งข้อมูล user พร้อม role กลับไปยัง frontend
        res.status(201).json({
            message: 'User registered successfully!',
            token, 
            user: { 
                id: newUser.id, 
                name: newUser.name, 
                email: newUser.email, 
                role: newUser.role // ส่ง role กลับให้ frontend ใช้งาน
            },
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Failed to register user.', detail: error.message });
    } finally {
        await prisma.$disconnect();
    }
}
