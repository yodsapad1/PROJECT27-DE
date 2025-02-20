// pages/api/user_report.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // Disable default bodyParser for form data
  },
};

export default async function handler(req, res) {
<<<<<<< HEAD
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
=======
  if (req.method === 'POST') {
    const { fields } = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields) => {
        if (err) return reject(err);
        resolve({ fields });
>>>>>>> parent of d4b0fbb (gg)
      });
    } catch (error) {
      console.error("Error parsing form data:", error);
      return res.status(500).json({ message: "Error parsing the files." });
    }

<<<<<<< HEAD
    console.log("Received fields:", fields);
    const { reason, userId } = fields;

    if (!reason || !userId || !id) {
      console.error("Missing fields:", { reason, userId, id });
=======
    const { reason, userId, postId } = fields;

    // Validate required fields
    if (!reason || !userId || !postId) {
>>>>>>> parent of d4b0fbb (gg)
      return res.status(400).json({ message: 'Reason, userId, and postId are required.' });
    }

    try {
<<<<<<< HEAD
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
=======
      // Create a new report
>>>>>>> parent of d4b0fbb (gg)
      const newReport = await prisma.report.create({
        data: {
          reason,
          userId,
          postId,
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
<<<<<<< HEAD
    
    
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
=======
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

>>>>>>> parent of d4b0fbb (gg)
