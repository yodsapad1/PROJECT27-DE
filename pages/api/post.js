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
  const {
    query: { id },
  } = req;

  if (req.method === 'POST') {
    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing the files.' });
      }

      console.log('Files received:', files);
      const { title, content } = fields;
      const postTitle = Array.isArray(title) ? title[0] : title;
      const postContent = Array.isArray(content) ? content[0] : content;
      const images = files.images || [];

      if (!postTitle || !postContent) {
        return res.status(400).json({ message: 'Title and content are required.' });
      }

      const imagePaths = [];

      if (Array.isArray(images) && images.length > 0) {
        const uploadsDir = path.join(process.cwd(), 'public/uploads');

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        for (const image of images) {
          const imageFileName = Date.now() + '-' + image.originalFilename;
          const newImagePath = path.join(uploadsDir, imageFileName);
          fs.renameSync(image.filepath, newImagePath);
          imagePaths.push(`/uploads/${imageFileName}`);
        }
      }

      try {
        const newPost = await prisma.post.create({
          data: {
            title: postTitle,
            content: postContent,
            images: { set: imagePaths },
            userId: Number(id),
          },
        });

        res.status(201).json(newPost);
      } catch (error) {
        console.error('Error creating post:', error.message);
        res.status(500).json({ message: 'Failed to create post.', detail: error.message });
      }
    });

  } else if (req.method === 'PUT') {
    // ** ฟังก์ชันแก้ไขโพสต์ **
    const { title, content, userId } = req.body;

    const post = await prisma.post.findUnique({ where: { id: Number(id) } });
    if (!post || post.userId !== Number(userId)) {
      return res.status(403).json({ error: 'Forbidden: You are not the owner of this post' });
    }

    try {
      const updatedPost = await prisma.post.update({
        where: { id: Number(id) },
        data: { title, content },
      });
      res.status(200).json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update post.', detail: error.message });
    }

 
  } else if (req.method === 'PATCH') {
    // ** ฟังก์ชันแก้ไขคอมเมนต์ **
    const { commentId, content, userId } = req.body;

    const comment = await prisma.comment.findUnique({ where: { id: Number(commentId) } });
    if (!comment || comment.userId !== Number(userId)) {
      return res.status(403).json({ error: 'Forbidden: You are not the owner of this comment' });
    }

    try {
      const updatedComment = await prisma.comment.update({
        where: { id: Number(commentId) },
        data: { content },
      });
      res.status(200).json(updatedComment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update comment.', detail: error.message });
    }
  } else {
    // ** วิธีที่ไม่ได้รับอนุญาต **
    res.setHeader('Allow', ['POST', 'PUT', 'DELETE', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}