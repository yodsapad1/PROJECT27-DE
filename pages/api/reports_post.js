// pages/api/reports.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    // ตรวจสอบ method
    if (req.method === 'GET') {
        try {
            // ดึงข้อมูลรายงานทั้งหมด
            const reports = await prisma.report.findMany();

            // ส่งคืนข้อมูลรายงาน
            res.status(200).json(reports);
        } catch (error) {
            // ป้องกันข้อผิดพลาดในกรณีที่ error เป็น null
            console.error("Error fetching reports:", error instanceof Error ? error.message : JSON.stringify(error));
            res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            // ปิดการเชื่อมต่อกับ Prisma
            await prisma.$disconnect();
        }
    } else {
        // ถ้าไม่ใช่ GET ให้ส่งกลับ Method Not Allowed
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}