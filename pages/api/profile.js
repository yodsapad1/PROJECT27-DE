import { PrismaClient } from "@prisma/client";
import multer from "multer";
import fs from "fs";
import path from "path";
import { authenticateToken } from "./auth"; // Middleware ตรวจสอบ Token

const prisma = new PrismaClient();

// 📂 ตั้งค่า Multer สำหรับอัปโหลดรูปภาพ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./public/uploads";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

export const config = {
  api: {
    bodyParser: false, // ❌ ปิด bodyParser เพื่อให้ Multer ใช้แทน
  },
};

export default async function handler(req, res) {
  authenticateToken(req, res, async () => {
    if (req.method === "GET") {
      try {
        const { id } = req.user; // ดึง `id` ของผู้ใช้จาก token

        const userWithPosts = await prisma.user.findUnique({
          where: { id },
          include: { posts: true },
        });

        if (!userWithPosts) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
          username: userWithPosts.name,
          email: userWithPosts.email,
          profileImage: userWithPosts.profileImage || "/uploads/default-avatar.jpg",
          posts: userWithPosts.posts.map((post) => ({
            id: post.id, // ✅ เพิ่ม id ของโพสต์
            ownerId: post.userId, // ✅ เพิ่ม ownerId
            title: post.title,
            content: post.content,
            images: post.images && post.images.length > 0 ? post.images : ["/uploads/default-post.jpg"], // ✅ กำหนดค่าดีฟอลต์ถ้าไม่มีรูป
          })),
        });
      } catch (error) {
        console.error("❌ Error fetching user or posts:", error);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    }

    // ✅ รองรับ `PUT` สำหรับแก้ไขโปรไฟล์
    else if (req.method === "PUT") {
      upload.single("profileImage")(req, res, async (err) => {
        if (err) {
          console.error("❌ Multer error:", err);
          return res.status(400).json({ message: "File upload error." });
        }

        const { id } = req.user;
        const { username } = req.body;

        const updateData = {};
        if (username) updateData.name = username;
        if (req.file) updateData.profileImage = `/uploads/${req.file.filename}`;

        try {
          const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
          });

          return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
          });
        } catch (error) {
          console.error("❌ Error updating profile:", error);
          return res.status(500).json({ message: "Failed to update profile." });
        }
      });
    } else {
      res.setHeader("Allow", ["GET", "PUT"]); // ✅ อนุญาตเฉพาะ GET และ PUT
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  });
}
