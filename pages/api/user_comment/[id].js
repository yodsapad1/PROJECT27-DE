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
  const { id } = req.query; // ดึง ID ของโพสต์จาก URL
  console.log("Received a request for post ID:", id);

  if (req.method === 'POST') {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ message: 'Error parsing the files.' });
      }

      console.log('Received data:', fields);
      console.log('Uploaded Files:', files);

      const { content, userId } = fields;
      const images = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
      const imageUrls = [];
      const uploadsDir = path.join(process.cwd(), 'public/uploads');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
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

      // เตรียมข้อมูลใหม่สำหรับสร้างคอมเมนต์
      const newCommentData = {
        content: content ? content[0] : null,
        postId: id,
        userId: userId[0], // รับค่าแรกจาก userId array
        images: imageUrls.length > 0 ? imageUrls : [], // ใช้ empty array
      };

      // ต้องแน่ใจว่ามี userId และ postId
      if (!newCommentData.userId || !newCommentData.postId) {
        return res.status(400).json({ message: 'Missing userId or postId' });
      }

      // ต้องแน่ใจว่ามีอย่างน้อยหนึ่งใน content หรือ images
      if (newCommentData.content && newCommentData.images.length === 0) {
        return res.status(400).json({ message: 'At least content or images must be provided' });
      }

      // สร้างคอมเมนต์ใหม่ในฐานข้อมูล
      try {
        const newComment = await prisma.comment.create({
          data: {
            content: newCommentData.content || '',
            userId: newCommentData.userId,
            postId: newCommentData.postId,
            images: newCommentData.images,
          },
        });
        console.log('New comment created:', newComment);
        return res.status(201).json(newComment);
      } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({
          message: 'Error creating comment.',
          detail: error.message || 'An unknown error occurred',  // ส่งกลับข้อผิดพลาดในกรณีเกิดข้อผิดพลาด
        });
      }
    });
  } else if (req.method === 'GET') {
    // Handle GET request to retrieve comments by postId
    try {
      const comments = await prisma.comment.findMany({
        where: { postId: id },
      });

      if (comments.length > 0) {
        console.log('Retrieved comments:', comments);
        return res.status(200).json(comments);
      } else {
        console.log('No comments found for post ID:', id);
        return res.status(404).json({ message: 'Comments not found' });
      }
    } catch (error) {
      console.error('Error retrieving comments:', error);
      return res.status(500).json({ message: 'Error retrieving comments.' });
    }
  } else {
    // กำหนดวิธีที่อนุญาต
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}