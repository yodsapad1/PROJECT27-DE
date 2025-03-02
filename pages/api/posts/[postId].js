import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { postId } = req.query;
    console.log("🔍 Fetching post with ID:", postId); // ✅ Debug Log

    if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId }, // ถ้าไม่ได้ให้ลองเปลี่ยนเป็น `_id: postId`
        });

        if (!post) {
            console.log("⚠️ Post not found:", postId);
            return res.status(404).json({ message: "Post not found" });
        }

        console.log("✅ Post found:", post);
        return res.status(200).json(post);
    } catch (error) {
        console.error("❌ Error fetching post:", error);
        return res.status(500).json({ message: "Failed to fetch post" });
    }
}
