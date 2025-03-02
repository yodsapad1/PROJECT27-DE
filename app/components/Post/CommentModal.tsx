"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./CommentModal.module.css";
import Image from "next/image";
import EditPostModal from "./EditPostModal";


interface Comment {
  id: string;
  userId: string;
  content: string;
  images?: string[];
}

interface Reply {
  id: string;
  userId: string;
  content: string;
  images?: string[];
  createdAt: string;
}

interface CommentModalProps {
  postId: string;
  ownerId: string;
  postImage: string;
  postOwner: string;
  title: string;  // ✅ เพิ่ม title
  content: string; // ✅ เพิ่ม content
  onClose: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  postId,
  ownerId,
  postImage,
  postOwner,
  title,   // ✅ รับค่า title
  content, // ✅ รับค่า content
  onClose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  // replyTargetCommentId: ถ้ามีค่านี้ แปลว่าเราอยู่ในโหมดตอบกลับ (reply) ให้ใช้ช่อง input คอมเมนต์หลักสำหรับตอบกลับคอมเมนต์ที่มี id นี้
  const [replyTargetCommentId, setReplyTargetCommentId] = useState<string | null>(null);
  // repliesMap เก็บรายการ reply ของแต่ละคอมเมนต์ (key = comment id)
  const [repliesMap, setRepliesMap] = useState<{ [key: string]: Reply[] }>({});
  const [expandedReplies, setExpandedReplies] = useState<{ [key: string]: boolean }>({});
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedUserId, setLoggedUserId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);




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

  useEffect(() => {
    // ปิดการเลื่อนพื้นหลังเมื่อเปิดโมเดล
    document.body.style.overflow = "hidden";
  
    // ปิดการโต้ตอบพื้นหลัง (แต่โมเดลยังใช้งานได้)
    document.getElementById("modalOverlay")?.classList.add("modal-active");
  
    return () => {
      document.body.style.overflow = "auto";
      document.getElementById("modalOverlay")?.classList.remove("modal-active");
    };
  }, []);

  useEffect(() => {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = decodeToken(token);
        if (decoded && decoded.id) {
          userId = decoded.id;
        }
      }
    }
    setLoggedUserId(userId);

      console.log("🔹 loggedUserId:", userId);
  console.log("🔹 ownerId:", ownerId);
  }, []);
  

  // เลือกไฟล์รูปภาพ
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
      console.log("Selected image file:", e.target.files[0]);
    }
  };

  // ฟังก์ชันเพิ่มคอมเมนต์หรือ reply
  const handleAddComment = async () => {
    // หากไม่มีข้อความและไม่มีไฟล์ที่เลือก ให้ return
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
        // ส่ง dummy file หากไม่ได้เลือกไฟล์ (workaround)
        const dummyBlob = new Blob(["dummy"], { type: "image/jpeg" });
        const dummyFile = new File([dummyBlob], "dummy.jpg", { type: "image/jpeg" });
        formData.append("images", dummyFile);
      }
      if (replyTargetCommentId) {
        // โหมดตอบกลับ (reply) ให้ส่งไปที่ API replies
        const response = await fetch(`/api/replies/${replyTargetCommentId}`, {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const newReply = await response.json();
          console.log("New reply added:", newReply);
          setRepliesMap((prev) => ({
            ...prev,
            [replyTargetCommentId]: prev[replyTargetCommentId]
              ? [...prev[replyTargetCommentId], newReply]
              : [newReply],
          }));
          // ตั้ง expandedReplies ให้แสดง replies ของ comment นี้
          setExpandedReplies((prev) => ({ ...prev, [replyTargetCommentId]: true }));
          setReplyTargetCommentId(null);
          setNewComment("");
          setSelectedImage(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          const errorData = await response.json();
          console.error("Error adding reply:", errorData);
          alert(errorData.message || "Failed to add reply");
        }
      } else {
        // โหมดคอมเมนต์หลัก
        const response = await fetch(`/api/user_comment/${postId}`, {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const newCommentData = await response.json();
          console.log("New comment added:", newCommentData);
          setComments((prev) => [...prev, newCommentData]);
          setNewComment("");
          setSelectedImage(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          const errorData = await response.json();
          console.error("Error adding comment:", errorData);
          alert(errorData.message || "Failed to add comment");
        }
      }
    } catch (error) {
      console.error("Error adding comment/reply:", error);
      alert("Failed to add comment/reply.");
    }
    setLoading(false);
  };

  // เปิด file input เมื่อกดปุ่มบวก
  const handlePlusClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const closeCommentMenu = () => setOpenCommentMenuId(null);

  const handleCommentDelete = async (commentId: string) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("User not logged in.");
        return;
      }
      const response = await fetch(`/api/user_comment/${commentId}?userId=${userId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Deleted comment:", data);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment.");
    }
    closeCommentMenu();
  };

  const handleCommentEdit = (commentId: string) => {
    closeCommentMenu();
    const commentToEdit = comments.find((c) => c.id === commentId);
    if (commentToEdit) {
      setEditingComment(commentToEdit);
    }
  };

  const handleCommentReport = (commentId: string) => {
    closeCommentMenu();
    console.log("Report comment:", commentId);
    // TODO: Implement report functionality
  };

  // Toggle view replies for a comment
  const toggleViewReplies = async (commentId: string) => {
    if (expandedReplies[commentId]) {
      setExpandedReplies((prev) => ({ ...prev, [commentId]: false }));
      return;
    }
    if (!repliesMap[commentId]) {
      try {
        const response = await fetch(`/api/replies/${commentId}`);
        if (response.ok) {
          const data = await response.json();
          setRepliesMap((prev) => ({ ...prev, [commentId]: data }));
        } else {
          setRepliesMap((prev) => ({ ...prev, [commentId]: [] }));
        }
      } catch (error) {
        console.error("Error fetching replies:", error);
      }
    }
    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
  };

  // Open reply mode using main comment input field
  const handleOpenReplyMode = (commentId: string) => {
    setReplyTargetCommentId(commentId);
    // Optionally, focus the input field here
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleDeletePost = async () => {
    const confirmed = confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;
  
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication required.");
      return;
    }
  
    try {
      const response = await fetch(`/api/deletePost?postId=${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
  
      if (response.status === 204) {
        alert("Post deleted successfully!");
        onClose(); // ✅ ปิดโมเดลคอมเมนต์
        window.location.reload(); // ✅ รีโหลดหน้าใหม่เพื่ออัปเดตรายการโพสต์
      } else {
        const responseData = await response.json();
        console.error("Delete response:", responseData);
        alert(responseData.message || "Error deleting post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    }
  
    setMenuOpen(false);
  };
  
  const handleEditPost = () => {
    setIsEditModalOpen(true);
    setMenuOpen(false);
  };
  

  // ฟังก์ชันจัดการรายงานโพสต์
  const handleReportPost = () => {
    console.log("Reporting post...");
    setMenuOpen(false);
  };

  // ดึง userId ของผู้ใช้ปัจจุบัน
  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  return (
    <>
      <div className={styles.modalOverlay}>
        <button className={styles.closeButton} onClick={onClose}>✖</button>
        <div className={styles.modalContent}>
          <div className={styles.postContainer}>
            <div className={styles.imageSection}>
              <Image src={postImage} alt="Post Image" width={500} height={600} />
            </div>
            <div className={styles.commentSection}>
              <div className={styles.postHeader}>
                <span className={styles.ownerProfile}>{postOwner}</span>
                <button onClick={toggleMenu} className={styles.menuButton}>⋮</button>
              </div>

              {menuOpen && (
                <div className={styles.modalMenuOverlay} onClick={() => setMenuOpen(false)}>
                  <div className={styles.modalMenu} onClick={(e) => e.stopPropagation()}>
                    {String(loggedUserId) === String(ownerId) ? (
                      <>
                        <button onClick={handleDeletePost} className={styles.modalButton}>
                          Delete
                        </button>
                        <button onClick={handleEditPost} className={styles.modalButton}>
                          Edit
                        </button>
                      </>
                    ) : (
                      <button onClick={() => console.log("Report Post")} className={styles.modalButton}>
                        Report
                      </button>
                    )}
                    <button onClick={() => setMenuOpen(false)} className={styles.modalButton}>Cancel</button>
                  </div>
                </div>
              )}

              <div className={styles.postDetails}>
                <h2 className={styles.postTitle}>{title}</h2>
                <p className={styles.postMeta}>
                  <span className={styles.ownerProfile}>{postOwner}:</span> {content}
                </p>
              </div>
              <div className={styles.commentList}>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className={styles.commentItem}>
                      <div className={styles.commentContent}>
                        <strong>User {comment.userId}</strong>: {comment.content}
                      </div>
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
                      {/* ส่วน Reply + 3 จุด */}
                      <div className={styles.replySection}>
                        <button
                          className={styles.replyActionButton}
                          onClick={() => handleOpenReplyMode(comment.id)}
                        >
                          Replies
                        </button>
                        <span
                          className={styles.replyDots}
                          onClick={() =>
                            setOpenCommentMenuId(
                              openCommentMenuId === comment.id ? null : comment.id
                            )
                          }
                        >
                           ⋯
                        </span>
                        {openCommentMenuId === comment.id && (
                          <div className={styles.commentMenuOverlay}>
                            <div className={styles.commentMenuContent}>
                              {currentUserId === comment.userId ? (
                                <>
                                  <button onClick={() => handleCommentDelete(comment.id)}>
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => handleCommentReport(comment.id)}>
                                  Report
                                </button>
                              )}
                              <button onClick={closeCommentMenu}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* ถ้ามี replies อยู่แล้ว ให้แสดงปุ่ม View/Hide replies */}
                      {repliesMap[comment.id] && repliesMap[comment.id].length > 0 && (
                        <div className={styles.viewRepliesSection}>
                          <button onClick={() => toggleViewReplies(comment.id)}>
                            {expandedReplies[comment.id] ? "Hide replies" : "View replies"}
                          </button>
                        </div>
                      )}
                      {/* แสดงรายการ replies เมื่อเปิด */}
                      {expandedReplies[comment.id] && repliesMap[comment.id] && (
                        <div className={styles.replyList}>
                          {repliesMap[comment.id].map((reply) => (
                            <div key={reply.id} className={styles.replyItem}>
                              <strong>User {reply.userId}</strong>: {reply.content}
                              {reply.images &&
                                reply.images.length > 0 &&
                                !reply.images[0].toLowerCase().includes("dummy") && (
                                  <div
                                    className={styles.replyImage}
                                    onClick={() => setPreviewImage(reply.images[0])}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <Image
                                      src={reply.images[0]}
                                      alt="Reply Image"
                                      width={150}
                                      height={150}
                                      style={{ objectFit: "cover" }}
                                    />
                                  </div>
                              )}
                              <div className={styles.replyLabel}>
                                Replies ⋯
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className={styles.noComments}>No comments yet.</p>
                )}
              </div>
              {selectedImage && (
                <div className={styles.selectedImageName}>
                  Selected: {selectedImage.name}
                </div>
              )}
                {replyTargetCommentId && (
                  <div className={styles.replyModeLabel}>
                    <span>Replying to comment {replyTargetCommentId}</span>
                    <button onClick={() => setReplyTargetCommentId(null)} className={styles.cancelReplyButton}>
                      Cancel
                    </button>
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
      {previewImage && (
        <div className={styles.previewOverlay} onClick={closePreview}>
          <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closePreviewButton} onClick={closePreview}>✖</button>
            <Image src={previewImage} alt="Preview" width={600} height={600} style={{ objectFit: "contain" }} />
          </div>
        </div>
      )}
      {editingComment && (
        <EditCommentModal
          comment={editingComment}
          onClose={() => setEditingComment(null)}
          onUpdateSuccess={(updatedComment) =>
            setComments((prev) =>
              prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
            )
          }
        />
      )}

      {isEditModalOpen && (
        <EditPostModal
          postId={postId}
          initialTitle={title}
          initialCaption={content}
          initialImages={[postImage]}
          closeModal={() => setIsEditModalOpen(false)}
          onPostUpdated={() => {
            onClose();
            window.location.reload();
          }}
        />
      )}
    </>
  );
};

export default CommentModal;
