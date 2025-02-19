'use client';

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./Profile.module.css";
import { FaCog } from "react-icons/fa"; // ไอคอนสำหรับตั้งค่า
import Sidebar from "../components/Sidebar/Sidebar";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session || !session.user) {
    return null;
  }

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  return (
    <div className={styles.profileContainer}>
      <Sidebar />
      <div className={styles.profileHeader}>
        {/* Avatar */}
        <img
          src={session.user.image || "/assets/default-avatar.jpg"}
          alt="User Avatar"
          className={styles.avatarImage}
        />

        {/* ข้อมูลผู้ใช้ */}
        <div className={styles.userInfo}>
          <div className={styles.userTop}>
            <h2>{session.user.name || "NAME"}</h2>
            <button onClick={handleEditProfile} className={styles.editButton}>
              Edit profile
            </button>
            <FaCog className={styles.settingsIcon} />
          </div>
          <p>{session.user.email || "Email"}</p>
          <div className={styles.stats}>
            <span>0 post</span>
            <span>0 follower</span>
            <span>0 following</span>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className={styles.navbar}>
        <span className={styles.activeTab}>POSTS</span>
        <span>SAVED</span>
        <span>TAGGED</span>
      </div>
    </div>
  );
}
