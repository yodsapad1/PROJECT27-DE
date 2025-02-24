import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';

const prisma = new PrismaClient();

// API Handler for deleting a comment
export default async function deleteCommentHandler(req, res) {
    const { query: { id } } = req; // Retrieve comment ID from URL
    console.log("Received a request to delete comment ID:", id);

    if (req.method === 'DELETE') {
        authenticateToken(req, res, async () => {
            const loggedInUserId = req.user.id;

            // Log the token and logged-in user ID
            console.log('Token:', req.headers.authorization); // Log the token
            console.log('Logged In User ID:', loggedInUserId); // Log the User ID

            try {
                const existingComment = await prisma.comment.findUnique({
                    where: { id: Number(id) } // Ensure id is a number
                });

                if (!existingComment) {
                    return res.status(404).json({ message: 'Comment not found.' });
                }

                console.log("Comment Owner ID:", existingComment.userId);

                // Check ownership
                if (existingComment.userId.toString() !== loggedInUserId.toString()) {
                    console.error(`Unauthorized access: User ID: ${loggedInUserId}, Comment Owner ID: ${existingComment.userId}`);
                    return res.status(403).json({ message: 'Forbidden: You are not the owner of this comment.' });
                }

                // Delete the comment
                const deletedComment = await prisma.comment.delete({
                    where: { id: Number(id) }
                });
                console.log("Comment deleted successfully:", deletedComment);

                return res.status(204).end();
            } catch (error) {
                console.error('Error deleting comment:', error);
                return res.status(500).json({ message: 'Failed to delete comment.', detail: error.message });
            }
        });
    } else {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}