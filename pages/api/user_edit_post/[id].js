import { PrismaClient } from '@prisma/client';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

// API handler สำหรับการแก้ไขโพสต์
export default async function handler(req, res) {
  const { query: { id } } = req; // รับ ID ของโพสต์จาก query
  console.log('Incoming request for post ID:', id);

  if (req.method === 'PUT') {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ message: 'Error parsing the files.' });
      }

      const { title, content, userId } = fields;

      // Validate input fields
      if (!title || !content || !userId) {
        return res.status(400).json({ message: 'Title, content, and userId are required.' });
      }

      const postTitle = Array.isArray(title) ? title[0] : title;
      const postContent = Array.isArray(content) ? content[0] : content;

      // Check if post exists
      let existingPost;
      try {
        existingPost = await prisma.post.findUnique({ where: { id } });
        console.log('Fetched existing post:', existingPost);
      } catch (dbError) {
        console.error('Database error while fetching post:', dbError);
        return res.status(500).json({ message: 'Database error occurred.', detail: dbError.message });
      }

      if (!existingPost) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      // Log user IDs for comparison
      console.log('Request userId:', userId);
      console.log('Post owner userId:', existingPost.userId);

      // Check if the requester is the post owner
      if (existingPost.userId.toString() !== userId.toString()) {
        console.error('User is not authorized to update this post.');
        return res.status(403).json({ message: 'Forbidden: You are not the owner of this post.' });
      }

      // Handle images
      const images = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
      const imagePaths = [];
      const uploadsDir = path.join(process.cwd(), 'public/uploads');

      // Create the uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Process new images
      if (images.length > 0) {
        for (const image of images) {
          const imageFileName = Date.now() + '-' + image.originalFilename;
          const newImagePath = path.join(uploadsDir, imageFileName);
          try {
            fs.renameSync(image.filepath, newImagePath); // Move the uploaded file
            imagePaths.push(`/uploads/${imageFileName}`); // Store the path of the image
          } catch (fileError) {
            console.error('Error saving uploaded image:', fileError);
            return res.status(500).json({ message: 'Error saving uploaded images.' });
          }
        }
      }

      // Update post in the database
      try {
        const updatedPost = await prisma.post.update({
          where: { id },
          data: {
            title: postTitle,
            content: postContent,
            images: imagePaths.length > 0 ? imagePaths : existingPost.images, // Use new image paths or keep existing images
          },
        });
        
        return res.status(200).json(updatedPost); // Respond with the updated post
      } catch (updateError) {
        console.error('Error updating post:', updateError);
        return res.status(500).json({ message: 'Failed to update post.', detail: updateError.message });
      }
    });
  } else {
    // If the request method is not PUT
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}