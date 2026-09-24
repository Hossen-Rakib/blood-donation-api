import React, { useEffect, useState } from 'react';
import { publicApi } from '../services/api';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import BANGLADESH_DISTRICTS from '../services/bangladeshLocations';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const STATUS_BADGE = {
    pending: 'badge-warning',
    donor_found: 'badge-info',
    donor_accepted: 'badge-primary',
    donation_completed: 'badge-success',
    cancelled: 'badge-error',
    request_closed: 'badge-neutral',
};

const OpenRequests = () => {
    const [requests, setRequests] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(false);
    const [bloodGroup, setBloodGroup] = useState('');
    const [location, setLocation] = useState('');
    const [urgency, setUrgency] = useState('');
    const [page, setPage] = useState(1);

    const fetchRequests = async (pg = 1) => {
        setLoading(true);
        try {
            const res = await publicApi.getOpenRequests({
                blood_group: bloodGroup,
                location,
                urgency,
                page: pg,
                page_size: 10,
                sort_by: 'urgency',
                sort_order: 'desc',
            });
            setRequests(res.requests || []);
            setPagination(res.pagination || {});
        } catch (err) {
            toast.error(err.message || 'Failed to fetch blood requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(page); }, [page]);

    const handleSearch = () => { setPage(1); fetchRequests(1); };

    return (
        <div className="min-h-screen bg-base-200 py-6 sm:py-8 px-3 sm:px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-6 sm:mb-8 text-center px-2">
                    <h1 className="text-2xl sm:text-4xl font-bold text-red-600">🆘 Open Blood Requests</h1>
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">
                        বাংলাদেশে রক্তের চাহিদা রয়েছে — আপনি সাহায্য করতে পারেন!
                    </p>
                    <Link to="/create-request" className="btn btn-error text-white mt-4 btn-sm sm:btn-md">
                        + Create Blood Request
                    </Link>
                </div>

                {/* Filter */}
                <div className="card bg-base-100 shadow-sm mb-6">
                    <div className="card-body">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <select className="select select-bordered w-full" value={bloodGroup}
                                onChange={(e) => setBloodGroup(e.target.value)}>
                                <option value="">All Blood Groups</option>
                                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                            <div className="w-full">
                                <input
                                    type="text"
                                    list="requests-district-list"
                                    className="input input-bordered w-full"
                                    placeholder="জেলা বা এলাকা লিখুন বা বাছাই করুন"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                                <datalist id="requests-district-list">
                                    <option value="">All Areas</option>
                                    {BANGLADESH_DISTRICTS.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </datalist>
                            </div>
                            <select className="select select-bordered w-full" value={urgency}
                                onChange={(e) => setUrgency(e.target.value)}>
                                <option value="">All Urgency</option>
                                <option value="emergency">🚨 Emergency</option>
                                <option value="normal">Normal</option>
                            </select>
                            <button onClick={handleSearch} className="btn btn-error text-white w-full">
                                🔍 Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="loading loading-spinner loading-lg text-red-500"></span>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="text-gray-500 text-lg">No open blood requests right now.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(req => (
                            <div key={req.id} className={`card bg-base-100 shadow-sm border-l-4 ${req.urgency === 'emergency' ? 'border-red-500' : 'border-orange-300'}`}>
                                <div className="card-body p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-bold text-lg flex items-center gap-2">
                                                {req.urgency === 'emergency' && <span className="badge badge-error animate-pulse">🚨 EMERGENCY</span>}
                                                {req.title || `${req.blood_group} Blood Needed`}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">Patient: <strong>{req.patient_name}</strong></p>
                                        </div>
                                        <span className="badge badge-error badge-lg font-bold">{req.blood_group}</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-3 text-sm text-gray-600">
                                        <div>🏥 <strong>{req.hospital_name}</strong></div>
                                        <div>📍 {req.hospital_location}</div>
                                        <div>📅 {req.required_date}</div>
                                        <div>🩸 {req.required_bags} bag(s) needed</div>
                                        <div>📞 {req.contact_number}</div>
                                        <div>
                                            <span className={`badge badge-sm ${STATUS_BADGE[req.status] || 'badge-neutral'}`}>
                                                {req.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {req.additional_info && (
                                        <p className="text-sm text-gray-500 mt-2 italic">
                                            Note: {req.additional_info}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button className="btn btn-sm btn-outline" disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <span className="btn btn-sm btn-disabled">{page} / {pagination.total_pages}</span>
                                <button className="btn btn-sm btn-outline" disabled={page >= pagination.total_pages}
                                    onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpenRequests;
