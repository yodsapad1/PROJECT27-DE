'use client';

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar/Sidebar";
import styles from "./Profile.module.css";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session || !session.user) {
    return null; // หรือสามารถแสดงข้อความให้ผู้ใช้ทราบ
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className={styles.profileContainer}>
      <Sidebar />
      <div className={styles.profileWrapper}>
        <div className={styles.avatarSection}>
          <img
            src={session.user.image || "/assets/default-avatar.jpg"}
            alt="User Avatar"
            className={styles.avatarImage}
          />
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.profileTitle}>Profile</h2>
          <div className={styles.infoGroup}>
            <label>Name</label>
            <p>{session.user.name}</p>
          </div>
          <div className={styles.infoGroup}>
            <label>Email</label>
            <p>{session.user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
    </div>
  );
}
