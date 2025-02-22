"use client";
import React, { useState, useEffect } from "react";
import styles from "./Post.module.css";
import Image from "next/image";
import EditPostModal from "./EditPostModal";
import ReportModal from "./ReportModal";

interface PostProps {
  id: string;
  username: string;
  userImage: string;
  postImage: string;
  caption: string;
  likes: number;
  comments: number;
  ownerId: string;
  currentUserId?: string;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // สร้าง state สำหรับเก็บ userId ของผู้ใช้ที่ล็อกอิน
  const [loggedUserId, setLoggedUserId] = useState<string | null>(
    currentUserId || null
  );

  useEffect(() => {
    // หาก currentUserId ยังไม่ถูกส่งเข้ามา ให้ลองดึงจาก localStorage
    if (!currentUserId) {
      const uid = localStorage.getItem("userId");
      if (uid) {
        setLoggedUserId(uid);
      }
    }
  }, [currentUserId]);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/deletePost?postId=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          // ส่ง Authorization header เพื่อให้ API ตรวจสอบสิทธิ์ได้
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });

      if (response.status === 204) {
        alert("Post deleted successfully!");
        if (onDelete) onDelete();
      } else {
        const data = await response.json();
        alert(data.message || "Error deleting post");
      }
    } catch (error: unknown) {
      console.error("Error deleting post:", error);
      alert("Error deleting post");
    }
    setMenuOpen(false);
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
    setMenuOpen(false);
  };

  const handleReport = () => {
    setIsReportModalOpen(true);
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

      {menuOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {loggedUserId === ownerId ? (
              <>
                <button onClick={handleDelete} className={styles.modalButton}>
                  Delete
                </button>
                <button onClick={handleEdit} className={styles.modalButton}>
                  Edit
                </button>
              </>
            ) : (
              <button onClick={handleReport} className={styles.modalButton}>
                Report
              </button>
            )}
            <button
              onClick={() => setMenuOpen(false)}
              className={styles.modalButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <EditPostModal
          postId={id}
          initialCaption={caption}
          initialImage={postImage}
          closeModal={() => setIsEditModalOpen(false)}
          onPostUpdated={onDelete ? onDelete : () => {}}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          postId={id}
          currentUserId={loggedUserId || ""}
          closeModal={() => setIsReportModalOpen(false)}
          onReportSubmitted={() => {
            // Optionally refresh post or show a message
          }}
        />
      )}
    </div>
  );
};

export default Post;
