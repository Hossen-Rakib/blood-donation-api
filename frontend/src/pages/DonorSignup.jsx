import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { baseUrl } from '../services/BaseUrl';
import { AuthContext } from '../context/AuthProvider';
import toast from 'react-hot-toast';
import BANGLADESH_DISTRICTS from '../services/bangladeshLocations';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DonorSignup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [location, setLocation] = useState('Dhaka');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleDonorSignup = async () => {
        if (!name || !email || !phone || !password || !bloodGroup) {
            toast.error('Please fill in all required fields!');
            return;
        }
        if (password.length < 4) {
            toast.error('Password must be at least 4 characters!');
            return;
        }

        const donorData = {
            name, email, phone, password,
            blood_group: bloodGroup,
            location,
            age: age ? parseInt(age) : null,
            gender: gender || null,
        };

        setLoading(true);

        try {
            const res = await fetch(`${baseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donorData),
            });

            const data = await res.json();

            if (res.ok) {
                // Donor registration returns a token directly
                if (data.access_token) {
                    localStorage.setItem('lm_token', data.access_token);

                    const userRes = await fetch(`${baseUrl}/user`, {
                        headers: { Authorization: `Bearer ${data.access_token}` },
                    });
                    const userData = await userRes.json();

                    if (userData?.id) {
                        loginUser(data.access_token, userData);
                        toast.success(`Welcome, ${data.name}! You are now a registered donor 🩸`);
                        navigate('/donor-dashboard');
                        return;
                    }
                }
                toast.success('Donor registered! Please login.');
                navigate('/login');
            } else {
                toast.error(data?.detail || 'Registration failed! Please try again.');
            }
        } catch (error) {
            console.error('Donor signup error:', error);
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
                    <h1 className="text-4xl font-bold text-red-600">Donor Registration</h1>
                    <p className="py-4 text-gray-500">
                        আপনার তথ্য দিয়ে রক্তদাতা হিসেবে নিবন্ধন করুন।
                    </p>
                    <p className="text-sm">
                        Just want to request blood?{' '}
                        <Link to="/requester-signup" className="link link-hover font-semibold">
                            Create Requester Account
                        </Link>
                    </p>
                </div>

                <div className="card bg-base-100 w-full max-w-md shrink-0 shadow-2xl">
                    <div className="card-body">
                        <fieldset className="fieldset">

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
                            <select className="select w-full" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                                <option value="">Select Blood Group</option>
                                {BLOOD_GROUPS.map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>

                            <label className="label">জেলা বা এলাকা (District / Area) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                list="donor-district-list"
                                className="input w-full"
                                placeholder="আপনার জেলা বা এলাকা লিখুন বা বাছাই করুন"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            />
                            <datalist id="donor-district-list">
                                {BANGLADESH_DISTRICTS.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </datalist>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Age</label>
                                    <input type="number" className="input w-full" placeholder="Age"
                                        value={age} onChange={(e) => setAge(e.target.value)} min="18" max="65" />
                                </div>
                                <div>
                                    <label className="label">Gender</label>
                                    <select className="select w-full" value={gender} onChange={(e) => setGender(e.target.value)}>
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
                                onClick={handleDonorSignup}
                                className="btn btn-error text-white mt-4 w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : 'Register as Donor 🩸'}
                            </button>
                        </fieldset>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorSignup;
