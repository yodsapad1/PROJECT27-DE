'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import Link from "next/link";
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
      // ส่งข้อมูลไปยัง API /api/register เพื่อสร้างผู้ใช้ใหม่
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Signup successful! Logging in...');
        // หลังจากสมัครสมาชิกสำเร็จ ใช้ signIn ของ NextAuth เพื่อล็อกอินอัตโนมัติ
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });
        if (result.error) {
          setError(result.error);
        } else {
          router.push('/');
        }
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
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
              Have an account? <Link href="/Login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
