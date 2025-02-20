import { PrismaClient } from "@prisma/client";
import { IncomingForm } from "formidable";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]"; // ตรวจสอบ path ให้ถูกต้อง

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { query: { id } } = req;
  console.log("Editing post ID:", id);

  if (req.method === "PUT") {
    // ดึง session ของผู้ใช้จาก NextAuth
    const session = await getServerSession(req, res, authOptions);
    console.log("Session in edit post:", session);
    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const loggedInUserId = session.user.id;

    // Parse the incoming form data (including file uploads)
    const form = new IncomingForm();
    try {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Error parsing form data:", err);
          return res.status(500).json({ message: "Error parsing the files." });
        }

        // ดึงข้อมูล title กับ content จาก fields (ไม่รับ userId จาก client)
        const { title, content } = fields;
        const postTitle = Array.isArray(title) ? title[0] : title;
        const postContent = Array.isArray(content) ? content[0] : content;

        if (!postTitle || !postContent) {
          return res.status(400).json({ message: "Title and content are required." });
        }

        // ตรวจสอบว่าโพสต์มีอยู่จริงหรือไม่
        let existingPost;
        try {
          existingPost = await prisma.post.findUnique({ where: { id: String(id) } });
          console.log("Fetched existing post:", existingPost);
        } catch (fetchError) {
          console.error("Database error while fetching post:", fetchError);
          return res.status(500).json({ message: "Database error occurred.", detail: fetchError.message });
        }
        if (!existingPost) {
          return res.status(404).json({ message: "Post not found." });
        }

        // ตรวจสอบสิทธิ์: เฉพาะเจ้าของโพสต์เท่านั้นที่สามารถแก้ไขได้
        if (existingPost.userId.toString() !== loggedInUserId.toString()) {
          console.error("User is not authorized to update this post.");
          return res.status(403).json({ message: "Forbidden: You are not the owner of this post." });
        }

        // ประมวลผลการอัปโหลดไฟล์ภาพ (ถ้ามี)
        const imagePaths = [];
        const uploadsDir = path.join(process.cwd(), "public/uploads");
        await fs.mkdir(uploadsDir, { recursive: true });

        if (files.images) {
          const images = Array.isArray(files.images) ? files.images : [files.images];
          for (const image of images) {
            const imageFileName = Date.now() + "-" + image.originalFilename;
            const newImagePath = path.join(uploadsDir, imageFileName);
            try {
              await fs.rename(image.filepath, newImagePath);
              imagePaths.push(`/uploads/${imageFileName}`);
            } catch (fileError) {
              console.error("Error saving uploaded image:", fileError);
              return res.status(500).json({ message: "Error saving uploaded images." });
            }
          }
        }

        // อัปเดตโพสต์ในฐานข้อมูล
        try {
          const updatedPost = await prisma.post.update({
            where: { id: String(id) },
            data: {
              title: postTitle,
              content: postContent,
              images: imagePaths.length > 0 ? imagePaths : existingPost.images,
            },
          });
          return res.status(200).json(updatedPost);
        } catch (updateError) {
          console.error("Error updating post:", updateError);
          return res.status(500).json({ message: "Failed to update post.", detail: updateError.message });
        }
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      return res.status(500).json({ message: "Unexpected error.", detail: error.message });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
