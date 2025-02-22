'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Profile.module.css";
import { FaCog } from "react-icons/fa"; // ไอคอนสำหรับตั้งค่า
import Sidebar from "../components/Sidebar/Sidebar";

// ฟังก์ชัน decode JWT token
function decodeToken(token: string) {
  try {
    const payload = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    image?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ก่อนอื่นลองดึงข้อมูลผู้ใช้จาก localStorage ถ้ามี
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
      return;
    }

    // ถ้าไม่มี ให้ลอง decode token จาก localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const decoded = decodeToken(token);
    if (!decoded || !decoded.id || !decoded.email) {
      router.push("/login");
      return;
    }
    // ถ้า token ไม่มี name เราก็ใช้ค่า default ("NAME")
    setUser({
      id: decoded.id,
      name: decoded.name || "NAME",
      email: decoded.email,
      image: decoded.image || null,
    });
    setLoading(false);
  }, [router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null;
  }

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  return (
    <div className={styles.profileContainer}>
      <Sidebar />
      <div className={styles.profileHeader}>
        <img
          src={user.image || "/assets/default-avatar.jpg"}
          alt="User Avatar"
          className={styles.avatarImage}
        />
        <div className={styles.userInfo}>
          <div className={styles.userTop}>
            <h2>{user.name}</h2>
            <button onClick={handleEditProfile} className={styles.editButton}>
              Edit profile
            </button>
            <FaCog className={styles.settingsIcon} />
          </div>
          <p>{user.email}</p>
          <div className={styles.stats}>
            <span>0 post</span>
            <span>0 follower</span>
            <span>0 following</span>
          </div>
        </div>
      </div>
      <div className={styles.navbar}>
        <span className={styles.activeTab}>POSTS</span>
        <span>SAVED</span>
        <span>TAGGED</span>
      </div>
    </div>
  );
}
