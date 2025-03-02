"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./EditPostModal.module.css";

const EditPostModal: React.FC<EditPostModalProps> = ({
  postId,
  initialTitle,
  initialCaption,
  initialImages,
  closeModal,
  onPostUpdated,
}) => {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [caption, setCaption] = useState(initialCaption);
  const [selectedImages, setSelectedImages] = useState<string[]>(initialImages || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ เพิ่ม state loading

  useEffect(() => {
    setTitle(initialTitle);
    setCaption(initialCaption);
    if (initialImages && initialImages.length > 0) {
      setSelectedImages(initialImages);
    }
  }, [initialTitle, initialCaption, initialImages]);

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
  
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User ID not found. Please log in again.");
      return;
    }
    formData.append("userId", userId);
  
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append("images", file, file.name);
      });
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
      onPostUpdated(); // ✅ อัปเดตรายการโพสต์
      closeModal();
      window.location.reload(); // ✅ รีโหลดหน้าหลักหลังแก้ไขสำเร็จ
    } catch (err: any) {
      console.error("Error updating post:", err);
      setError(err.message || "An error occurred. Please try again.");
    }
  };
  

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={closeModal} className={styles.closeButton}>✖</button>
        <h2 className={styles.modalTitle}>Edit Post</h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title..."
          className={styles.titleInput}
        />

        {selectedImages.length > 0 && (
          <div className={styles.imagePreviewContainer}>
            <div className={styles.imageWrapper}>
              {selectedImages.length > 1 && (
                <button
                  onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                  disabled={currentImageIndex === 0}
                  className={styles.imageNavLeft}
                >
                  &#10094;
                </button>
              )}
              <Image
                src={selectedImages[currentImageIndex]}
                alt="Selected Image"
                width={500}
                height={300}
                className={styles.selectedImage}
              />
              {selectedImages.length > 1 && (
                <button
                  onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                  disabled={currentImageIndex === selectedImages.length - 1}
                  className={styles.imageNavRight}
                >
                  &#10095;
                </button>
              )}
            </div>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const filesArray = Array.from(e.target.files);
              const urls = filesArray.map((file) => URL.createObjectURL(file));
              setSelectedImages(urls);
              setSelectedFiles(filesArray);
              setCurrentImageIndex(0);
            }
          }}
        />

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Edit your caption..."
          className={styles.captionBox}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        <button onClick={updatePost} className={styles.btnPrimary} disabled={loading}>
          {loading ? "Updating..." : "Update Post"} {/* ✅ ป้องกันกดซ้ำ */}
        </button>
        <button onClick={closeModal} className={styles.btnSecondary} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditPostModal;
