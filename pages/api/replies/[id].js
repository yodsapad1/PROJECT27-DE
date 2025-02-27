import { PrismaClient } from '@prisma/client';
import { IncomingForm } from 'formidable'; // นำเข้า IncomingForm อย่างถูกต้อง
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // ปิด bodyParser เพราะใช้ formidable
  },
};

export default async function handler(req, res) {
  const { originalCommentId } = req.query; // ดึง ID ของคอมเมนต์ที่กำลังตรวจสอบ
  console.log("Received a request for original comment ID:", originalCommentId);

  if (req.method === 'POST') {
    const form = new IncomingForm(); // ใช้ IncomingForm ที่นำเข้า

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ message: 'Error parsing form data.' });
      }

      console.log('Received data:', fields);
      console.log('Uploaded files:', files);

      const { content, userId, originalCommentId } = fields; 
      const images = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
      const imageUrls = [];
      const uploadsDir = path.join(process.cwd(), 'public/uploads');

      // สร้างโฟลเดอร์สำหรับจัดเก็บภาพถ้ายังไม่มี
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // เก็บ URL ของภาพที่อัปโหลด
      for (const image of images) {
        const imageFileType = image.mimetype.split('/')[0];
        if (imageFileType !== 'image') {
          return res.status(400).json({ message: 'Only image files are allowed.' });
        }

        const imageFileName = `${Date.now()}-${image.originalFilename}`;
        const newImagePath = path.join(uploadsDir, imageFileName);

        // ย้ายไฟล์ไปยังโฟลเดอร์ที่กำหนด
        try {
          fs.renameSync(image.filepath, newImagePath);
          imageUrls.push(`/uploads/${imageFileName}`);
          console.log(`Image saved: ${newImagePath}`);
        } catch (fileError) {
          console.error('Error saving uploaded image:', fileError);
          return res.status(500).json({ message: 'Error saving uploaded images.' });
        }
      }

      // เตรียมข้อมูลสำหรับการสร้างการตอบกลับ
      const newReplyData = {
        content: content || '',
        originalCommentId: originalCommentId, // ID ของคอมเมนต์ที่กำลังตอบกลับ
        userId: userId || '',
        images: imageUrls.length > 0 ? imageUrls : [],
      };

      // ตรวจสอบว่ามี userId และ originalCommentId หรือไม่
      if (!newReplyData.userId || !newReplyData.originalCommentId) {
        console.log('Received data:', newReplyData); // ตรวจสอบค่าที่ใช้งาน
        return res.status(400).json({ 
          message: 'Missing userId or originalCommentId', 
          userId: newReplyData.userId, 
          originalCommentId: newReplyData.originalCommentId 
        });
      }

      // สร้างการตอบกลับคอมเมนต์ใหม่ในฐานข้อมูล
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
    // ดึงการตอบกลับทั้งหมดที่เกี่ยวข้องกับ originalCommentId
    try {
      const replies = await prisma.reply.findMany({
        where: { originalCommentId: originalCommentId },
      });

      if (replies.length > 0) {
        console.log('Retrieved replies:', replies);
        return res.status(200).json(replies);
      } else {
        console.log('No replies found for original comment ID:', originalCommentId);
        return res.status(404).json({ message: 'Replies not found' });
      }
    } catch (error) {
      console.error('Error retrieving replies:', error);
      return res.status(500).json({ message: 'Error retrieving replies.' });
    }
  } else if (req.method === 'DELETE') {
    const { userId } = req.query; // ดึง userId จาก query string

    try {
      // ค้นหาการตอบกลับที่ต้องการลบ
      const reply = await prisma.reply.findUnique({
        where: { id: originalCommentId }, // ใช้ originalCommentId เป็น ID
      });

      if (!reply) {
        return res.status(404).json({ message: 'Reply not found' });
      }

      // ตรวจสอบว่า userId ที่ส่งมาคือเจ้าของการตอบกลับหรือไม่
      if (reply.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to delete this reply.' });
      }

      // ทำการลบการตอบกลับ
      await prisma.reply.delete({
        where: { id: originalCommentId }, // ใช้ originalCommentId ในการลบ
      });

      console.log('Deleted reply:', originalCommentId);
      return res.status(200).json({ message: 'Reply deleted successfully' });
    } catch (error) {
      console.error('Error deleting reply:', error);
      return res.status(500).json({ message: 'Error deleting reply.' });
    }
  } else {
    // กำหนดวิธีที่อนุญาต
    res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}