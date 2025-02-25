import React, { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import styles from "./EditPostModal.module.css";

interface EditPostModalProps {
  postId: string;
  initialTitle: string; // เพิ่ม prop สำหรับ title
  initialCaption: string;
  initialImage?: string;
  closeModal: () => void;
  onPostUpdated: () => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  postId,
  initialTitle,
  initialCaption,
  initialImage,
  closeModal,
  onPostUpdated,
}) => {
  // ประกาศ state สำหรับ title
  const [title, setTitle] = useState(initialTitle);
  const [caption, setCaption] = useState(initialCaption);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    initialImage || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(initialTitle);
    setCaption(initialCaption);
    setSelectedImage(initialImage || null);
  }, [initialTitle, initialCaption, initialImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setSelectedImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const updatePost = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!caption || !title) {
      setError("Please enter a title and caption.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", caption);

    // ดึง userId จาก localStorage แล้วเพิ่มลงใน formData
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User ID not found. Please log in again.");
      return;
    }
    formData.append("userId", userId);

    if (selectedFile) {
      formData.append("images", selectedFile);
    }

    try {
      const response = await fetch(`/api/user_edit_post/${postId}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update post");
      }
      alert("Post updated successfully!");
      onPostUpdated();
      closeModal();
    } catch (err: any) {
      console.error("Error updating post:", err);
      setError(err.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={closeModal} className={styles.closeButton}>
          ✖
        </button>
        <h2 className={styles.modalTitle}>Edit Post</h2>
        
        {/* ช่องใส่ Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title..."
          className={styles.titleInput}
        />

        {selectedImage && (
          <div className={styles.imagePreview}>
            {title && <h3 className={styles.imageTitle}>{title}</h3>}
            <Image
              src={selectedImage}
              alt="Selected Image"
              width={500}
              height={300}
            />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Edit your caption..."
          className={styles.captionBox}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button onClick={updatePost} className={styles.btnPrimary}>
          Update Post
        </button>
        <button onClick={closeModal} className={styles.btnSecondary}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditPostModal;
