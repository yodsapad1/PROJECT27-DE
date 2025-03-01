import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const posts = await prisma.post.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                        },
                    },
                },
            });

            // ตรวจสอบว่ามี images และ user หรือไม่
            const formattedPosts = posts.map(post => ({
                id: post.id,
                title: post.title,
                content: post.content,
                images: Array.isArray(post.images) ? post.images : [],
                userId: post.user ? post.user.id : "unknown",
                user: post.user ? { 
                    name: post.user.name, 
                    image: post.user.profileImage || "/default-profile.png"
                } : { 
                    name: "Unknown User",
                    image: "/default-profile.png"
                }
            }));

            res.status(200).json(formattedPosts);
        } catch (error) {
            console.error("❌ Error fetching posts:", error);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        } finally {
            await prisma.$disconnect();
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
