import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer'; 
import bcrypt from 'bcrypt'; 

const prisma = new PrismaClient();

// ฟังก์ชันสำหรับส่งอีเมลรีเซ็ตรหัสผ่าน
const sendResetPasswordEmail = async (email) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // หรือบริการอื่น ๆ ที่คุณใช้
        auth: {
            user: process.env.EMAIL, // อีเมลของคุณ
            pass: process.env.EMAIL_PASSWORD, // รหัสผ่านของคุณ
        },
    });

    const resetLink = `http://localhost:3000/reset-password`; // ลิงก์ที่ถูกต้องสำหรับรีเซ็ตรหัสผ่าน

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Reset Your Password',
        text: `Click this link to reset your password: ${resetLink}`,
        html: `<p>Click this link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    };

    await transporter.sendMail(mailOptions);
};

// API Handler
export default async function handler(req, res) {
    if (req.method === 'POST') { // สำหรับการส่งอีเมลรีเซ็ตรหัสผ่าน
        const { email } = req.body; // รับอีเมลจาก body

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        try {
            // ตรวจสอบว่าผู้ใช้มีอยู่ในฐานข้อมูลหรือไม่
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // ส่งอีเมลที่มีลิงก์สำหรับรีเซ็ตรหัสผ่าน
            await sendResetPasswordEmail(email);

            return res.status(200).json({ message: 'Reset password email has been sent.' });
        } catch (error) {
            console.error('Error sending reset password email:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    } else if (req.method === 'PUT') { // สำหรับการเปลี่ยนรหัสผ่าน
        const { email, oldPassword, newPassword } = req.body; // รับข้อมูลจาก body

        if (!email || !oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Email, old password, and new password are required' });
        }

        try {
            // ค้นหาผู้ใช้ตามอีเมล
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // ตรวจสอบรหัสผ่านเก่าว่าตรงกันไหม
            const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isOldPasswordValid) {
                return res.status(401).json({ message: 'Old password is incorrect' });
            }

            // เข้ารหัสรหัสผ่านใหม่
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // อัปเดตรหัสผ่านในฐานข้อมูล
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedNewPassword, // อัปเดตรหัสผ่านใหม่
                },
            });

            // ส่งอีเมลยืนยันการเปลี่ยนรหัสผ่าน
            await sendResetPasswordEmail(email);  // ส่งอีเมลยืนยันหลังจากอัปเดตรหัสผ่าน

            return res.status(200).json({
                message: 'Password updated successfully. A confirmation email has been sent.',
            });
        } catch (error) {
            console.error('Error updating password:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['POST', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`); // ส่งกลับสถานะ 405 ถ้าคำขอไม่ใช่วิธี ที่อนุญาต
    }
}