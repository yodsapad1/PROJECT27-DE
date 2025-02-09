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
        return res.status(500).json({ error: 'Error parsing the files.' });
      }

      const { title, content, userId } = fields;
      const postTitle = Array.isArray(title) ? title[0] : title;
      const postContent = Array.isArray(content) ? content[0] : content;

      // ตรวจสอบไฟล์ที่ได้รับ
      const images = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
      console.log('Images received:', images); // เพิ่ม log เพื่อเช็คค่าภาพ

      if (!postTitle || !postContent || !userId) {
        return res.status(400).json({ message: 'Title, content, and userId are required.' });
      }

      const imagePaths = [];
      const uploadsDir = path.join(process.cwd(), 'public/uploads');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      if (images.length > 0) {
        for (const image of images) {
          const imageFileName = Date.now() + '-' + image.originalFilename; // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
          const newImagePath = path.join(uploadsDir, imageFileName);
          fs.renameSync(image.filepath, newImagePath); // ย้ายไฟล์ไปที่ปลายทาง
          imagePaths.push(`/uploads/${imageFileName}`); // บันทึก path ของภาพ
        }
      }

      console.log('Image paths:', imagePaths); // ดูว่า paths ของภาพถูกต้อง
      
      try {
        const newPost = await prisma.post.create({
          data: {
            title: postTitle,
            content: postContent,
            userId: String(userId),
            images: imagePaths.length > 0 ? imagePaths : [], // ส่งค่าภาพ 
          },
        });
        return res.status(201).json(newPost);
      } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ message: 'Failed to create post.', detail: error.message });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}