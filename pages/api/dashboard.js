import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from './auth'; // Ensure the correct path to your middleware

const prisma = new PrismaClient();

export default async function handler(req, res) {
    await authMiddleware(req, res, async () => {
        await adminMiddleware(req, res, async () => {
            if (req.method === 'GET') {
                try {
                    // Fetch any necessary data for the dashboard
                    const data = await prisma.report.findMany(); // Fetch reports, adjust the model name as necessary
                    return res.status(200).json(data);
                } catch (error) {
                    return res.status(500).json({ message: 'Failed to fetch dashboard data.', detail: error.message });
                }
            } else {
                return res.status(405).json({ message: 'Method not allowed.' }); // Handle other HTTP methods
            }
        });
    });
}