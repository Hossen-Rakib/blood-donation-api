import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthProvider';
import { baseUrl } from '../services/BaseUrl';
import { donorApi } from '../services/api';
import toast from 'react-hot-toast';
import BANGLADESH_DISTRICTS from '../services/bangladeshLocations';

const UserProfile = () => {
    const { authUser, accessToken, updateAuthUser } = useContext(AuthContext);

    const [name, setName]         = useState('');
    const [phone, setPhone]       = useState('');
    const [location, setLocation] = useState('');
    const [age, setAge]           = useState('');
    const [gender, setGender]     = useState('');
    const [availability, setAvailability] = useState(true);
    const [saving, setSaving]     = useState(false);

    useEffect(() => {
        if (authUser) {
            setName(authUser.name || '');
            setPhone(authUser.phone || '');
            setLocation(authUser.location || 'Dhaka');
        }
    }, [authUser]);

    // Also load donor profile if user has one
    useEffect(() => {
        if (authUser?.donor_id) {
            donorApi.getMyProfile()
                .then(d => {
                    setAge(d.age || '');
                    setGender(d.gender || '');
                    setAvailability(d.availability);
                })
                .catch(() => {});
        }
    }, [authUser]);

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            // Update donor profile if user has donor_id
            if (authUser?.donor_id) {
                await donorApi.updateMyProfile({
                    name,
                    phone,
                    location,
                    age: age ? parseInt(age) : null,
                    gender: gender || null,
                    availability,
                });
            }
            updateAuthUser({ name, phone, location });
            toast.success('Profile updated successfully!');
        } catch (err) {
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-500 mt-1">
                        Manage your personal information and donor settings.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                    {/* Profile Banner */}
                    <div className="bg-gradient-to-r from-red-500 to-red-700 px-8 py-8">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white text-3xl font-bold">
                                {authUser?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="text-white">
                                <h2 className="text-2xl font-semibold">{authUser?.name}</h2>
                                <p className="text-red-100">@{authUser?.username || authUser?.email}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="px-3 py-1 text-xs font-medium bg-white/20 rounded-full">
                                        {authUser?.role}
                                    </span>
                                    {authUser?.is_active && (
                                        <span className="px-3 py-1 text-xs font-medium bg-green-500/90 rounded-full">
                                            Active
                                        </span>
                                    )}
                                    {authUser?.donor_id && (
                                        <span className="px-3 py-1 text-xs font-medium bg-white/20 rounded-full">
                                            🩸 Donor Profile
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleUpdateProfile} className="p-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                            <p className="text-sm text-gray-500 mt-1">Update your profile details.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} type="text" required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
                                    placeholder="Your full name" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input value={phone} onChange={(e) => setPhone(e.target.value)} type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
                                    placeholder="01XXXXXXXXX" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">জেলা বা এলাকা (District / Area)</label>
                                <input
                                    type="text"
                                    list="profile-district-list"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="আপনার জেলা বা এলাকা লিখুন বা বাছাই করুন"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
                                />
                                <datalist id="profile-district-list">
                                    {BANGLADESH_DISTRICTS.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </datalist>
                            </div>

                            {authUser?.donor_id && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                                        <input value={age} onChange={(e) => setAge(e.target.value)} type="number" min="18" max="65"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
                                            placeholder="Your age" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                        <select value={gender} onChange={(e) => setGender(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition">
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Donor Availability</label>
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" className="toggle toggle-error" checked={availability}
                                                onChange={(e) => setAvailability(e.target.checked)} />
                                            <span className={`badge ${availability ? 'badge-success' : 'badge-error'}`}>
                                                {availability ? 'Available for Donation' : 'Not Available'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Account Info */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500">User ID</p>
                                    <p className="font-semibold mt-1">#{authUser?.id}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500">Role</p>
                                    <p className="font-semibold mt-1 capitalize">{authUser?.role}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-semibold mt-1 text-sm truncate">{authUser?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                            <button type="submit" disabled={saving}
                                className="px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition shadow-sm disabled:opacity-50">
                                {saving
                                    ? <span className="loading loading-spinner loading-sm"></span>
                                    : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;