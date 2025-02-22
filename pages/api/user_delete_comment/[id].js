import { prisma } from '../../path/to/your/prismaInstance'; // นำเข้าสิ่งที่จำเป็น

// ฟังก์ชันสำหรับลบความคิดเห็น
export default async function deleteCommentHandler(req, res) {
  const { id } = req.query; // ดึง ID ของความคิดเห็นจาก URL
  console.log("Received a request to delete comment ID:", id);

  if (req.method === 'DELETE') {
    if (!id) {
      return res.status(400).json({ message: 'Comment ID is required.' });
    }
    
    try {
      // ลบความคิดเห็นในฐานข้อมูล
      const deletedComment = await prisma.comment.delete({
        where: { id: Number(id) }, // ต้องแน่ใจว่า id เป็น number
      });

      console.log('Comment deleted:', deletedComment);
      return res.status(200).json({ message: 'Comment deleted successfully', deletedComment });
    } catch (error) {
      if (error.code === 'P2025') {
        // ถ้าไม่พบความคิดเห็นที่ต้องการลบ
        return res.status(404).json({ message: 'Comment not found.' });
      }
      console.error('Error deleting comment:', error);
      return res.status(500).json({
        message: 'Error deleting comment.',
        detail: error.message || 'An unknown error occurred',
      });
    }
  } else {
    // กำหนดวิธีที่อนุญาต
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}