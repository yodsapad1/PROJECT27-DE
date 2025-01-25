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

      const { content, postId } = fields;
      const image = files.image; // ไฟล์ภาพ

      let imageUrl = null;

      // การจัดการไฟล์ภาพ
      if (image) {
        const uploadsDir = path.join(process.cwd(), 'public/uploads');
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageFileName = `${Date.now()}-${image.originalFilename}`;
        const newImagePath = path.join(uploadsDir, imageFileName);

        // ย้ายไฟล์ไปยังโฟลเดอร์ uploads
        fs.renameSync(image.filepath, newImagePath);
        imageUrl = `/uploads/${imageFileName}`; // สร้างเส้นทางสำหรับไฟล์
      }

      try {
        const newComment = await prisma.comment.create({
          data: {
            content,
            postId: String(postId), // ตรวจสอบให้แน่ใจว่าเป็น String
            imageUrl, // เพิ่ม imageUrl ที่บันทึกไว้
          },
        });
        res.status(201).json(newComment);
      } catch (error) {
        res.status(500).json({ error: 'Error creating comment' });
      }
    });
  } else if (req.method === 'GET') {
    const { postId } = req.query;

    try {
      const comments = await prisma.comment.findMany({
        where: { postId: String(postId) },
      });
      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching comments' });
    }
  } else if (req.method === 'PUT') { // สำหรับการแก้ไขความคิดเห็น
    const { id, content } = req.body;
    
    try {
      const updatedComment = await prisma.comment.update({
        where: { id: id },
        data: { content: content },
      });
      res.status(200).json(updatedComment);
    } catch (error) {
      res.status(500).json({ error: 'Error updating comment' });
    }
  } else if (req.method === 'DELETE') { // สำหรับการลบความคิดเห็น
    const { id } = req.body;
    
    try {
      await prisma.comment.delete({
        where: { id: id },
      });
      res.status(204).send('Comment deleted successfully');
    } catch (error) {
      res.status(500).json({ error: 'Error deleting comment' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}