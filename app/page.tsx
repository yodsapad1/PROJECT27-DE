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
  userId: string; // Owner ID ที่ถูกบันทึกในโพสต์
  user?: { name: string; image: string }; // เพิ่มข้อมูลเจ้าของโพสต์
}

export default function Home() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/post", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        console.error("Failed to load posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // ✅ เช็ค session ว่ากำลังโหลดอยู่ไหม
  if (status === "loading" || loading) return <p>Loading...</p>;

  // ✅ ฟังก์ชันลบโพสต์ออกจาก state โดยไม่ต้องรีโหลด
  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  return (
    <div className="flex">
      <Sidebar onNewPost={fetchPosts} />
      <div className="flex flex-col w-full max-w-2xl mx-auto p-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              username={post.user?.name || `User ${post.userId}`} // ✅ แสดงชื่อเจ้าของโพสต์
              userImage={post.user?.image || "/default-profile.png"} // ✅ ใช้รูปโปรไฟล์เจ้าของโพสต์
              postImage={post.images[0] || "/default-post.jpg"}
              title={post.title}
              caption={post.content}
              likes={0}
              comments={0}
              ownerId={post.userId} // ID ของเจ้าของโพสต์ที่บันทึกในฐานข้อมูล
              currentUserId={session?.user?.id || ""} // ดึงจาก session ที่ถูกต้อง
              onDelete={() => handlePostDeleted(post.id)} // ✅ อัปเดต UI ทันที
            />
          ))
        ) : (
          <p className="text-center text-gray-500">No posts yet.</p>
        )}
      </div>
    </div>
  );
}
