"use client";
import React from "react";
import styles from "./Post.module.css";
import Image from "next/image";

// ปรับ interface ให้รวมข้อมูลเกี่ยวกับโพสต์และการลบโพสต์
interface PostProps {
  id: string;              // ID ของโพสต์ (จาก cuid())
  username: string;        // ชื่อผู้ใช้ที่โพสต์
  userImage: string;       // รูปโปรไฟล์ของผู้ใช้
  postImage: string;       // รูปภาพของโพสต์
  caption: string;         // คำบรรยายโพสต์
  likes: number;           // จำนวนไลค์
  comments: number;        // จำนวนคอมเมนต์
  ownerId: string;         // ID ของเจ้าของโพสต์ (จากฐานข้อมูล)
  currentUserId: string;   // ID ของผู้ใช้ปัจจุบัน (จาก authentication หรือ context)
  onDelete?: () => void;   // Callback เมื่อโพสต์ถูกลบแล้ว (เพื่อรีเฟรชรายการโพสต์)
}

const Post: React.FC<PostProps> = ({
  id,
  username,
  userImage,
  postImage,
  caption,
  likes,
  comments,
  ownerId,
  currentUserId,
  onDelete,
}) => {
  const handleDelete = async () => {
    const confirmed = confirm("คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/user_delete_post/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.status === 204) {
        alert("ลบโพสต์เรียบร้อยแล้ว");
        if (onDelete) onDelete(); // รีเฟรชรายการโพสต์
      } else {
        const data = await response.json();
        alert(data.message || "เกิดข้อผิดพลาดในการลบโพสต์");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("เกิดข้อผิดพลาดในการลบโพสต์");
    }
  };

  return (
    <div className={styles.postContainer}>
      <div className={styles.postHeader}>
        <Image
          src={userImage}
          alt="Profile"
          width={40}
          height={40}
          className={styles.profileImage}
        />
        <span className={styles.username}>{username}</span>
      </div>
      <div className={styles.postImage}>
        {postImage ? (
          <Image
            src={postImage}
            alt="Post"
            width={500}
            height={500}
            className={styles.image}
          />
        ) : (
          <Image
            src="/default-post.jpg"
            alt="Default Post"
            width={500}
            height={500}
          />
        )}
      </div>
      <div className={styles.postActions}>
        <span>❤️ {likes} Likes</span>
        <span>💬 {comments} Comments</span>
      </div>
      <div className={styles.postCaption}>
        <strong>{username}</strong> {caption}
      </div>
      {/* แสดงปุ่มลบโพสต์เฉพาะเมื่อผู้ใช้ปัจจุบันเป็นเจ้าของโพสต์ */}
      {currentUserId === ownerId && (
        <button onClick={handleDelete} className={styles.deleteButton}>
          ลบโพสต์
        </button>
      )}
    </div>
  );
};

export default Post;
