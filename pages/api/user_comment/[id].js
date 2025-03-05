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
  const { id } = req.query; // ดึง ID ของโพสต์หรือคอมเมนต์จาก URL
  console.log("Received a request for ID:", id);

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
        content: content ? content[0] : '',
        postId: id,
        userId: userId ? userId[0] : '', // รับค่าแรกจาก userId array
        images: imageUrls.length > 0 ? imageUrls : [], // ใช้ empty array
      };

      // ตรวจสอบว่า userId และ postId มีอยู่หรือไม่
      if (!newCommentData.userId || !newCommentData.postId) {
        return res.status(400).json({ message: 'Missing userId or postId' });
      }

      // สร้างคอมเมนต์ใหม่ในฐานข้อมูล
      try {
        const newComment = await prisma.comment.create({
          data: {
            content: newCommentData.content || '',
            userId: newCommentData.userId,
            postId: newCommentData.postId,
            images: newCommentData.images || [],
          },
        });
        console.log('New comment created:', newComment);
        return res.status(201).json(newComment);
      } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({
          message: 'Error creating comment.',
          detail: error.message || 'An unknown error occurred',
        });
      }
    });
  } else if (req.method === 'GET') {
    // Handle GET request to retrieve comments by postId
    try {
        const comments = await prisma.comment.findMany({
            where: { postId: id },
            include: {
                user: { select: { name: true } } // ✅ ดึงชื่อผู้ใช้แทน userId
            }
        });

        if (comments.length > 0) {
            // ✅ แปลงข้อมูลให้แสดง name แทน userId
            const formattedComments = comments.map(comment => ({
                ...comment,
                username: comment.user.name, // ใช้ name เป็น username
            }));

            console.log('Retrieved comments:', formattedComments);
            return res.status(200).json(formattedComments);
        } else {
            console.log('No comments found for post ID:', id);
            return res.status(404).json({ message: 'Comments not found' });
        }
    } catch (error) {
        console.error('Error retrieving comments:', error);
        return res.status(500).json({ message: 'Error retrieving comments.' });
    }
  } else if (req.method === 'DELETE') {
    // Handle DELETE request for deleting a comment
    try {
        const { userId } = req.query; // ดึง userId จาก query string

        // ค้นหาคอมเมนต์ที่ต้องการลบ
        const comment = await prisma.comment.findUnique({
            where: { id: id },
            include: { replies: true } // ตรวจสอบว่ามี replies หรือไม่
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // ตรวจสอบว่า userId ที่ส่งมาคือเจ้าของคอมเมนต์หรือไม่
        if (comment.userId !== userId) {
            return res.status(403).json({ message: 'You do not have permission to delete this comment.' });
        }

        // **1. ลบ Reply ทั้งหมดที่เชื่อมโยงกับ Comment นี้**
        await prisma.reply.deleteMany({
            where: { originalCommentId: id }
        });

        // **2. ลบคอมเมนต์**
        await prisma.comment.delete({
            where: { id: id },
        });

        console.log('Deleted comment:', id);
        return res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ message: 'Error deleting comment.', detail: error.message });
    }
  } else {
    // กำหนดวิธีที่อนุญาต
    res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}