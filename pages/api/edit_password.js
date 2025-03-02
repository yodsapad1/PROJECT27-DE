import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import nodemailer from 'nodemailer'; // นำเข้า nodemailer
import dotenv from 'dotenv'; // นำเข้า dotenv

dotenv.config(); // โหลดค่าจากไฟล์ .env

const prisma = new PrismaClient();

// ฟังก์ชันสำหรับส่งอีเมล
const sendEmail = async (toEmail, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // หรือบริการอีเมลที่คุณใช้
        auth: {
            user: process.env.EMAIL, // อีเมลของคุณ
            pass: process.env.EMAIL_PASSWORD, // รหัสผ่านของคุณ
        },
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: toEmail,
        subject: subject,
        text: text,
    };

    await transporter.sendMail(mailOptions);
};

// API Handler
export default async function handler(req, res) {
    console.log("Handler called with method:", req.method);

    // Handle POST request to send reset password email
    if (req.method === 'POST') {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const resetToken = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
            const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
            await sendEmail(email, 'Reset Your Password', `Click this link to reset your password: ${resetLink}`);

            return res.status(200).json({ message: 'ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว.' });
        } catch (error) {
            console.error('Error sending reset password email:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    if (req.method === 'PUT') {
        const { token, newPassword } = req.body; 
    
        if (!token || !newPassword) {
            console.log("❌ Missing token or new password");
            return res.status(400).json({ message: 'Token and new password are required.' });
        }
    
        try {
            console.log("🔍 Token received:", token);
            const decoded = jwt.verify(token, process.env.SECRET_KEY); 
            console.log("✅ Token decoded:", decoded);
    
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { email: true }
            });
    
            if (!user || !user.email) {
                console.log("❌ User not found in database");
                return res.status(404).json({ message: 'User not found or email missing.' });
            }
    
            console.log("✅ Found user:", user);
    
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
            await prisma.user.update({
                where: { id: decoded.id },
                data: { password: hashedNewPassword },
            });
    
            console.log("✅ Password updated successfully");
    
            await sendEmail(
                user.email, 
                'Your Password Has Been Changed', 
                'Your password has been updated successfully.'
            );
    
            console.log("✅ Confirmation email sent");
    
            return res.status(200).json({ message: 'อัปเดตรหัสผ่านเรียบร้อยแล้ว ส่งอีเมลยืนยันแล้ว.' });
        } catch (error) {
            console.error("❌ Error updating password:", error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
    

    // Handle unsupported methods
    return res.status(405).json({ message: "Method not allowed." });
}
