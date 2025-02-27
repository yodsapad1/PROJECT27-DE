import { PrismaClient } from '@prisma/client';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // Disable bodyParser to handle with formidable
  },
};

export default async function handler(req, res) {
  const { id } = req.query;
  console.log("Received originalCommentId:", id);

  if (!id) {
    console.error('No originalCommentId provided in the request');
    return res.status(400).json({ message: 'originalCommentId is required' });
  }

  if (req.method === 'POST') {
    const form = new IncomingForm(); // Use IncomingForm

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ message: 'Error parsing form data.' });
      }

      console.log('Received data:', fields);
      console.log('Uploaded files:', files);

      const { content, userId } = fields;
      const contentValue = Array.isArray(content) ? content[0] : content;
      const userIdValue = Array.isArray(userId) ? userId[0] : userId;
      const images = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
      const imageUrls = [];
      const uploadsDir = path.join(process.cwd(), 'public/uploads');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Uploads directory created at:', uploadsDir);
      } else {
        console.log('Uploads directory already exists at:', uploadsDir);
      }

      for (const image of images) {
        const imageFileType = image.mimetype.split('/')[0];
        if (imageFileType !== 'image') {
          return res.status(400).json({ message: 'Only image files are allowed.' });
        }

        const imageFileName = `${Date.now()}-${image.originalFilename}`;
        const newImagePath = path.join(uploadsDir, imageFileName);

        try {
          fs.renameSync(image.filepath, newImagePath);
          imageUrls.push(`/uploads/${imageFileName}`);
          console.log(`Image saved: ${newImagePath}`);
        } catch (fileError) {
          console.error('Error saving uploaded image:', fileError);
          return res.status(500).json({ message: 'Error saving uploaded images.' });
        }
      }

      const newReplyData = {
        content: contentValue || '',
        originalCommentId: id || '',
        userId: userIdValue || '',
        images: imageUrls.length > 0 ? imageUrls : [],
      };

      if (!newReplyData.userId || !newReplyData.originalCommentId) {
        console.log('Received data:', newReplyData);
        return res.status(400).json({
          message: 'Missing userId or originalCommentId',
          userId: newReplyData.userId,
          originalCommentId: newReplyData.originalCommentId
        });
      }

      try {
        const newReply = await prisma.reply.create({
          data: newReplyData,
        });
        console.log('New reply created:', newReply);
        return res.status(201).json(newReply);
      } catch (error) {
        console.error('Error creating reply:', error);
        return res.status(500).json({
          message: 'Error creating reply.',
          detail: error.message || 'An unknown error occurred',
        });
      }
    });
  } else if (req.method === 'GET') {
    console.log(`GET request for replies related to comment ID: ${id}`);
    try {
      const replies = await prisma.reply.findMany({
        where: { originalCommentId: id },
      });

      if (replies.length > 0) {
        console.log('Retrieved replies:', replies);
        return res.status(200).json(replies);
      } else {
        console.log('No replies found for original comment ID:', id);
        return res.status(404).json({ message: 'Replies not found' });
      }
    } catch (error) {
      console.error('Error retrieving replies:', error);
      return res.status(500).json({ message: 'Error retrieving replies.' });
    }
  } else if (req.method === 'DELETE') {
    const form = new IncomingForm();

    form.parse(req, async (err, fields) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ message: 'Error parsing form data.' });
      }

      const { replyId, userId } = fields;

      if (!replyId || !userId) {
        console.error('Missing replyId or userId in the request body');
        return res.status(400).json({ message: 'replyId and userId are required' });
      }

      console.log(`Delete request for reply with ID: ${replyId} by user ${userId}`);

      try {
        const reply = await prisma.reply.findUnique({
          where: { id: replyId },
        });

        if (!reply) {
          console.log('Reply not found for deletion:', replyId);
          return res.status(404).json({ message: 'Reply not found' });
        }

        if (reply.userId !== userId) {
          console.log(`Permission denied for user ${userId} to delete reply: ${replyId}`);
          return res.status(403).json({ message: 'You do not have permission to delete this reply.' });
        }

        await prisma.reply.delete({
          where: { id: replyId },
        });

        console.log('Deleted reply:', replyId);
        return res.status(200).json({ message: 'Reply deleted successfully' });
      } catch (error) {
        if (error && typeof error === 'object') {
          console.error('Error deleting reply:', error);
        } else {
          console.error('An unknown error occurred while deleting the reply.');
        }

        return res.status(500).json({ message: 'Error deleting reply.' });
      }
    });
  } else {
    console.log(`Method ${req.method} not allowed.`);
    res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}