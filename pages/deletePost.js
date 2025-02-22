import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './api/auth';

const prisma = new PrismaClient();

// API Handler for deleting a post and its associated comments
export default async function handler(req, res) {
    const { query: { postId } } = req; // Retrieve post ID from query parameters

    if (req.method === 'DELETE') {
        authenticateToken(req, res, async () => {
            const loggedInUserId = req.user.id;

            try {
                const existingPost = await prisma.post.findUnique({
                    where: { id: String(postId) }
                });

                if (!existingPost) {
                    return res.status(404).json({ message: 'Post not found.' });
                }

                console.log("Post Owner ID:", existingPost.userId);

                // Check ownership
                if (existingPost.userId.toString() !== loggedInUserId.toString()) {
                    console.error(`Unauthorized access: User ID: ${loggedInUserId}, Post Owner ID: ${existingPost.userId}`);
                    return res.status(403).json({ message: 'Forbidden: You are not the owner of this post.' });
                }

                // Delete associated comments
                await prisma.comment.deleteMany({ where: { postId: String(postId) } });
                console.log("Deleted associated comments.");

                // Delete the post
                await prisma.post.delete({ where: { id: String(postId) } });
                console.log("Post deleted successfully.");

                return res.status(204).end();
            } catch (error) {
                console.error('Error deleting post:', error);
                return res.status(500).json({ message: 'Failed to delete post.', detail: error.message });
            }
        });
    } else {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}