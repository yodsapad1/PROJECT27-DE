import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Have bcrypt installed for password hashing

const prisma = new PrismaClient();

export default async function handler(req, res) {
    console.log('Handler called with method:', req.method); // For debugging

    // Handle GET requests to fetch users
    if (req.method === 'GET') {
        try {
            const users = await prisma.user.findMany(); // Fetch users from the User model
            console.log('Retrieved users:', users); // Log the retrieved users

            if (users.length === 0) {
                return res.status(404).json({ message: 'No users found.' });
            }

            return res.status(200).json(users); // Return users as JSON
        } catch (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({ message: 'Failed to fetch users.', detail: error.message });
        }
    }

    // Handle POST requests to register a new user
    if (req.method === 'POST') {
        const { name, email, password } = req.body; // Extract data from request body
        
        // Validate the provided data
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        try {
            // Check for existing user with the same email
            const existingUser = await prisma.user.findUnique({
                where: { email: email },
            });

            if (existingUser) {
                return res.status(409).json({ message: 'Email already registered.' });
            }

            // Hash the password before saving
            const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

            // Create a new user in the database
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword, // Store the hashed password
                },
            });

            // Respond with a success message and the newly created user info
            return res.status(201).json({
                message: 'User registered successfully!',
                user: { id: newUser.id, name: newUser.name, email: newUser.email },
            });
        } catch (error) {
            console.error('Error registering user:', error);
            return res.status(500).json({ message: 'Failed to register user.', detail: error.message });
        }
    }

    // Handle unsupported methods
    return res.status(405).json({ message: 'Method not allowed.' });
}
