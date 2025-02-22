import { PrismaClient } from "@prisma/client";
import { IncomingForm } from "formidable";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authenticateToken } from "../auth";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing for form data
  },
};

export default async function handler(req, res) {
  const { query: { id } } = req; // Extract comment ID from query parameters

  // Handle PUT request for updating a comment
  if (req.method === "PUT") {
    // Retrieve session details to check user authentication
    const session = await getServerSession(req, res, authOptions);
    console.log("Session in edit comment:", session); // Log session for debugging

    // Check if the session exists and user ID is available
    if (!session || !session.user || !session.user.id) {
      console.error("Unauthorized access: No session found or user ID is missing");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const loggedInUserId = session.user.id; // Get the ID of the logged-in user

    // Parse the incoming form data to handle updates
    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form data:", err);
        return res.status(500).json({ message: "Error parsing the form data." });
      }

      const { content } = fields; // Extract the updated content

      // Validate that content is provided
      if (!content || content.trim() === "") {  // Check for empty or whitespace content
        return res.status(400).json({ message: "Content cannot be empty." });
      }

      // Fetch the existing comment from the database
      let existingComment;
      try {
        existingComment = await prisma.comment.findUnique({ where: { id: String(id) } });
      } catch (fetchError) {
        console.error("Error fetching comment:", fetchError);
        return res.status(500).json({ message: "Database error occurred." });
      }

      // Check if the comment exists
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found." });
      }

      // Check if the logged-in user owns the comment
      if (existingComment.userId.toString() !== loggedInUserId.toString()) {
        return res.status(403).json({ message: "Forbidden: You are not the owner of this comment." });
      }

      const imagePaths = [];
      const uploadsDir = path.join(process.cwd(), "public/uploads");

      // Ensure the uploads directory exists
      await fs.mkdir(uploadsDir, { recursive: true });

      // Handle image uploads if provided
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

      // Update the comment in the database
      try {
        const updatedComment = await prisma.comment.update({
          where: { id: String(id) },
          data: {
            content: content, // Updated content from the form
            images: imagePaths.length > 0 ? [...existingComment.images, ...imagePaths] : existingComment.images, // Retain existing images if none uploaded
          },
        });

        // Return the updated comment details
        return res.status(200).json({
          _id: updatedComment.id,
          content: updatedComment.content,
          userId: updatedComment.userId,
          images: updatedComment.images || [],
          createdAt: updatedComment.createdAt,
          updatedAt: updatedComment.updatedAt,
        });
      } catch (updateError) {
        console.error("Error updating comment:", updateError);
        return res.status(500).json({ message: "Failed to update comment.", detail: updateError.message });
      }
    });
  } else {
    // Handle unsupported methods
    res.setHeader("Allow", ["PUT"]); // Indicate allowed methods
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}