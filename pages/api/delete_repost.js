import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY || "RnNVoF4XRf3UwSA8WByFOrzU7DOqVI85Htt5R7J/U4s=";

// Middleware สำหรับตรวจสอบ token
export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No authorization token provided" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // บันทึกข้อมูลผู้ใช้
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(403).json({ message: "Token is invalid or expired" });
    }
};

// Middleware สำหรับตรวจสอบว่าเป็น Admin
export const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ message: "Access denied, admin only" });
};

export default async function handler(req, res) {
    const { postId } = req.query;

    if (req.method === "DELETE") {
        await authMiddleware(req, res, async () => {
            await adminMiddleware(req, res, async () => {
                try {
                    if (!postId) {
                        return res.status(400).json({ message: "Post ID is required" });
                    }

                    console.log(`🗑️ Admin is deleting post: ${postId}`);

                    // ✅ 1. ลบรายงาน (Reports) ที่เกี่ยวข้องกับโพสต์นี้
                    await prisma.report.deleteMany({
                        where: { postId: postId }
                    });

                    // ✅ 2. ค้นหาคอมเมนต์ที่เกี่ยวข้องกับโพสต์นี้
                    const comments = await prisma.comment.findMany({
                        where: { postId: postId }
                    });

                    // ✅ 3. ลบการตอบกลับ (Replies) ที่เกี่ยวข้องกับคอมเมนต์
                    const commentIds = comments.map(comment => comment.id);
                    await prisma.reply.deleteMany({
                        where: { originalCommentId: { in: commentIds } }
                    });

                    // ✅ 4. ลบคอมเมนต์ที่เกี่ยวข้องกับโพสต์นี้
                    await prisma.comment.deleteMany({
                        where: { postId: postId }
                    });

                    // ✅ 5. ลบโพสต์ออกจากฐานข้อมูล
                    const deletedPost = await prisma.post.delete({
                        where: { id: postId },
                    });

                    console.log(`✅ Post deleted successfully: ${postId}`);
                    return res.status(200).json({
                        message: "Post deleted successfully",
                        post: deletedPost,
                    });

                } catch (error) {
                    console.error("❌ Error deleting post:", error);
                    return res.status(500).json({ message: "Error deleting post.", detail: error.message });
                }
            });
        });
    } else {
        res.setHeader("Allow", ["DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
