'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import styles from './SignUp.module.css';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!email || !username || !password) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          email,
          name: username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Signup successful! Logging in...');
        // เก็บ token, userId และข้อมูลผู้ใช้ลง localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.leftSide}>
        <img src="/assets/11.jpg" alt="Sign Up" />
      </div>
      <div className={styles.rightSide}>
        <div className={styles.formWrapper}>
          <h2 className={styles.title}>Create Your Account</h2>
          <form onSubmit={handleSubmit}>
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
            <button type="submit" className={styles.signupButton}>
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </form>
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
