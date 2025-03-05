"use client";
import React, { useState, useEffect } from "react";
import styles from "./Post.module.css";
import Image from "next/image";
import EditPostModal from "./EditPostModal";
import ReportModal from "./ReportModal";
import CommentModal from "./CommentModal";

interface Comment {
  id: string;
  text: string; // ✅ ต้องมี field นี้
  user: {
    id: string;
    name: string;
    image: string;
  };
}


interface PostProps {
  id: string;
  title: string;
  username: string;
  userImage: string;
  postImages: string[];
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
  postImages,
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  void isLoading; // ทำให้ ESLint ไม่แจ้งเตือน





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

    const token = localStorage.getItem("token");
    console.log("Token being sent:", token);

    if (!token) {
      alert("Authentication required.");
      return;
    }

    setIsLoading(true); // ✅ เริ่มโหลด

    try {
      const response = await fetch(`/api/deletePost?postId=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.status === 204 || response.ok) {
        alert("Post deleted successfully!");
        if (onDelete) onDelete();
        window.location.reload(); // ✅ รีโหลดหน้าใหม่หลังลบโพสต์
      } else {
        const responseData = await response.json();
        console.log("Delete response:", responseData);
        alert(responseData.message || "Error deleting post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    }

    setIsLoading(false); // ✅ หยุดโหลด
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

  const nextImage = () => {
    if (currentImageIndex < postImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
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
        <span className={styles.username}>{username || "Default Name"}</span>
        <div className={styles.menuContainer}>
          <button onClick={toggleMenu} className={styles.menuButton}>⋮</button>
        </div>
      </div>


      <div className={styles.postImage}>
        {postImages && postImages.length > 0 ? (
          <div className={styles.imagePreviewContainer}>
            <div className={styles.imageWrapper}>
              {postImages.length > 1 && (
                <button
                  onClick={prevImage}
                  disabled={currentImageIndex === 0}
                  className={styles.imageNavLeft}
                >
                  &#10094;
                </button>
              )}
              <Image
                src={postImages[currentImageIndex]}
                alt="Post"
                width={500}
                height={500}
                className={styles.image}
              />
              {postImages.length > 1 && (
                <button
                  onClick={nextImage}
                  disabled={currentImageIndex === postImages.length - 1}
                  className={styles.imageNavRight}
                >
                  &#10095;
                </button>
              )}
            </div>
          </div>
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
        <strong>{username || "Default Name"}</strong> {caption}
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
          initialImages={postImages} // ส่ง array ของรูปทั้งหมด
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
          ownerId={ownerId}  
          postImage={postImages[0]}  
          postOwner={username || "Default Name"}
          ownerImage={userImage}
          title={title}  // ✅ เพิ่ม title
          content={caption}  // ✅ เพิ่ม content (ใช้ caption ที่ส่งไป)
          onClose={closeCommentModal}
        />
      )}

    </div>
  );
};

export default Post;
