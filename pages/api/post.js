// pages/api/posts.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {
        // ดึงข้อมูลโพสต์ทั้งหมด
        const posts = await prisma.post.findMany();

        // ส่งคืนข้อมูลโพสต์
        res.status(200).json(posts);
    } catch (error) {
        // ป้องกันข้อผิดพลาดในกรณีที่ error เป็น null
        console.error("Error fetching posts:", error instanceof Error ? error.message : JSON.stringify(error));
        res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
        // ปิดการเชื่อมต่อกับ Prisma
        await prisma.$disconnect();
    }
}