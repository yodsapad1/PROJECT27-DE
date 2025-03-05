import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY || "RnNVoF4XRf3UwSA8WByFOrzU7DOqVI85Htt5R7J/U4s=";

// Middleware สำหรับตรวจสอบ token
export const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No authorization token provided" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(403).json({ message: "Token is invalid or expired" });
    }
};

// Middleware สำหรับตรวจสอบว่าเป็น Admin
export const adminMiddleware = async (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ message: "Access denied, admin only" });
};

export default async function handler(req, res) {
    let { postId } = req.query;

    if (req.method !== "DELETE") {
        res.setHeader("Allow", ["DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await authMiddleware(req, res, async () => {
        await adminMiddleware(req, res, async () => {
            try {
                if (!postId) {
                    return res.status(400).json({ message: "Post ID is required" });
                }

                // ✅ Trim `postId` เพื่อลบ `%0A`, `\n`, หรือช่องว่างที่ติดมา
                postId = postId.trim();
                console.log(`🔍 Cleaned Post ID: "${postId}"`);

                // ✅ ตรวจสอบว่าโพสต์มีอยู่จริง
                const post = await prisma.post.findFirst({
                    where: { id: postId }
                });

                if (!post) {
                    console.log("⚠️ Post not found:", postId);
                    return res.status(404).json({ message: "Post not found" });
                }

                console.log(`🗑️ Admin is deleting post: ${postId}`);

                // ✅ ลบข้อมูลที่เกี่ยวข้อง
                await prisma.report.deleteMany({ where: { postId: postId } });

                const comments = await prisma.comment.findMany({ where: { postId: postId } });
                const commentIds = comments.map(comment => comment.id);
                if (commentIds.length > 0) {
                    await prisma.reply.deleteMany({ where: { originalCommentId: { in: commentIds } } });
                }

                await prisma.comment.deleteMany({ where: { postId: postId } });

                // ✅ ลบโพสต์
                const deletedPost = await prisma.post.delete({ where: { id: postId } });

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
}
