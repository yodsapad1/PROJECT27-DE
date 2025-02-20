import { PrismaClient } from '@prisma/client';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

// API handler for adding comments
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      // Handle errors during file parsing
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ message: 'Error parsing the files.' });
      }

      const { postId, content, userId } = fields;

      // Validate required fields: postId, content, and userId
      if (!postId || !content || !userId) {
        return res.status(400).json({ message: 'postId, content, and userId are required.' });
      }

      // Prepare to handle image uploads
      const images = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
      const imageUrls = [];
      const uploadsDir = path.join(process.cwd(), 'public/uploads');

      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Process the uploaded images
      for (const image of images) {
        const imageFileName = Date.now() + '-' + image.originalFilename;
        const newImagePath = path.join(uploadsDir, imageFileName);
        try {
          fs.renameSync(image.filepath, newImagePath); // Move the uploaded file
          imageUrls.push(`/uploads/${imageFileName}`); // Store the path of the image
        } catch (fileError) {
          console.error('Error saving uploaded image:', fileError);
          return res.status(500).json({ message: 'Error saving uploaded images.' });
        }
      }

      // Create a new comment in the database
      try {
        const newComment = await prisma.comment.create({
          data: {
            content,
            userId,
            postId,
            images: imageUrls, // Save the image URLs for the comment
          },
        });
        return res.status(201).json(newComment); // Respond with the created comment
      } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ message: 'Error creating comment.', detail: error.message });
      }
    });
  } else {
    // Specify allowed methods
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}