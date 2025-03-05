"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Post from "./components/Post/Post";

interface CommentData {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}


interface PostData {
  id: string;
  title: string;
  content: string;
  images: string[];
  userId: string;
  user?: { name: string; image: string };
  comments?: CommentData[]; // ✅ เพิ่ม comments ลงไป
}


export default function Home() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  
  const currentUserId = (session?.user as { id?: string })?.id || "";


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
              username={post.user?.name || `User ${post.userId}`} // ✅ ใช้ชื่อแทน userId
              userImage={post.user?.image || "/default-profile.png"} // ✅ ใช้รูปโปรไฟล์
              postImages={post.images && post.images.length > 0 ? post.images : ["/default-post.jpg"]}
              title={post.title}
              caption={post.content}
              likes={0}
              comments={post.comments
                ? post.comments.map((comment) => ({
                    id: comment.id,
                    text: comment.text, // ✅ เปลี่ยนจาก `content` เป็น `text`
                    user: comment.user || {
                      id: "unknown",
                      name: "Unknown User",
                      image: "/default-profile.png",
                    },
                  }))
                : []} // ✅ แปลงข้อมูลให้ตรงกัน
              ownerId={post.userId}
              currentUserId={currentUserId}
              onDelete={() => handlePostDeleted(post.id)}
            />
          ))
        ) : (
          <p className="text-center text-gray-500">No posts yet.</p>
        )}

      </div>
    </div>
  );
}
