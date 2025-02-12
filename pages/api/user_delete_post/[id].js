import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// API handler สำหรับการลบโพสต์
export default async function handler(req, res) {
  const { query: { id } } = req; // รับ ID ของโพสต์จาก URL

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body; // รับ userId จาก body

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required in the request body.' });
      }

      // ตรวจสอบว่ามีโพสต์อยู่จริงหรือไม่
      const existingPost = await prisma.post.findUnique({ where: { id: String(id) } });
      if (!existingPost) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      // ตรวจสอบว่าเจ้าของโพสต์คือผู้ใช้ที่ส่งคำขอ
      if (existingPost.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You are not the owner of this post.' });
      }

      // ลบโพสต์
      await prisma.post.delete({ where: { id: String(id) } });
      // ส่งคืน 204 No Content โดยไม่ส่งข้อความกลับไป
      return res.status(204).end();

    } catch (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ message: 'Failed to delete post.', detail: error.message });
    } finally {
      // ถ้าต้องการ disconnect Prisma (ขึ้นอยู่กับการออกแบบโปรเจค)
      // await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
