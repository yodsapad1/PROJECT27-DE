'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Login.module.css';
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || 'การเข้าสู่ระบบล้มเหลว';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('เข้าสู่ระบบสำเร็จ, token:', data.token);
      // เก็บ token, userId และข้อมูลผู้ใช้ (user object) ลง localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.user.role);
      router.push(data.user.role === 'admin' ? '/Admin/Dashboard' : '/');
    } catch (err: unknown) {
      let errMsg = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      if (err instanceof Error) {
        errMsg = err.message.includes('NetworkError')
          ? 'เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดลองอีกครั้งภายหลัง'
          : err.message;
        console.error(err.message);
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.leftSide}>
        <Image
          src="/assets/11.jpg"
          alt="Login"
          width={700} // ความกว้างที่คุณต้องการ
          height={700} // ความสูงที่คุณต้องการ
        />
      </div>
      <div className={styles.rightSide}>
        <div className={styles.formWrapper}>
          <h2 className={styles.title}>Login to your account</h2>
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
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className={styles.loginButton}>
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          <div className={styles.forgotPassword}>
            <Link href="/ForgetPassword">Forgot password?</Link>
          </div>
          
          <div className={styles.signupLink}>
            <p>
              Don&apos;t have an account? <Link href="/SignUp">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
