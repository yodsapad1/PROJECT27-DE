// pages/api/user_report.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // Disable default bodyParser for form data
  },
};

// API handler for reporting posts
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { fields } = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields) => {
        if (err) return reject(err);
        resolve({ fields });
      });
    });

    const { reason, userId, postId } = fields;

    // Validate required fields
    if (!reason || !userId || !postId) {
      return res.status(400).json({ message: 'Reason, userId, and postId are required.' });
    }

    try {
      // Create a new report
      const newReport = await prisma.report.create({
        data: {
          reason,
          userId,
          postId,
        },
      });

      return res.status(201).json(newReport); // Respond with the created report
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ message: 'Error creating report.', detail: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

