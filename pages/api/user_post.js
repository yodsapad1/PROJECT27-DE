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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing the files:', err);
        return res.status(500).json({ error: 'Error parsing the files.' });
      }

      const { title, content, userId } = fields;

      const str_title = title[0]
      const str_content = content[0]
      const str_userID = userId[0]



      if (!str_title || !str_content || !str_userID) {
        return res.status(400).json({ message: 'Title, content, and user ID are required.' });
      }

      const imagePaths = [];
      const uploadsDir = path.join(process.cwd(), 'public/uploads');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Handle image uploads
      if (files.images && Array.isArray(files.images)) {
        for (const image of files.images) {
          const imageFileName = `${Date.now()}-${image.originalFilename}`;
          const newImagePath = path.join(uploadsDir, imageFileName);
          fs.renameSync(image.filepath, newImagePath); // Move the file
          imagePaths.push(`/uploads/${imageFileName}`);
        }
      }

      console.log(str_content, str_title, str_userID)
      if (userId == null) {
        return res.status(400).json({ message: 'Invalid user ID.' });
      }

      try {
        const userExists = await prisma.user.findUnique({ where: { id: str_userID } });

        if (!userExists) {
          return res.status(404).json({ message: 'User not found.' });
        }

        const newPost = await prisma.post.create({
          data: {
            title : str_title,
            content : str_content,
            images: { set: imagePaths },
            user: { connect: { id: str_userID } },
          },
        });

        return res.status(201).json('post succesfully');
      } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ message: 'Failed to create post.', detail: error.message });
      }
    });

  } else {
    // Handle unsupported methods
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}