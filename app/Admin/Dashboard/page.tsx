// app/Admin/PostReport/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./PostReport.module.css";
import PostReportList from "./PostReportList";

export default function ReportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("reportPost");

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    router.push("/Login");
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <button
          className={`${styles.menuItem} ${activeTab === "reportPost" ? styles.active : ""}`}
          onClick={() => setActiveTab("reportPost")}
        >
          Report post
        </button>
        <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
      </div>
      <div className={styles.card}>
        <h2 className={styles.title}>Report post</h2>
        <PostReportList />
      </div>
    </div>
  );
}
