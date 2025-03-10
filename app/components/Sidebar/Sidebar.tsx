"use client";
import { useState } from "react";
import styles from "./Sidebar.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
  const [title, setTitle] = useState("");
  // เปลี่ยนเป็น array เพื่อรองรับหลายรูป
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    fileInput.multiple = true;
    fileInput.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files) {
        const imageUrls = Array.from(files).map((file) =>
          URL.createObjectURL(file)
        );
        setSelectedImages(imageUrls);
        setCurrentImageIndex(0);
        setIsCreatePostVisible(true);
      }
    };
    fileInput.click();
  };

  const nextImage = () => {
    if (currentImageIndex < selectedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const sharePost = async () => {
    // ตรวจสอบว่า title, caption และ selectedImages มีค่า
    if (!title || !caption || selectedImages.length === 0) {
      alert("Please add a title, image(s), and caption before sharing.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", caption);

    // ดึง userId จาก localStorage
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("User not found. Please log in again.");
      return;
    }
    formData.append("userId", userId);

    // วนลูปเพื่อเพิ่มทุกรูปที่เลือก
    for (let i = 0; i < selectedImages.length; i++) {
      const imageBlob = await fetch(selectedImages[i]).then((r) => r.blob());
      formData.append("images", imageBlob, `image${i}.jpg`);
    }

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
        setTitle("");
        setSelectedImages([]);
        setCaption("");
      } else {
        const errorData = await response.json();
        alert("Failed to create post: " + errorData.message);
      }
    } catch (error: unknown) {
      let errorMessage = "An unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message; // ✅ TypeScript รับรู้ว่ามี message
      }
    
      alert("Error: " + errorMessage);
    }
    
  };

  const closeCreatePost = () => {
    setIsCreatePostVisible(false);
    setSelectedImages([]);
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
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    window.location.href = "/Login";
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}></div>
        </div>


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

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className={styles.titleInput}
            />

            {selectedImages.length > 0 && (
              <div className={styles.imagePreviewContainer}>
                <div className={styles.imageWrapper}>
                  <button
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                    className={styles.imageNavLeft}
                  >
                    &#10094;
                  </button>

                  <Image
                    src={selectedImages[currentImageIndex]}
                    alt="Selected Image"
                    width={500}
                    height={300}
                    className={styles.selectedImage}
                  />

                  <button
                    onClick={nextImage}
                    disabled={currentImageIndex === selectedImages.length - 1}
                    className={styles.imageNavRight}
                  >
                    &#10095;
                  </button>
                </div>
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
