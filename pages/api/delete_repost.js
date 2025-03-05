import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // เพิ่มบรรทัดนี้ที่เริ่มต้นของไฟล์
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY || 'RnNVoF4XRf3UwSA8WByFOrzU7DOqVI85Htt5R7J/U4s=';

// Middleware สำหรับตรวจสอบ token
export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No authorization token provided' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // บันทึกข้อมูลผู้ใช้
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token is invalid or expired' });
    }
};

// Middleware สำหรับตรวจสอบว่าเป็น Admin
export const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next(); // อนุญาตให้ดำเนินการต่อ
    }
    return res.status(403).json({ message: 'Access denied, admin only' });
};

export default async function handler(req, res) {
    const { postId } = req.query; // รับ postId จาก query parameters

    // ตรวจสอบว่าใช้ DELETE method
    if (req.method === 'DELETE') {
        await authMiddleware(req, res, async () => {
            await adminMiddleware(req, res, async () => {
                try {
                    // 1. ลบรายงานทั้งหมดที่เชื่อมโยงกับโพสต์นี้
                    await prisma.report.deleteMany({
                        where: { postId: postId }
                    });

                    // 2. ลบคอมเมนต์ที่เกี่ยวข้องกับโพสต์นี้
                    const comments = await prisma.comment.findMany({
                        where: { postId: postId }
                    });
                    // ลบการตอบกลับที่เกี่ยวข้องกับคอมเมนต์
                    const commentIds = comments.map(comment => comment.id);
                    await prisma.reply.deleteMany({
                        where: { originalCommentId: { in: commentIds } }
                    });

                    // ลบคอมเมนต์
                    await prisma.comment.deleteMany({
                        where: { postId: postId }
                    });

                    // 3. ลบโพสต์
                    const deletedPost = await prisma.post.delete({
                        where: { id: postId },
                    });
                    return res.status(200).json({
                        message: 'Post deleted successfully',
                        post: deletedPost,
                    });
                } catch (error) {
                    console.error('Error deleting post:', error);
                    return res.status(500).json({ message: 'Error deleting post.', detail: error.message });
                }
            });
        });
    } else {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}