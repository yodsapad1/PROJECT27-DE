"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Profile.module.css";
import Sidebar from "../components/Sidebar/Sidebar";
import { FaCog } from "react-icons/fa";
import CommentModal from "../components/Post/CommentModal";

interface Post {
  id: string;
  title: string;
  content: string;
  images: string[] | null;
  ownerId: string; // ✅ เพิ่ม ownerId
}

interface ProfileData {
  username: string;
  email: string;
  profileImage: string | null;
  posts: Post[];
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/Login");
        return;
      }
      const res = await fetch("/api/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      router.push("/Login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  return (
    <div className={styles.profileContainer}>
      <Sidebar onNewPost={fetchProfile} />

      <div className={styles.profileHeader}>
        <img
          src={user.profileImage || "/assets/default-avatar.jpg"}
          alt="User Avatar"
          className={styles.avatarImage}
        />
        <div className={styles.userInfo}>
          <div className={styles.userTop}>
            <h2>{user.username}</h2>
            <button onClick={() => router.push("/EditProfile")} className={styles.editButton}>
              Edit profile
            </button>
            <FaCog className={styles.settingsIcon} />
          </div>
          <p>{user.email}</p>
          <div className={styles.stats}>
            <span>{user.posts.length} posts</span>
            <span>0 followers</span>
            <span>0 following</span>
          </div>
        </div>
      </div>

      <div className={styles.navbar}>
        <span className={styles.activeTab}>POSTS</span>
        <span>SAVED</span>
        <span>TAGGED</span>
      </div>

      <div className={styles.postsContainer}>
        {user.posts.length > 0 ? (
          user.posts.map((post) => (
            <div
              key={post.id}
              className={styles.postCard}
              onClick={() => setSelectedPost(post)}
            >
              {Array.isArray(post.images) && post.images.length > 0 ? (
                <img src={post.images[0]} alt="Post Image" className={styles.postImage} />
              ) : (
                <p>{post.content}</p>
              )}
            </div>
          ))
        ) : (
          <p className={styles.noPosts}>No posts yet.</p>
        )}
      </div>

      {selectedPost && (
        <CommentModal
          postId={selectedPost.id}
          ownerId={selectedPost.ownerId}  // ✅ ส่ง ownerId ที่ถูกต้อง
          postImage={selectedPost.images?.[0] || "/default-post.jpg"}
          postOwner={user.username}
          title={selectedPost.title}
          content={selectedPost.content}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
