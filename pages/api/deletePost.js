import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { query: { postId } } = req;

    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    if (!postId) {
        return res.status(400).json({ message: 'Invalid request: postId is required' });
    }

    authMiddleware(req, res, async () => {
        const loggedInUserId = req.user.id;
        console.log('Token:', req.headers.authorization);
        console.log('Logged In User ID:', loggedInUserId);

        try {
            const existingPost = await prisma.post.findUnique({
                where: { id: String(postId) },
                include: {
                    comments: { select: { id: true, replies: { select: { id: true } } } }
                }
            });

            if (!existingPost) {
                return res.status(404).json({ message: 'Post not found.' });
            }

            if (String(existingPost.userId) !== String(loggedInUserId)) {
                console.error(`Unauthorized access: User ID: ${loggedInUserId}, Post Owner ID: ${existingPost.userId}`);
                return res.status(403).json({ message: 'Forbidden: You are not the owner of this post.' });
            }

            await prisma.$transaction(async (tx) => {
                // ลบ Replies
                const commentIds = existingPost.comments.map(comment => comment.id);
                if (commentIds.length > 0) {
                    await tx.reply.deleteMany({
                        where: { originalCommentId: { in: commentIds } },
                    });
                }

                // ลบ Comments
                await tx.comment.deleteMany({
                    where: { postId: String(postId) },
                });

                // ลบโพสต์
                await tx.post.delete({ where: { id: String(postId) } });
            });

            console.log("✅ Post deleted successfully.");
            return res.status(200).json({ message: "Post deleted successfully" });

        } catch (error) {
            console.error('❌ Error deleting post:', error);
            return res.status(500).json({ message: 'Failed to delete post.', detail: error.message });
        }
    });
}
