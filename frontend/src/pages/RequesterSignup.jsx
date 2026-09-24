import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { baseUrl } from '../services/BaseUrl';
import toast from 'react-hot-toast';
import BANGLADESH_DISTRICTS from '../services/bangladeshLocations';

const RequesterSignup = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('Dhaka');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async () => {
        if (!name || !username || !email || !phone || !password) {
            toast.error('Please fill in all fields!');
            return;
        }
        if (password.length < 4) {
            toast.error('Password must be at least 4 characters!');
            return;
        }

        const userData = { name, username, email, phone, location, password, role: 'requester' };
        setLoading(true);

        try {
            const res = await fetch(`${baseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Account created successfully! Please login.');
                navigate('/login');
            } else {
                toast.error(data?.detail || 'Signup failed! Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            toast.error('Network error! Please check your internet connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hero bg-base-200 min-h-screen py-6 sm:py-10 px-3 sm:px-4">
            <div className="hero-content flex-col w-full max-w-lg p-0">
                <div className="text-center px-2">
                    <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">👤</div>
                    <h1 className="text-3xl sm:text-4xl font-bold">Create Account</h1>
                    <p className="py-2 sm:py-4 text-gray-500 text-sm sm:text-base">
                        Blood request করার জন্য account তৈরি করুন।
                    </p>
                    <p className="text-sm">
                        Donor হতে চান?{' '}
                        <Link to="/donor-signup" className="link link-hover text-red-500 font-semibold">
                            Donor Registration 🩸
                        </Link>
                    </p>
                </div>

                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-xl border border-base-200">
                    <div className="card-body p-4 sm:p-7">
                        <fieldset className="fieldset">

                            <label className="label">Full Name</label>
                            <input type="text" className="input w-full" placeholder="Your full name"
                                value={name} onChange={(e) => setName(e.target.value)} />

                            <label className="label">Username</label>
                            <input type="text" className="input w-full" placeholder="Username"
                                value={username} onChange={(e) => setUsername(e.target.value)} />

                            <label className="label">Email</label>
                            <input type="email" className="input w-full" placeholder="Email address"
                                value={email} onChange={(e) => setEmail(e.target.value)} />

                            <label className="label">Phone</label>
                            <input type="text" className="input w-full" placeholder="01XXXXXXXXX"
                                value={phone} onChange={(e) => setPhone(e.target.value)} />

                            <label className="label">জেলা বা এলাকা (District / Area)</label>
                            <input
                                type="text"
                                list="requester-district-list"
                                className="input w-full"
                                placeholder="আপনার জেলা বা এলাকা লিখুন বা বাছাই করুন"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                            <datalist id="requester-district-list">
                                {BANGLADESH_DISTRICTS.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </datalist>

                            <label className="label">Password</label>
                            <input type="password" className="input w-full" placeholder="Password (min 4 chars)"
                                value={password} onChange={(e) => setPassword(e.target.value)} />

                            <div className="mt-2">
                                <Link to="/login" className="link link-hover text-sm">
                                    Already have an account? Login
                                </Link>
                            </div>

                            <button
                                onClick={handleSignup}
                                className="btn btn-neutral mt-4 w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : 'Create Account'}
                            </button>

                        </fieldset>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequesterSignup;
