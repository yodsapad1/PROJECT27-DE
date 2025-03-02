"use client";
import React, { useState } from "react";
import Image from "next/image";
import styles from "./ReportModal.module.css";

interface ReportModalProps {
  postId: string;
  currentUserId: string;
  closeModal: () => void;
  onReportSubmitted: () => void;
}

const reportOptions = [
  "I just don't like it",
  "Bullying or unwanted contact",
  "Suicide, self-injury or eating disorders",
  "Violence, hate or exploitation",
  "Selling or promoting restricted items",
  "Nudity or sexual activity",
  "Scam, fraud or spam",
  "False information",
];

const ReportModal: React.FC<ReportModalProps> = ({
  postId,
  currentUserId,
  closeModal,
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      setError("Please select a reason.");
      return;
    }

    const formData = new FormData();
    // ใช้ set() แทน append() เพื่อให้แน่ใจว่า key จะมีค่าเดียว (string)
    formData.set("reason", selectedReason);
    formData.set("userId", currentUserId);

    try {
      const response = await fetch(`/api/user_report/${postId}`, {
        method: "POST",
        credentials: "include", // ส่งคุกกี้ session ไปด้วย (ถ้ามี)
        body: formData,
      });
      if (response.ok) {
        alert("Report submitted successfully. Thanks for your feedback.");
        onReportSubmitted();
        closeModal();
      } else {
        const data = await response.json();
        alert(data.message || "Error submitting report.");
      }
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Error submitting report.");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Report</h2>
        <p className={styles.modalSubtitle}>
          Why are you reporting this post?
        </p>
        <div className={styles.optionsContainer}>
          {reportOptions.map((option) => (
            <label key={option} className={styles.optionLabel}>
              <input
                type="radio"
                name="reportReason"
                value={option}
                checked={selectedReason === option}
                onChange={() => setSelectedReason(option)}
              />
              {option}
            </label>
          ))}
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
        <div className={styles.buttonContainer}>
          <button onClick={handleSubmitReport} className={styles.submitButton}>
            Report
          </button>
          <button onClick={closeModal} className={styles.cancelButton}>
            Cancel
          </button>
        </div>
        <p className={styles.footerText}>
          Learn more about our Community Standards
        </p>
      </div>
    </div>
  );
};

export default ReportModal;
