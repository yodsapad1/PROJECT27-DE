"use client";
import React, { useState } from "react";
import styles from "./Post.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import EditPostModal from "./EditPostModal"; // นำเข้าคอมโพเนนต์ EditPostModal

interface PostProps {
  id: string;
  username: string;
  userImage: string;
  postImage: string;
  caption: string;
  likes: number;
  comments: number;
  ownerId: string;
  currentUserId: string;
  onDelete?: () => void;
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleDelete = async () => {
    const confirmed = confirm("คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/user_delete_post/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.status === 204) {
        alert("ลบโพสต์เรียบร้อยแล้ว");
        if (onDelete) onDelete();
      } else {
        const data = await response.json();
        alert(data.message || "เกิดข้อผิดพลาดในการลบโพสต์");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("เกิดข้อผิดพลาดในการลบโพสต์");
    }
    setMenuOpen(false);
  };

  const handleEdit = () => {
    // เปิด modal แก้ไขโพสต์
    setIsEditModalOpen(true);
    setMenuOpen(false);
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
        <div className={styles.menuContainer}>
          <button onClick={toggleMenu} className={styles.menuButton}>
            ⋮
          </button>
          
        </div>
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

      {/* แสดง Edit Modal เมื่อเปิด */}
      {isEditModalOpen && (
        <EditPostModal
          postId={id}
          initialCaption={caption}
          initialImage={postImage}
          closeModal={() => setIsEditModalOpen(false)}
          onPostUpdated={onDelete ? onDelete : () => {}}
        />
      )}

      {menuOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {currentUserId === ownerId && (
              <>
                <button onClick={handleDelete} className={styles.modalButton}>
                  Delete
                </button>
                <button onClick={handleEdit} className={styles.modalButton}>
                  Edit
                </button>
              </>
            )}
            <button onClick={() => setMenuOpen(false)} className={styles.modalButton}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {currentUserId === ownerId && (
              <>
                <button onClick={handleDelete} className={styles.modalButton}>
                  Delete
                </button>
                <button onClick={handleEdit} className={styles.modalButton}>
                  Edit
                </button>
              </>
            )}
            <button onClick={() => setMenuOpen(false)} className={styles.modalButton}>
              Cancel
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default Post;
