import { PrismaClient } from '@prisma/client';
import { IncomingForm } from 'formidable';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // Disable default bodyParser for form data
  },
};

export default async function handler(req, res) {
  const { id } = req.query; // Get postId parameter from the URL
  console.log('Request received for postId:', id);

  if (req.method === 'POST') {
    let fields;
    try {
      // Parse incoming form data
      fields = await new Promise((resolve, reject) => {
        const form = new IncomingForm();
        form.parse(req, (err, fields) => {
          if (err) return reject(err);
          resolve(fields);
        });
      });
    } catch (error) {
      console.error("Error parsing form data:", error);
      return res.status(500).json({ message: "Error parsing the files." });
    }

    console.log("Received fields:", fields);
    let { reason, userId } = fields;

    // Minimal change: extract first element if fields are arrays
    if (Array.isArray(reason)) reason = reason[0];
    if (Array.isArray(userId)) userId = userId[0];

    if (!reason || !userId || !id) {
      console.error("Missing fields:", { reason, userId, id });
      return res.status(400).json({ message: 'Reason, userId, and postId are required.' });
    }

    try {
      // Check if user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!userExists) {
        console.error("User not found:", userId);
        return res.status(404).json({ message: 'User not found.' });
      }

      // Check if post exists
      const postExists = await prisma.post.findUnique({
        where: { id },
      });
      if (!postExists) {
        console.error("Post not found:", id);
        return res.status(404).json({ message: 'Post not found.' });
      }

      console.log("Creating a new report for the post...");
      const newReport = await prisma.report.create({
        data: {
          reason,
          userId,
          postId: id,
        },
      });

      console.log("Report created successfully:", newReport);
      return res.status(201).json(newReport); // Respond with the created report
    } catch (error) {
      console.error('Error creating report:', error);
      const errorMessage =
        error && typeof error === "object" && error.message
          ? error.message
          : "Unknown error";
      return res.status(500).json({ message: 'Error creating report.', detail: errorMessage });
    }
    
  } else if (req.method === 'GET') {
    try {
      console.log("Fetching reports for the post...");
      const reports = await prisma.report.findMany({
        where: { postId: id },
      });
      return res.status(200).json(reports); // Respond with the fetched reports
    } catch (error) {
      console.error('Error fetching reports:', error);
      const errorMessage =
        error && typeof error === "object" && error.message
          ? error.message
          : "Unknown error";
      return res.status(500).json({ message: 'Error fetching reports.', detail: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
