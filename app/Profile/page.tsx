"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./Profile.module.css";
import Sidebar from "../components/Sidebar/Sidebar";
import { FaCog } from "react-icons/fa";
import CommentModal from "../components/Post/CommentModal";
import Image from "next/image";

interface Post {
  id: string;
  title: string;
  content: string;
  images: string[] | null;
  ownerId: string;
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

  const fetchProfile = useCallback(async () => {
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
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  return (
    <div className={styles.profileContainer}>
      <Sidebar onNewPost={() => setLoading(true)} />

      <div className={styles.profileHeader}>
        <Image
          src={user.profileImage || "/assets/default-avatar.jpg"}
          alt="User Avatar"
          width={50} // ระบุ width
          height={50} // ระบุ height
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
              {post.images?.length ? (
                <Image
                src={post.images[0]}
                alt="Post Image"
                width={500}
                height={300}
                className={styles.postImage}
              />
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
          ownerId={selectedPost.ownerId}
          postImage={selectedPost.images?.[0] || "/default-post.jpg"}
          postOwner={user.username}
          ownerImage={user.profileImage || "/assets/default-avatar.jpg"} // ✅ เพิ่ม ownerImage
          title={selectedPost.title}
          content={selectedPost.content}
          onClose={() => setSelectedPost(null)}
          onDelete={async () => {
            setSelectedPost(null);
            setLoading(true);
            await fetchProfile();
          }}
        />
      )}
    </div>
  );
}
