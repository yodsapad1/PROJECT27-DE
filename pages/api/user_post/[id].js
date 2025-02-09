import { PrismaClient } from "@prisma/client";
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // สำหรับ POST, PUT, DELETE
  },
};

export default async function handler(req, res) {
  const {
    query: { id },
  } = req;

  // รองรับ GET สำหรับดึงโพสต์ตาม ID
  if (req.method === "GET") {
    try {
      const post = await prisma.post.findUnique({
        where: { id: parseInt(id) }, // ใช้ `id` เพื่อค้นหาบทความ
        include: {
          user: {
            select: { id: true, name: true, email: true }, // ข้อมูลของผู้ใช้
          },
        },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      return res.status(200).json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      return res.status(500).json({ message: "Failed to fetch post.", detail: error.message });
    }
  }

  // สำหรับ POST, PUT, DELETE
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "Error parsing the files." });
      }

      // สำหรับ POST และ PUT
      const { title, content, userId } = fields;
      const postTitle = Array.isArray(title) ? title[0] : title;
      const postContent = Array.isArray(content) ? content[0] : content;
      const userID = Array.isArray(userId) ? userId[0] : userId;
      const images = files.images || [];

      if (!postTitle || !postContent || !userID) {
        return res.status(400).json({ message: "Title, content, and userId are required." });
      }

      const imagePaths = [];
      if (Array.isArray(images) && images.length > 0) {
        const uploadsDir = path.join(process.cwd(), "public/uploads");

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        for (const image of images) {
          const imageFileName = Date.now() + "-" + image.originalFilename;
          const newImagePath = path.join(uploadsDir, imageFileName);
          fs.renameSync(image.filepath, newImagePath);
          imagePaths.push(`/uploads/${imageFileName}`);
        }
      }

      try {
        if (req.method === "POST") {
          const newPost = await prisma.post.create({
            data: {
              title: postTitle,
              content: postContent,
              images: imagePaths,
              userId: userID,
            },
          });

          return res.status(201).json(newPost);
        } else if (req.method === "PUT") {
          const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
          if (!post || post.userId !== userID) {
            return res.status(403).json({ error: "Forbidden: You are not the owner of this post" });
          }

          const updatedPost = await prisma.post.update({
            where: { id: parseInt(id) },
            data: { title: postTitle, content: postContent },
          });
          return res.status(200).json(updatedPost);
        } else if (req.method === "DELETE") {
          const { userId } = req.body;
          if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
          }

          const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
          if (!post || post.userId !== userId) {
            return res.status(403).json({ error: "Forbidden: You are not the owner of this post" });
          }

          await prisma.post.delete({ where: { id: parseInt(id) } });
          return res.status(204).send("Post deleted successfully");
        }
      } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ message: "Failed to process request.", detail: error.message });
      }
    });
  } else {
    res.setHeader("Allow", ["POST", "PUT", "DELETE", "GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
