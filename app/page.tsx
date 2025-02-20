// app/page.tsx หรือหน้าที่แสดงโพสต์
"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Post from "./components/Post/Post";

interface PostData {
  id: string;
  title: string;
  content: string;
  images: string[];
  userId: string; // ownerId ที่ถูกบันทึกในโพสต์
}

export default function Home() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const { data: session, status } = useSession();

  const fetchPosts = async () => {
    const response = await fetch("/api/posts", {
      credentials: "include",
    });
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

  if (status === "loading") return <p>Loading session...</p>;

  return (
    <div className="flex">
      <Sidebar onNewPost={fetchPosts} />
      <div className="flex flex-col w-full max-w-2xl mx-auto p-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              username={`User ${post.userId}`} // แก้ไขให้แสดงข้อมูลที่เหมาะสมตามความต้องการ
              userImage="/default-profile.png"
              postImage={post.images[0] || "/default-post.jpg"}
              caption={post.content}
              likes={0}
              comments={0}
              ownerId={post.userId}  // ID ของเจ้าของโพสต์ที่บันทึกในฐานข้อมูล
              currentUserId={session?.user?.id || ""} // ดึงจาก session ที่ถูกต้อง
              onDelete={fetchPosts}
            />
          ))
        ) : (
          <p className="text-center text-gray-500">No posts yet.</p>
        )}
      </div>
    </div>
  );
}
