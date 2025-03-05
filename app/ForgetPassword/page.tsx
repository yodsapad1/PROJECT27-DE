// app/forget-password/page.tsx

"use client";

import { useState } from "react";
import styles from "./ForgetPassword.module.css";
import { useRouter } from "next/navigation";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/edit_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      alert(data.message);
    } catch (err) {
      console.error(err); // แสดง error ใน console
      alert("Failed to send reset email. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}></div>
        <h2 className={styles.title}>Trouble logging in?</h2>
        <p className={styles.subtitle}>
          Enter your email, phone, or username and we&apos;ll send you a link to get
          back into your account.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email, Phone, or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Sending..." : "Send login link"}
          </button>
        </form>
        <p className={styles.link}>Can&apos;t reset your password?</p>
        <div className={styles.orContainer}>
          <span className={styles.line}></span>
          <span className={styles.orText}>OR</span>
          <span className={styles.line}></span>
        </div>
        <button className={styles.createAccount} onClick={() => router.push("/SignUp")}>
          Create new account
        </button>
        <button className={styles.backButton} onClick={() => router.push("/Login")}>
          Back to login
        </button>
      </div>
    </div>
  );
};

export default ForgetPassword;
