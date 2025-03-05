import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
    let { postId } = req.query;
    
    console.log("🔍 Raw Post ID:", postId);

    if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
    }

    // ✅ Trim `postId` เพื่อลบ `%0A`, `\n`, หรือช่องว่างที่ติดมา
    postId = postId.trim();
    console.log("🔍 Cleaned Post ID:", postId);

    try {
        const post = await prisma.post.findFirst({
            where: { id: postId }
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
