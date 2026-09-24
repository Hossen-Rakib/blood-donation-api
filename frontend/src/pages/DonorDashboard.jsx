import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AuthContext } from '../context/AuthProvider';
import { donorApi } from '../services/api';
import toast from 'react-hot-toast';

const DonorDashboard = () => {
    const { authUser } = useContext(AuthContext);
    const [donorData, setDonorData]         = useState(null);
    const [matchingReqs, setMatchingReqs]   = useState([]);
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [profile, matching] = await Promise.all([
                    donorApi.getMyProfile(),
                    donorApi.getMatchingRequests(),
                ]);
                setDonorData(profile);
                setMatchingReqs(matching);
            } catch (err) {
                toast.error(err.message || 'Failed to load donor data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleAccept = async (reqId) => {
        setActionLoading(reqId);
        try {
            await donorApi.acceptRequest(reqId);
            toast.success('Blood request accepted! The requester has been notified. 🩸');
            setMatchingReqs(prev => prev.filter(r => r.id !== reqId));
        } catch (err) {
            toast.error(err.message || 'Failed to accept request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleAvailability = async () => {
        try {
            await donorApi.updateMyProfile({ availability: !donorData.availability });
            setDonorData(prev => ({ ...prev, availability: !prev.availability }));
            toast.success(`You are now ${!donorData.availability ? 'Available' : 'Not Available'}`);
        } catch (err) {
            toast.error(err.message || 'Failed to update availability');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <span className="loading loading-spinner loading-lg text-red-500"></span>
        </div>
    );

    if (!donorData) return (
        <div className="text-center py-20">
            <div className="text-5xl mb-4">😔</div>
            <p className="text-xl text-gray-500">Donor profile not found.</p>
            <p className="text-sm text-gray-400 mt-2">Please contact admin.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-base-200 py-8 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-base-content">🩸 Donor Dashboard</h1>
                        <p className="text-gray-500 mt-1">Welcome, {donorData.name}! আপনার donation activity এখানে দেখুন।</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/find-donors" className="btn btn-error text-white btn-sm">
                            🔍 Browse All Donors
                        </Link>
                        <Link to="/open-requests" className="btn btn-outline btn-error btn-sm">
                            🆘 View Blood Requests
                        </Link>
                    </div>
                </div>

                {/* Profile + Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

                    {/* Profile Card */}
                    <div className="card bg-base-100 shadow-sm md:col-span-1">
                        <div className="card-body items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold mb-2">
                                {donorData.name?.charAt(0)}
                            </div>
                            <h2 className="font-bold text-lg">{donorData.name}</h2>
                            <span className="badge badge-error badge-lg font-bold">{donorData.blood_group}</span>
                            <p className="text-sm text-gray-500">{donorData.location}</p>
                            <p className="text-sm text-gray-500">{donorData.phone}</p>

                            {/* Availability Toggle */}
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-sm font-medium">Availability:</span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-success"
                                    checked={donorData.availability}
                                    onChange={handleToggleAvailability}
                                />
                            </div>
                            <span className={`badge ${donorData.availability ? 'badge-success' : 'badge-error'} mt-1`}>
                                {donorData.availability ? 'Available' : 'Not Available'}
                            </span>

                            {donorData.verified && (
                                <span className="badge badge-info mt-1">✅ Verified</span>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div className="card bg-red-50 shadow-sm text-center">
                            <div className="card-body py-6">
                                <div className="text-3xl font-bold text-red-600">{donorData.total_donations}</div>
                                <p className="text-gray-600 text-sm">Total Donations</p>
                            </div>
                        </div>
                        <div className="card bg-orange-50 shadow-sm text-center">
                            <div className="card-body py-6">
                                <div className="text-3xl font-bold text-orange-600">{donorData.total_bags_donated}</div>
                                <p className="text-gray-600 text-sm">Bags Donated</p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-sm text-center col-span-2">
                            <div className="card-body py-4">
                                <p className="text-sm text-gray-500">Last Donation</p>
                                <p className="font-semibold">{donorData.last_donation_date || 'Never'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Need Blood button — donor can also request blood */}
                <div className="alert alert-info mb-6">
                    <span>🏥 You can also <Link to="/create-request" className="link font-semibold">request blood</Link> for yourself or someone else!</span>
                </div>

                {/* Matching Requests */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-base-content">
                        🆘 Matching Blood Requests ({matchingReqs.length})
                    </h2>
                    <p className="text-gray-500 text-sm mb-4">
                        আপনার blood group <strong className="text-red-600">{donorData.blood_group}</strong> এর জন্য open request গুলো নিচে দেওয়া হয়েছে।
                    </p>

                    {matchingReqs.length === 0 ? (
                        <div className="text-center py-12 bg-base-100 rounded-2xl">
                            <div className="text-4xl mb-3">✅</div>
                            <p className="text-gray-500">No matching blood requests right now.</p>
                            <p className="text-gray-400 text-sm mt-1">Check back later!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {matchingReqs.map(req => (
                                <div key={req.id}
                                    className={`card bg-base-100 shadow-sm border-l-4 ${req.urgency === 'emergency' ? 'border-red-500' : 'border-orange-300'}`}>
                                    <div className="card-body p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-bold text-lg flex items-center gap-2">
                                                    {req.urgency === 'emergency' && (
                                                        <span className="badge badge-error animate-pulse">🚨 EMERGENCY</span>
                                                    )}
                                                    {req.patient_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    🏥 {req.hospital_name} • 📍 {req.hospital_location}
                                                </p>
                                            </div>
                                            <span className="badge badge-error badge-lg font-bold">{req.blood_group}</span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                                            <div>🩸 {req.required_bags} bag(s)</div>
                                            <div>📅 {req.required_date}</div>
                                            <div>📞 {req.contact_number}</div>
                                        </div>

                                        {req.additional_info && (
                                            <p className="text-sm text-gray-500 mt-2 italic">Note: {req.additional_info}</p>
                                        )}

                                        <div className="mt-3 pt-3 border-t border-base-200">
                                            <button
                                                onClick={() => handleAccept(req.id)}
                                                disabled={actionLoading === req.id}
                                                className="btn btn-error text-white btn-sm"
                                            >
                                                {actionLoading === req.id
                                                    ? <span className="loading loading-spinner loading-xs"></span>
                                                    : '🩸 I Can Donate'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Donation History */}
                {donorData.recent_history?.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold mb-4">📋 Recent Donation History</h2>
                        <div className="card bg-base-100 shadow-sm overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Blood Group</th>
                                        <th>Bags</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donorData.recent_history.map(h => (
                                        <tr key={h.id}>
                                            <td>{h.donated_date}</td>
                                            <td><span className="badge badge-error">{h.blood_group}</span></td>
                                            <td>{h.bags}</td>
                                            <td>{h.hospital_location}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DonorDashboard;
