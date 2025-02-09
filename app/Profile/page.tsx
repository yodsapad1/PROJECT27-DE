// หน้า Profile (page.tsx)
'use client';

import { useState, useEffect } from 'react';
import styles from './Profile.module.css';
import Sidebar from '../components/Sidebar/Sidebar';

export default function Profile() {
  const [userData, setUserData] = useState(null);

  // หน้า Profile (เพิ่มฟังก์ชันออกจากระบบ)
const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/Login'; // เปลี่ยนหน้าไปที่หน้า Login
};

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')); // ดึงข้อมูลจาก localStorage
    if (user) {
      setUserData(user);
    } else {
      // ถ้าไม่มีข้อมูลผู้ใช้ ให้ไปหน้า login
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className={styles.profileContainer}>
      <Sidebar />
      <div className={styles.profileWrapper}>
        {userData ? (
          <>
            <div className={styles.avatarSection}>
              <img src={userData.avatar || '/assets/default-avatar.jpg'} alt="User Avatar" className={styles.avatarImage} />
            </div>

            <div className={styles.profileInfo}>
              <h2 className={styles.profileTitle}>Profile</h2>
              <div className={styles.infoGroup}>
                <label>Name</label>
                <p>{userData.name}</p>
              </div>

              <div className={styles.infoGroup}>
                <label>Email</label>
                <p>{userData.email}</p>
              </div>

            </div>
          </>
          
        ) : (
          <p>Loading...</p>
        )}
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
