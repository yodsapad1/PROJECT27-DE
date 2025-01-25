import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Ensure bcrypt library is installed

const prisma = new PrismaClient(); // Initialize Prisma Client

export default async function handler(req, res) {
    console.log('Register handler called with method:', req.method); // Log the method called

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed.' });
    }

    const { name, email, password } = req.body; // Extract data from request body

    // Check that all necessary data is provided
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    try {
        console.log('Checking for existing user with email:', email); // Log the email being checked

        // Check if email is already registered
        const existingUser = await prisma.user.findUnique({
            where: { email: email }, // Ensure 'user' matches the model name in the schema
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10); // Hashing with bcrypt

        // Create the new user in the database
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword, // Store the hashed password
            },
        });

        // Success response
        res.status(201).json({
            message: 'User registered successfully!',
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
        });
    } catch (error) {
        console.error('Error registering user:', error); // Log the error message
        res.status(500).json({ message: 'Failed to register user.', detail: error.message });
    } finally {
        await prisma.$disconnect(); // Always disconnect the Prisma client
    }
}