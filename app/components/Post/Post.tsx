import React from "react";
import styles from "./Post.module.css";
import Image from "next/image";

interface PostProps {
  username: string;
  userImage: string;
  postImage: string;
  caption: string;
  likes: number;
  comments: number;
}

const Post: React.FC<PostProps> = ({ username, userImage, postImage, caption, likes, comments }) => {
  return (
    <div className={styles.postContainer}>
      <div className={styles.postHeader}>
        <Image src={userImage} alt="Profile" width={40} height={40} className={styles.profileImage} />
        <span className={styles.username}>{username}</span>
      </div>
      <div className={styles.postImage}>
        {postImage ? (
          <Image src={postImage} alt="Post" width={500} height={500} className={styles.image} />
        ) : (
          <Image src="/default-post.jpg" alt="Default Post" width={500} height={500} />
        )}
      </div>
      <div className={styles.postActions}>
        <span>❤️ {likes} Likes</span>
        <span>💬 {comments} Comments</span>
      </div>
      <div className={styles.postCaption}>
        <strong>{username}</strong> {caption}
      </div>
    </div>
  );
};

export default Post;