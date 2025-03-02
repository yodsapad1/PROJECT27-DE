import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log("Handler called with method:", req.method);

  // Handle GET requests to fetch users
  if (req.method === "GET") {
    try {
      console.log("Attempting to fetch users...");
      const users = await prisma.user.findMany();
      console.log("Retrieved users:", users);

      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No users found." });
      }

      return res.status(200).json(users);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching users:", error);
        return res
          .status(500)
          .json({ message: "Failed to fetch users.", detail: error.message });
      } else {
        console.error("Unexpected error fetching users:", error);
        return res
          .status(500)
          .json({
            message: "Failed to fetch users.",
            detail: "Unexpected error occurred.",
          });
      }
    }
  }

  // Handle POST requests to register a new user
  if (req.method === "POST") {
    console.log("Request Body for POST:", req.body);
    const { name, email, password, role } = req.body; // เพิ่มการดึง role

    if (!name || !email || !password || !role) { // ตรวจสอบว่า role ถูกส่งเข้ามาหรือไม่
      return res
        .status(400)
        .json({ message: "Name, email, password, and role are required." });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email },
      });

      if (existingUser) {
        return res.status(409).json({ message: "Email already registered." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role // เพิ่ม role เข้าไป
        },
      });

      return res.status(201).json({
        message: "User registered successfully!",
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, // ส่งคืน role
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error registering user:", error);
        return res
          .status(500)
          .json({ message: "Failed to register user.", detail: error.message });
      } else {
        console.error("Unexpected error registering user:", error);
        return res
          .status(500)
          .json({
            message: "Failed to register user.",
            detail: "Unexpected error occurred.",
          });
      }
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ message: "Method not allowed." });
}