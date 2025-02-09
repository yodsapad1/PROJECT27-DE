'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const login = async () => {
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user; // เก็บข้อมูลผู้ใช้
      
        // ✅ เก็บ Token และข้อมูลผู้ใช้ใน localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(user)); // เก็บข้อมูลผู้ใช้
      
        // ✅ เปลี่ยนไปหน้า Home หรือ Profile หลังจากล็อกอินสำเร็จ
        router.push('/'); // หรือหน้าอื่น ๆ ที่ต้องการ
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.leftSide}>
        <img src="/assets/11.jpg" alt="Login" className={styles.loginImage} />
      </div>

      <div className={styles.rightSide}>
        <div className={styles.formWrapper}>
          <h2 className={styles.title}>Login to your account</h2>

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

          <button type="button" className={styles.loginButton} onClick={login}>
            Login
          </button>

          {message && <p style={{ color: 'green' }}>{message}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div className={styles.signupLink}>
            <p>
              Don't have an account? <a href="/SignUp">Sign Up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
