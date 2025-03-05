import { PrismaClient } from "@prisma/client";
import { IncomingForm } from "formidable";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authMiddleware } from "../auth"; // Ensure the path is correct

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { query: { id } } = req;

  if (req.method === "PUT") {
    const session = await getServerSession(req, res, authMiddleware);
    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized: Please log in." });
    }


    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form data:", err);
        return res.status(500).json({ message: "Error parsing the files." });
      }

      const { title, content, userId } = fields;
      console.log(title, content, userId )

      let str_title = null
      let str_content = null 
      if (title == undefined) {
         str_title = ''
      } else {
         str_title = title[0]
      }

      if (content == undefined) {
         str_content = ''
      } else {
         str_content = content[0]
      }

      const loggedInUserId = userId[0] || ''
      

      if ((!userId)) {
        return res.status(400).json({ message: "need user id plsss." });
      }

      // Fetch the existing post
      let existingPost;
      try {
        existingPost = await prisma.post.findUnique({ where: { id: String(id) } });
        console.log("Existing Post:", existingPost); // Log existing post for checking userId
      } catch (fetchError) {
        console.error("Error fetching post:", fetchError);
        return res.status(500).json({ message: "Database error occurred." });
      }

      // Ensure the post exists
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found." });
      }

      // Check ownership
      console.log("Logged in user ID:", loggedInUserId);
      console.log("Post owner ID:", existingPost.userId.toString());

      if (existingPost.userId.toString() !== loggedInUserId.toString()) {
        console.error("Unauthorized access: User trying to update a post they do not own.");
        return res.status(403).json({ message: "Forbidden: You are not the owner of this post." });
      }

      // Proceed with image handling and post updating...
      const imagePaths = [];
      const uploadsDir = path.join(process.cwd(), "public/uploads");
      await fs.mkdir(uploadsDir, { recursive: true });

      // Handle image uploads if any
      if (files.images) {
        const images = Array.isArray(files.images) ? files.images : [files.images];
        for (const image of images) {
          const imageFileName = `${Date.now()}-${image.originalFilename}`;
          const newImagePath = path.join(uploadsDir, imageFileName);
          
          try {
            await fs.rename(image.filepath, newImagePath); // Move the uploaded file
            imagePaths.push(`/uploads/${imageFileName}`); // Store the path of the new image
          } catch (fileError) {
            console.error("Error saving uploaded image:", fileError);
            return res.status(500).json({ message: "Error saving uploaded images." });
          }
        }
      }

      // Update the post in the database
      try {
        const updatedPost = await prisma.post.update({
          where: { id: String(id) },
          data: {
            title: str_title, // Updated title from form
            content: str_content, // Updated content from form
            images: imagePaths.length > 0 ? imagePaths : existingPost.images, // Use new images if uploaded, or keep existing ones
          },
        });

        // Return the updated post details
        return res.status(200).json({
          _id: updatedPost.id,
          title: updatedPost.str_title,
          content: updatedPost.str_content,
          userId: updatedPost.userId,
          images: updatedPost.images || [],
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt,
        });
      } catch (updateError) {
        console.error("Error updating post:", updateError);
        return res.status(500).json({ message: "Failed to update post.", detail: updateError.message });
      }
    });
  } else {
    // Handle unsupported methods
    res.setHeader("Allow", ["PUT"]); // Indicate allowed methods
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}