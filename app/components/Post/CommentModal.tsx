"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./CommentModal.module.css";
import Image from "next/image";

interface Comment {
  id: string;
  userId: string;
  content: string;
  images?: string[];
}

interface CommentModalProps {
  postId: string;
  postImage: string;
  postOwner: string;
  likes: number;
  onClose: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  postId,
  postImage,
  postOwner,
  likes,
  onClose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // โหลดคอมเมนต์จาก API เมื่อเปิด Modal
  useEffect(() => {
    const fetchComments = async () => {
      try {
        console.log(`Fetching comments for postId: ${postId}`);
        const response = await fetch(`/api/user_comment/${postId}`);

        if (!response.ok) {
          if (response.status === 404) {
            console.warn("No comments found.");
            setComments([]);
          } else {
            throw new Error("Failed to fetch comments");
          }
        } else {
          const data = await response.json();
          console.log("Comments loaded:", data);
          setComments(data);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [postId]);

  // เลือกไฟล์รูปภาพ
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
      console.log("Selected image file:", e.target.files[0]);
    }
  };

  // ฟังก์ชันเพิ่มคอมเมนต์ใหม่
  const handleAddComment = async () => {
    if (!newComment.trim() && !selectedImage) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", newComment.trim());
      
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("User not logged in. Please login first.");
        setLoading(false);
        return;
      }
      formData.append("userId", userId);

      if (selectedImage) {
        formData.append("images", selectedImage);
      } else {
        // ส่ง dummy file หากไม่มีไฟล์ที่เลือก (เป็น workaround)
        const dummyBlob = new Blob(["dummy"], { type: "image/jpeg" });
        const dummyFile = new File([dummyBlob], "dummy.jpg", { type: "image/jpeg" });
        formData.append("images", dummyFile);
      }
  
      const response = await fetch(`/api/user_comment/${postId}`, {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        const newCommentData = await response.json();
        console.log("New comment added:", newCommentData);
        setComments((prevComments) => [...prevComments, newCommentData]);
        setNewComment("");
        setSelectedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const errorData = await response.json();
        console.error("Error adding comment:", errorData);
        alert(errorData.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment.");
    }
    setLoading(false);
  };

  // เปิด file input เมื่อกดปุ่มบวก
  const handlePlusClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ฟังก์ชันปิด modal preview รูป
  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <button className={styles.closeButton} onClick={onClose}>✖</button>

          <div className={styles.postContainer}>
            <div className={styles.imageSection}>
              <Image src={postImage} alt="Post Image" width={500} height={600} />
            </div>

            <div className={styles.commentSection}>
              <div className={styles.postOwner}>
                <span className={styles.ownerProfile}>{postOwner}</span>
              </div>

              <div className={styles.commentList}>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className={styles.commentItem}>
                      <strong>User {comment.userId}</strong>: {comment.content}
                      {/* แสดงรูปคอมเมนต์ ถ้า images มีและรูปไม่ใช่ dummy */}
                      {comment.images &&
                        comment.images.length > 0 &&
                        !comment.images[0].toLowerCase().includes("dummy") && (
                          <div
                            className={styles.commentImage}
                            onClick={() => setPreviewImage(comment.images[0])}
                            style={{ cursor: "pointer" }}
                          >
                            <Image
                              src={comment.images[0]}
                              alt="Comment Image"
                              width={200}
                              height={200}
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        )}
                    </div>
                  ))
                ) : (
                  <p className={styles.noComments}>No comments yet.</p>
                )}
              </div>

              <div className={styles.postActions}>
                <span>❤️ {likes} Likes</span>
              </div>

              {selectedImage && (
                <div className={styles.selectedImageName}>
                  Selected: {selectedImage.name}
                </div>
              )}

              <div className={styles.commentInput}>
                <button onClick={handlePlusClick} className={styles.plusButton}>
                  +
                </button>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  disabled={loading}
                  className={styles.textInput}
                />
                <button onClick={handleAddComment} disabled={loading} className={styles.postButton}>
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal สำหรับแสดงรูปขนาดใหญ่เมื่อกดที่รูปในคอมเมนต์ */}
      {previewImage && (
        <div className={styles.previewOverlay} onClick={closePreview}>
          <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closePreviewButton} onClick={closePreview}>✖</button>
            <Image src={previewImage} alt="Preview" width={600} height={600} style={{ objectFit: "contain" }} />
          </div>
        </div>
      )}
    </>
  );
};

export default CommentModal;
