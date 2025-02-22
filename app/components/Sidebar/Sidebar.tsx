'use client';

import { useState } from "react";
import styles from "./Sidebar.module.css";
import Image from "next/image";
import { useRouter } from 'next/navigation';

interface SidebarProps {
  onNewPost: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewPost }) => {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSwitchAppearanceOpen, setIsSwitchAppearanceOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isCreatePostVisible, setIsCreatePostVisible] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const goToHome = () => router.push("/");
  const goToProfile = () => router.push("/Profile");

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    setIsCreatePostOpen(false);
    setIsCollapsed(!isSearchOpen);
  };

  const toggleCreatePost = () => {
    setIsCreatePostOpen(!isCreatePostOpen);
    setIsSearchOpen(false);
    setIsCollapsed(!isCreatePostOpen);
  };

  const clearSearch = () => setRecentSearches([]);

  const triggerFileSelect = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedImage(URL.createObjectURL(file));
        setIsCreatePostVisible(true);
      }
    };
    fileInput.click();
  };

  const sharePost = async () => {
    if (!caption || !selectedImage) {
      alert("Please add an image and caption before sharing.");
      return;
    }

    const formData = new FormData();
    formData.append("title", caption);
    formData.append("content", caption);
    
    // ดึง userId จาก localStorage แทนการใช้ค่าคงที่ "1"
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("User not found. Please log in again.");
      return;
    }
    formData.append("userId", userId);

    const imageBlob = await fetch(selectedImage).then((r) => r.blob());
    formData.append("images", imageBlob, "image.jpg");

    try {
      const response = await fetch("/api/user_post", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (response.ok) {
        alert("Post shared successfully!");
        onNewPost();
        setIsCreatePostVisible(false);
        setSelectedImage(null);
        setCaption("");
      } else {
        const errorData = await response.json();
        alert("Failed to create post: " + errorData.message);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const closeCreatePost = () => {
    setIsCreatePostVisible(false);
  };

  const toggleSwitchAppearance = () => {
    setIsSwitchAppearanceOpen(!isSwitchAppearanceOpen);
    if (!isSwitchAppearanceOpen) {
      setIsMoreOpen(false);
    }
  };
  
  const closeSwitchAppearance = () => {
    setIsSwitchAppearanceOpen(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle("dark-mode", !isDarkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    window.location.href = '/Login';
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        <div className={styles.logo}></div>

        <nav className={styles.sidebarNav}>
          <ul>
            <li>
              <button onClick={goToHome} className={styles.menuItem}>
                <Image src="/assets/Home.png" alt="Home" width={24} height={24} className={styles.icon} />
                {!isCollapsed && <span>Home</span>}
              </button>
            </li>
            <li>
              <button onClick={toggleSearch} className={styles.menuItem}>
                <Image src="/assets/Search.png" alt="Search" width={24} height={24} className={styles.icon} />
                {!isCollapsed && <span>Search</span>}
              </button>
            </li>
            <li>
              <button onClick={toggleCreatePost} className={styles.menuItem}>
                <Image src="/assets/CreatePost.png" alt="Create Post" width={24} height={24} className={styles.icon} />
                {!isCollapsed && <span>Post</span>}
              </button>
            </li>
            <li>
              <button onClick={goToProfile} className={styles.menuItem}>
                <Image src="/assets/Profile.png" alt="Profile" width={24} height={24} className={styles.icon} />
                {!isCollapsed && <span>Profile</span>}
              </button>
            </li>
          </ul>
        </nav>

        <div className={styles.more}>
          <button onClick={() => setIsMoreOpen(!isMoreOpen)} className={styles.menuItem}>
            <Image src="/assets/more.png" alt="More" width={24} height={24} className={styles.icon} />
            {!isCollapsed && <span>More</span>}
          </button>
        </div>

        {isSearchOpen && (
          <div className={styles.searchContainer}>
            <div className={styles.searchHeader}>
              <strong>Search</strong>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search..."
                className={styles.searchBox}
              />
            </div>
            <div className={styles.searchResults}>
              <div className={styles.searchTitle}>
                <span>Recent</span>
                <span className={styles.clearAll} onClick={clearSearch}>
                  Clear all
                </span>
              </div>
              {recentSearches.length ? (
                <ul>
                  {recentSearches.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No recent searches</p>
              )}
            </div>
          </div>
        )}

        {isCreatePostOpen && (
          <div className={styles.createpostContainer}>
            <div className={styles.createpostHeader}>
              <strong>Create new post</strong>
            </div>
            <div className={styles.createPostContent}>
              <p>Drag photos and videos here</p>
              <button onClick={triggerFileSelect} className={styles.selectButton}>
                Select from computer
              </button>
            </div>
          </div>
        )}

        {isMoreOpen && !isSwitchAppearanceOpen && (
          <div className={styles.moreContainer}>
            <ul>
              <li>
                <button className={styles.moreItem}>
                  <Image src="/assets/Setting.png" alt="Settings" width={24} height={24} className={styles.icon} />
                  <span>Settings</span>
                </button>
              </li>
              <li>
                <button className={styles.moreItem}>
                  <Image src="/assets/Bookmark.png" alt="Saves" width={24} height={24} className={styles.icon} />
                  <span>Saves</span>
                </button>
              </li>
              <li>
                <button onClick={toggleSwitchAppearance} className={styles.moreItem}>
                  <Image src="/assets/Switch.png" alt="Switch Appearance" width={24} height={24} className={styles.icon} />
                  <span>Switch Appearance</span>
                </button>
              </li>
            </ul>
            <button className={styles.logout} onClick={handleLogout}>Logout</button>
          </div>
        )}
      </aside>

      {isCreatePostVisible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button onClick={closeCreatePost} className={styles.closeButton}>✖</button>
            <h2 className={styles.modalTitle}>Create New Post</h2>
            {selectedImage && (
              <div className={styles.imagePreview}>
                <Image src={selectedImage} alt="Selected Image" width={500} height={300} />
              </div>
            )}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className={styles.captionBox}
            />
            <button onClick={sharePost} className={styles.btnPrimary}>Post</button>
          </div>
        </div>
      )}

      {isSwitchAppearanceOpen && (
        <div className={styles.switchAppearanceContainer}>
          <div className={styles.switchHeader}>
            <button onClick={closeSwitchAppearance} className={styles.backButton}>
              <Image src="/assets/arrow_back.png" alt="Back" width={24} height={24} />
            </button>
            <strong>Switch Appearance</strong>
          </div>
          <div className={styles.switchItem}>
            <span>Dark Mode</span>
            <div
              className={`${styles.toggleSwitch} ${isDarkMode ? styles.active : ""}`}
              onClick={toggleDarkMode}
            ></div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
