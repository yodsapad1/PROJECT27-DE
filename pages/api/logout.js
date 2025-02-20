// pages/api/logout.js

import { comment } from "postcss";

// API handler for logging out
export default async function handler(req, res) {
    if (req.method === 'POST') {
      // Clear their JWT token or session
      // Here is an example of clearing cookies
      res.setHeader('Set-Cookie', 'token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict'); // Clear the cookie by setting Max-Age to 0
  
      // Optionally you can clear any session or other storage if needed  
  
      return res.status(200).json({ message: 'Successfully logged out' });
    } else {
      // If the request method is not POST, return a 405 error
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }


  