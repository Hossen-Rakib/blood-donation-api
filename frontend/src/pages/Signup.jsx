import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { baseUrl } from '../services/BaseUrl';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthProvider';
import toast from 'react-hot-toast';
import BANGLADESH_DISTRICTS from '../services/bangladeshLocations';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Signup = () => {
    const [name, setName]               = useState('');
    const [email, setEmail]             = useState('');
    const [phone, setPhone]             = useState('');
    const [password, setPassword]       = useState('');
    const [bloodGroup, setBloodGroup]   = useState('');
    const [location, setLocation]       = useState('Dhaka');
    const [age, setAge]                 = useState('');
    const [gender, setGender]           = useState('');
    const [loading, setLoading]         = useState(false);

    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSignup = async () => {
        if (!name || !email || !phone || !password || !bloodGroup) {
            toast.error('Please fill in all required fields!');
            return;
        }
        if (password.length < 4) {
            toast.error('Password must be at least 4 characters!');
            return;
        }

        const donorData = {
            name,
            email,
            phone,
            password,
            blood_group: bloodGroup,
            location,
            age: age ? parseInt(age) : null,
            gender: gender || null,
        };

        setLoading(true);

        try {
            // /auth/register creates both User account AND Donor profile
            // so the user can both donate blood AND request blood after one signup
            const res = await fetch(`${baseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donorData),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data?.detail || 'Registration failed! Please try again.');
                return;
            }

            // Auto-login: /donor/register returns an access_token directly
            if (data.access_token) {
                localStorage.setItem('lm_token', data.access_token);

                const userRes = await fetch(`${baseUrl}/user`, {
                    headers: { Authorization: `Bearer ${data.access_token}` },
                });
                const userData = await userRes.json();

                if (userData?.id) {
                    loginUser(data.access_token, userData);
                    toast.success(`Welcome, ${data.name}! 🩸 You can now donate blood or request blood.`);
                    navigate('/');
                    return;
                }
            }

            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (error) {
            console.error('Signup error:', error);
            toast.error('Network error! Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hero bg-base-200 min-h-screen py-10">
            <div className="hero-content flex-col w-full">

                <div className="text-center">
                    <div className="text-5xl mb-3">🩸</div>
                    <h1 className="text-4xl font-bold text-red-600">Create Account</h1>
                    <p className="py-3 text-gray-600 max-w-sm">
                        একবার register করলেই আপনি{' '}
                        <span className="font-semibold text-red-500">রক্ত দিতে</span> এবং{' '}
                        <span className="font-semibold text-blue-500">রক্ত নিতে</span> উভয়ই পারবেন।
                    </p>

                    {/* Feature badges */}
                    <div className="flex gap-3 justify-center mb-2 flex-wrap">
                        <span className="badge badge-success">🩸 Donate Blood</span>
                        <span className="badge badge-info">🏥 Request Blood</span>
                    </div>
                </div>

                <div className="card bg-base-100 w-full max-w-md shrink-0 shadow-2xl">
                    <div className="card-body">
                        <fieldset className="fieldset space-y-1">

                            <label className="label">Full Name <span className="text-red-500">*</span></label>
                            <input type="text" className="input w-full" placeholder="Your full name"
                                value={name} onChange={(e) => setName(e.target.value)} />

                            <label className="label">Email (used as login ID) <span className="text-red-500">*</span></label>
                            <input type="email" className="input w-full" placeholder="your@email.com"
                                value={email} onChange={(e) => setEmail(e.target.value)} />

                            <label className="label">Phone <span className="text-red-500">*</span></label>
                            <input type="text" className="input w-full" placeholder="01XXXXXXXXX"
                                value={phone} onChange={(e) => setPhone(e.target.value)} />

                            <label className="label">Blood Group <span className="text-red-500">*</span></label>
                            <select className="select w-full" value={bloodGroup}
                                onChange={(e) => setBloodGroup(e.target.value)}>
                                <option value="">Select Blood Group</option>
                                {BLOOD_GROUPS.map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>

                            <label className="label">জেলা বা এলাকা (District / Area) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                list="signup-district-list"
                                className="input w-full"
                                placeholder="আপনার জেলা বা এলাকা লিখুন বা বাছাই করুন"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            />
                            <datalist id="signup-district-list">
                                {BANGLADESH_DISTRICTS.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </datalist>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Age</label>
                                    <input type="number" className="input w-full" placeholder="Age"
                                        min="18" max="65"
                                        value={age} onChange={(e) => setAge(e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Gender</label>
                                    <select className="select w-full" value={gender}
                                        onChange={(e) => setGender(e.target.value)}>
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <label className="label">Password <span className="text-red-500">*</span></label>
                            <input type="password" className="input w-full" placeholder="Password (min 4 chars)"
                                value={password} onChange={(e) => setPassword(e.target.value)} />

                            <div className="mt-2">
                                <Link to="/login" className="link link-hover text-sm">
                                    Already have an account? Login
                                </Link>
                            </div>

                            <button
                                onClick={handleSignup}
                                className="btn btn-error text-white mt-4 w-full"
                                disabled={loading}
                            >
                                {loading
                                    ? <span className="loading loading-spinner loading-sm"></span>
                                    : 'Register & Get Started 🩸'}
                            </button>

                        </fieldset>
                    </div>
                </div>

                {/* Info box */}
                <div className="alert alert-info max-w-md mt-4">
                    <span>
                        ℹ️ আপনার blood group সঠিকভাবে দিন। এটি দিয়ে আপনাকে matching blood request গুলোতে notify করা হবে।
                    </span>
                </div>

            </div>
        </div>
    );
};

export default Signup;