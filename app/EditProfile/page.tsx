"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./EditProfile.module.css";
import Image from "next/image";

export default function EditProfile() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setUsername(data.username);
        setPreviewImage(data.profileImage || "/uploads/default-avatar.jpg");
      } catch (error) {
        console.error("❌ Error fetching profile:", error);
        router.push("/login");
      }
    };

    fetchProfile();
  }, [router]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    const formData = new FormData();
    formData.append("username", username);
    if (profileImage) formData.append("profileImage", profileImage);
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile", {
        method: "PUT", // ✅ เปลี่ยนจาก POST เป็น PUT
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
  
      alert("Profile updated successfully!");
      router.push("/Profile");
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("❌ Error updating profile:", errMessage);
      alert(errMessage);
    }
    
  };
  

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Edit Profile</h2>
      <div className={styles.profilePicContainer}>
      <Image
        src={previewImage || "/uploads/default-avatar.jpg"}
        alt="Profile"
        width={100} // กำหนดความกว้าง
        height={100} // กำหนดความสูง
        className={styles.profilePic}
      />
      </div>
      <p className={styles.usernameText}>{username}</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Username
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={styles.input} />
        </label>

        <label className={styles.label}>
          Profile Picture
          <input type="file" accept="image/*" onChange={handleImageChange} className={styles.fileInput} />
        </label>

        <button type="submit" className={styles.submitButton}>Submit</button>
      </form>
    </div>
  );
}
