// app/edit-password/page.tsx

"use client";

import { useState } from "react";
import styles from "./EditPassword.module.css";
import { useRouter, useSearchParams } from "next/navigation";

const EditPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!token) {
      alert("Invalid or missing token");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/edit_password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      alert(data.message);
      if (response.ok) {
        router.push("/Login");
      }
    } catch (error) {
      alert("Failed to update password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Create A Strong Password</h2>
        <p className={styles.subtitle}>
          Your password must be at least 6 characters and should include a
          combination of numbers, letters and special characters (!$@%).
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="New password, again"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditPassword;