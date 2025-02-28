import { PrismaClient } from '@prisma/client';
import multer from 'multer'; 
import fs from 'fs';
import { authenticateToken } from './auth'; 

const prisma = new PrismaClient();

// กำหนดการตั้งค่าของ multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads'; // โฟลเดอร์สำหรับเก็บภาพ
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir); // สร้างโฟลเดอร์ถ้ายังไม่มี
        }
        cb(null, dir); 
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

export default async function handler(req, res) {
    authenticateToken(req, res, async () => {
        if (req.method === 'GET') {
            try {
                const { id } = req.user; 

                const userWithPosts = await prisma.user.findUnique({
                    where: { id },
                    include: { posts: true },
                });

                if (!userWithPosts) {
                    return res.status(404).json({ message: 'User not found' });
                }

                return res.status(200).json({
                    username: userWithPosts.name,
                    email: userWithPosts.email,
                    profileImage: userWithPosts.profileImage || null,
                    posts: userWithPosts.posts.length > 0 ? userWithPosts.posts.map(post => ({
                        title: post.title,
                        content: post.content,
                        images: post.images.length > 0 ? post.images : null,
                    })) : [],
                });
            } catch (error) {
                console.error('Error fetching user or posts:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        } else if (req.method === 'POST') {
            upload.single('profileImage')(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ message: err.message });
                }

                const { id } = req.user; 
                const profileImage = req.file.path; 

                try {
                    const updatedUser = await prisma.user.update({
                        where: { id },
                        data: {
                            profileImage, // อัปเดตฟิลด์นี้ในฐานข้อมูล
                        },
                    });

                    return res.status(200).json({
                        message: 'Profile image updated successfully',
                        user: updatedUser,
                    });
                } catch (error) {
                    console.error('Error updating user profile image:', error);
                    return res.status(500).json({ message: 'Internal Server Error' });
                }
            });
        } else if (req.method === 'PUT') {
            const { username, profileImage } = req.body; // รับชื่อผู้ใช้และภาพโปรไฟล์ใหม่จาก body
            
            try {
                const { id } = req.user;

                const updatedData = {}; // สร้างอ็อบเจ็กต์สำหรับการอัปเดต

                // ตรวจสอบและอัปเดตชื่อผู้ใช้ ถ้ามีการส่งชื่อผู้ใช้ใหม่เข้ามา
                if (username) {
                    updatedData.name = username; // ตั้งชื่อผู้ใช้ใหม่
                }

                // ตรวจสอบและอัปเดตรูปภาพโปรไฟล์ ถ้ามีการส่งรูปภาพใหม่เข้ามา
                if (profileImage) {
                    updatedData.profileImage = profileImage; // ตั้งค่าภาพโปรไฟล์ใหม่
                }

                // อัปเดตข้อมูลผู้ใช้
                const updatedUser = await prisma.user.update({
                    where: { id },
                    data: updatedData,
                });

                return res.status(200).json({
                    message: 'User updated successfully',
                    user: updatedUser,
                });
            } catch (error) {
                console.error('Error updating user profile image:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        } else {
            res.setHeader('Allow', ['GET', 'POST', 'PUT']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    });
}