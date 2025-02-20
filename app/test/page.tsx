"use client"; // Mark this component as a client component
import { useState, useEffect } from 'react';

interface User {
    id: string; // เปลี่ยนเป็น string หากใช้ MongoDB
    name: string;
    email: string;
}

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');

    // ฟังก์ชันดึงข้อมูลผู้ใช้
    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users'); // Fetching your API
            if (!response.ok) throw new Error('Failed to fetch users.');

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
            setError('Error fetching users');
        }
    };

    // ดึงข้อมูลผู้ใช้เมื่อคอมโพเนนต์โหลด
    useEffect(() => {
        fetchUsers();
    }, []);

    // ฟังก์ชันลงทะเบียนผู้ใช้
    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // ตรวจสอบว่าข้อมูลครบหรือไม่
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('All fields are required');
            return;
        }

        try {
            const requestBody = {
                name: name.trim(),
                email: email.trim(),
                password: password.trim(),
            };

            console.log("Sending request with body:", requestBody); // Debug log

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errData = await response.json();
                setError(errData.detail || 'Registration failed');
                return;
            }

            const result = await response.json();
            setMessage(result.message);
            setUsers((prevUsers) => [...prevUsers, result.user]);

            // Clear input fields
            setName('');
            setEmail('');
            setPassword('');
        } catch (err) {
            console.error('Error:', err);
            setError('An unexpected error occurred');
        }
    };

    return (
        <div>
            <h1>User Management</h1>

            <form onSubmit={handleRegister}>
                <h2>Register</h2>
                <input 
                    type="text" 
                    placeholder="Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit">Register</button>
            </form>

            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h2>User List</h2>
            <ul>
                {users.length > 0 ? (
                    users.map((user) => (
                        <li key={user.id}>
                            {user.name} - {user.email}
                        </li>
                    ))
                ) : (
                    <li>No users found.</li>
                )}
            </ul>
        </div>
    );
};

export default Users;
