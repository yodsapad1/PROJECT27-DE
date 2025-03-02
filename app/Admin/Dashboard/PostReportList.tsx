"use client";

import { useState, useEffect } from "react";
import styles from "./PostReport.module.css";
import CommentModal from "../../components/Post/CommentModal";

interface Report {
  id: string;
  reason: string;
  postId: string;
  userId: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  images: string[] | null;
  ownerId: string;
}

const PostReportList = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<{ [key: string]: Post }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/dashboard", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }

        const data = await response.json();
        setReports(data);
      } catch (err) {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const fetchPostDetails = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) throw new Error("Failed to fetch post details");
      const data = await response.json();
      setPosts(prev => ({ ...prev, [postId]: data }));
    } catch (error) {
      console.error("Error fetching post details:", error);
    }
  };

  const openModal = (postId: string) => {
    console.log("📝 Opening post with ID:", postId); // ✅ Debug Log
    if (!posts[postId]) {
        fetchPostDetails(postId);
    }
    setSelectedPost(posts[postId] || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    setReports(prevReports => prevReports.filter(report => report.id !== id));
  };

  if (loading) return <p>Loading reports...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <>
      <ul className={styles.reportList}>
        {reports.map((report) => (
          <li key={report.id} className={styles.reportItem}>
            <div className={styles.avatar}>📌</div>
            <div className={styles.text}>
              <div className={styles.message}><strong>Reason:</strong> {report.reason}</div>
              <div className={styles.message}><strong>Post ID:</strong> {report.postId}</div>
              <div className={styles.message}><strong>User ID:</strong> {report.userId}</div>
            </div>
            <div className={styles.actions}>
              <button 
                className={`${styles.button} ${styles.detail}`} 
                onClick={() => openModal(report.postId)}
              >
                Detail
              </button>
              <button 
                className={`${styles.button} ${styles.delete}`} 
                onClick={() => handleDelete(report.id)}
              >
                Delete post
              </button>
            </div>
          </li>
        ))}
      </ul>
      {isModalOpen && selectedPost && (
        <CommentModal
          postId={selectedPost.id}
          ownerId={selectedPost.ownerId}
          postImage={selectedPost.images?.[0] || "/default-post.jpg"}
          postOwner={selectedPost.ownerId}
          title={selectedPost.title}
          content={selectedPost.content}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default PostReportList;
