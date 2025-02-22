import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// API handler สำหรับการลบความคิดเห็น
export default async function handler(req, res) {
  const { query: { id } } = req; // รับ ID ของความคิดเห็นจาก URL

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body; // รับ userId จาก body

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required in the request body.' });
      }

      // ตรวจสอบว่ามีความคิดเห็นอยู่จริงหรือไม่
      const existingComment = await prisma.comment.findUnique({ where: { id: String(id) } });
      if (!existingComment) {
        return res.status(404).json({ message: 'Comment not found.' });
      }

      // ตรวจสอบว่าเจ้าของความคิดเห็นคือผู้ใช้ที่ส่งคำขอ
      if (existingComment.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You are not the owner of this comment.' });
      }

      // ลบความคิดเห็น
      await prisma.comment.delete({ where: { id: String(id) } });

      // ส่งคืน 204 No Content โดยไม่มีข้อความกลับไป
      return res.status(204).end();

    } catch (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({ message: 'Failed to delete comment.', detail: error.message });
    }
  } else {
    // กำหนดวิธีที่อนุญาต
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}