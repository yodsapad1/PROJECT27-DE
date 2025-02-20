// pages/api/user_post.js

import { PrismaClient } from "@prisma/client";
import { IncomingForm } from "formidable";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]"; // ตรวจสอบให้แน่ใจว่า path ถูกต้อง

const prisma = new PrismaClient();

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    // เพิ่ม logging เพื่อตรวจสอบ header ของคุกกี้
    console.log("Cookie header:", req.headers.cookie);

    const session = await getServerSession(req, res, authOptions);
    console.log("Session in create post:", session);
    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const loggedInUserId = session.user.id;

    try {
      const form = new IncomingForm();
      const uploadsDir = path.join(process.cwd(), "public/uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Error parsing form data:", err);
          return res.status(500).json({ error: "Error parsing the files." });
        }
        const { title, content } = fields;
        const postTitle = Array.isArray(title) ? title[0] : title;
        const postContent = Array.isArray(content) ? content[0] : content;
        if (!postTitle || !postContent) {
          return res.status(400).json({ message: "Title and content are required." });
        }
        const imagePaths = [];
        if (files.images) {
          const images = Array.isArray(files.images) ? files.images : [files.images];
          for (const image of images) {
            const imageFileName = Date.now() + "-" + image.originalFilename;
            const newImagePath = path.join(uploadsDir, imageFileName);
            try {
              await fs.rename(image.filepath, newImagePath);
              imagePaths.push(`/uploads/${imageFileName}`);
            } catch (fileError) {
              console.error("Error saving image:", fileError);
              return res.status(500).json({ message: "Error saving image.", detail: fileError.message });
            }
          }
        }
        try {
          const newPost = await prisma.post.create({
            data: {
              title: postTitle,
              content: postContent,
              userId: String(loggedInUserId),
              images: imagePaths,
            },
          });
          return res.status(201).json(newPost);
        } catch (dbError) {
          console.error("Error creating post:", dbError);
          return res.status(500).json({ message: "Failed to create post.", detail: dbError.message });
        }
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      return res.status(500).json({ message: "Unexpected error.", detail: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
