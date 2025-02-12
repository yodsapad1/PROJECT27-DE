'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import Link from "next/link";
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const login = async () => {
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    // ใช้ NextAuth signIn แบบ Credentials Provider
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
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div className={styles.signupLink}>
            <p>
              Don't have an account? <Link href="/SignUp">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
