"use client";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Post from "./components/Post/Post";

interface PostData {
  id: number;
  title: string;
  content: string;
  images: string[];
  userId: string;
}

export default function Home() {
  const [posts, setPosts] = useState<PostData[]>([]);

  const fetchPosts = async () => {
    const response = await fetch("/api/user_post"); // ดึงโพสต์ทั้งหมดจาก API
    if (response.ok) {
      const data = await response.json();
      setPosts(data);
    } else {
      console.error("Failed to load posts");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar onNewPost={fetchPosts} />

      {/* Main Feed */}
      <div className="flex flex-col w-full max-w-2xl mx-auto p-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Post
              key={post.id}
              username={`User ${post.userId}`}
              userImage="/default-profile.png"
              postImage={post.images[0] || "/default-post.jpg"}
              caption={post.content}
              likes={0}
              comments={0}
            />
          ))
        ) : (
          <p className="text-center text-gray-500">No posts yet.</p>
        )}
      </div>
    </div>
  );
}
