'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SignUp.module.css';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const signUp = async () => {
    setMessage('');
    setError('');

    if (!email || !username || !password) {
      setError('All fields are required.');
      return;
    }

    try {
      console.log('📢 Sending request to /api/register'); // Debug
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: username,
          password,
        }),
      });

      const data = await response.json();
      console.log('✅ Response:', data); // Debug ดูผลลัพธ์ API

      if (response.ok) {
        const user = data.user; // เก็บข้อมูลผู้ใช้
      
        // ✅ เก็บ Token และข้อมูลผู้ใช้ใน localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(user)); // เก็บข้อมูลผู้ใช้
      
        // ✅ เปลี่ยนไปหน้า Home หรือ Profile หลังจากล็อกอินสำเร็จ
        router.push('/profile'); // หรือหน้าอื่น ๆ ที่ต้องการ
      }
      setMessage(data.message || 'Signup successful! Redirecting...');
    } catch (err) {
      console.error('❌ Error:', err);
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.leftSide}>
        <img src="/assets/11.jpg" alt="Sign Up" className={styles.signupImage} />
      </div>

      <div className={styles.rightSide}>
        <div className={styles.formWrapper}>
          <h2 className={styles.title}>Create Your Account</h2>

          <div className={styles.inputGroup}>
            <label className={styles.labelLeft}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
              className={styles.customInput}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.labelLeft}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Enter your username"
              className={styles.customInput}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.labelLeft}>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password"
              className={styles.customInput}
              required
            />
          </div>

          <button type="button" className={styles.signupButton} onClick={signUp}>
            Sign Up
          </button>

          {message && <p style={{ color: 'green' }}>{message}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div className={styles.loginLink}>
            <p>
              Have an account? <a href="/Login">Log in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
