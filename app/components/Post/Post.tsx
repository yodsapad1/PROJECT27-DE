"use client";
import React, { useState, useEffect } from "react";
import styles from "./Post.module.css";
import Image from "next/image";
import EditPostModal from "./EditPostModal";
import ReportModal from "./ReportModal";
import CommentModal from "./CommentModal";

interface Comment {
  id: string;
  user: string;
  text: string;
}

interface PostProps {
  id: string;
  title: string;
  username: string;
  userImage: string;
  postImage: string;
  caption: string;
  likes: number;
  comments: Comment[];
  ownerId: string;
  currentUserId?: string;
  onDelete?: () => void;
}

const decodeToken = (token: string) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const Post: React.FC<PostProps> = ({
  id,
  title,
  username,
  userImage,
  postImage,
  caption,
  likes,
  comments = [],
  ownerId,
  currentUserId,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [loggedUserId, setLoggedUserId] = useState<string | null>(currentUserId || null);

  useEffect(() => {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = decodeToken(token);
        if (decoded && decoded.id) {
          userId = decoded.id;
          console.log("Decoded Logged User ID from token:", userId);
        }
      }
    }
    setLoggedUserId(userId || currentUserId || null);
    console.log("Logged User ID:", userId || currentUserId || null);
    console.log("Owner ID:", ownerId);
  }, [currentUserId, ownerId]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const openCommentModal = () => setIsCommentModalOpen(true);
  const closeCommentModal = () => setIsCommentModalOpen(false);

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    let token = localStorage.getItem("token");
    console.log("Token being sent:", token);

    if (!token) {
      alert("Authentication required.");
      return;
    }

    try {
      const response = await fetch(`/api/deletePost?postId=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.status === 204) {
        alert("Post deleted successfully!");
        if (onDelete) onDelete();
      } else {
        const responseData = await response.json();
        console.log("Delete response:", responseData);
        alert(responseData.message || "Error deleting post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    }

    setMenuOpen(false);
  };

  // เพิ่ม handleEdit เพื่อเปิด EditPostModal
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
        <button onClick={openCommentModal} className={styles.commentButton}>
          💬 {comments?.length || 0} Comments
        </button>
      </div>

      <div className={styles.postTitle}>
        <h2>{title}</h2>
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
            <button onClick={() => setMenuOpen(false)} className={styles.modalButton}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <EditPostModal
          postId={id}
          initialTitle={title}
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
          onReportSubmitted={() => {}}
        />
      )}

      {isCommentModalOpen && (
        <CommentModal
          postId={id}
          postImage={postImage}
          postOwner={username}
          comments={comments || []}
          likes={likes}
          onClose={closeCommentModal}
        />
      )}
    </div>
  );
};

export default Post;
