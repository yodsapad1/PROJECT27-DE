// pages/api/user_report/[id].js
import { PrismaClient } from '@prisma/client';
import { IncomingForm } from 'formidable';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // Disable default bodyParser for form data
  },
};

// API handler for reporting posts
export default async function handler(req, res) {
  const { id } = req.query; // Get postId parameter from the URL
  console.log('Request received for postId:', id); // Log the postId received

  if (req.method === 'POST') {
    // Parse incoming form data
    const { fields } = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields) => {
        if (err) return reject(err);
        resolve({ fields });
      });
    });

    const { reason, userId } = fields;

    // Validate required fields
    if (!reason || !userId || !id) {
      return res.status(400).json({ message: 'Reason, userId, and postId are required.' });
    }

    try {
      // Check if user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Check if post exists
      const postExists = await prisma.post.findUnique({
        where: { id },
      });

      if (!postExists) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      console.log("Creating a new report for the post...");
      // Create a new report
      const newReport = await prisma.report.create({
        data: {
          reason,
          userId,
          postId: id,
        },
      });

      return res.status(201).json(newReport); // Respond with the created report
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ message: 'Error creating report.', detail: error.message });
    }

  } else if (req.method === 'GET') {
    try {
      console.log("Fetching reports for the post...");
      // Fetch reports for the specific post ID
      const reports = await prisma.report.findMany({
        where: { postId: id },
      });

      return res.status(200).json(reports); // Respond with the fetched reports
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ message: 'Error fetching reports.', detail: error.message });
    }
  } else {
    // Specify allowed methods
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}