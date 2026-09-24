import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { requesterApi } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
    pending: 'badge-warning',
    donor_found: 'badge-info',
    donor_accepted: 'badge-primary',
    donation_completed: 'badge-success',
    cancelled: 'badge-error',
    request_closed: 'badge-neutral',
};

const MyBloodRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [page, setPage] = useState(1);

    const fetchMyRequests = async (pg = 1) => {
        setLoading(true);
        try {
            const res = await requesterApi.getMyRequests({ page: pg, page_size: 10 });
            setRequests(res.requests || []);
            setPagination(res.pagination || {});
        } catch (err) {
            toast.error(err.message || 'Failed to load your requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyRequests(page); }, [page]);

    const handleComplete = async (reqId) => {
        if (!confirm('Mark this request as donation completed?')) return;
        try {
            await requesterApi.markCompleted(reqId);
            toast.success('Marked as donation completed!');
            fetchMyRequests(page);
        } catch (err) {
            toast.error(err.message || 'Failed');
        }
    };

    const handleCancel = async (reqId) => {
        if (!confirm('Are you sure you want to cancel this request?')) return;
        try {
            await requesterApi.cancelRequest(reqId);
            toast.success('Request cancelled.');
            fetchMyRequests(page);
        } catch (err) {
            toast.error(err.message || 'Failed');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <span className="loading loading-spinner loading-lg text-red-500"></span>
        </div>
    );

    return (
        <div className="min-h-screen bg-base-200 py-6 sm:py-8 px-3 sm:px-4">
            <div className="max-w-5xl mx-auto">

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-base-content">My Blood Requests</h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">আপনার সমস্ত blood request এর তালিকা।</p>
                    </div>
                    <Link to="/create-request" className="btn btn-error text-white btn-sm sm:btn-md">
                        + New Request
                    </Link>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-gray-500 text-lg">You haven&apos;t made any blood requests yet.</p>
                        <Link to="/create-request" className="btn btn-error text-white mt-4 btn-sm sm:btn-md">
                            Create First Request
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(req => (
                            <div key={req.id} className={`card bg-base-100 shadow-sm border-l-4 ${req.urgency === 'emergency' ? 'border-red-500' : 'border-orange-300'}`}>
                                <div className="card-body p-4 sm:p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-bold text-base sm:text-lg">
                                                {req.urgency === 'emergency' && <span className="badge badge-error mr-2">🚨</span>}
                                                {req.title || `${req.blood_group} Blood Request`}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-500">Patient: <strong>{req.patient_name}</strong> • #{req.id}</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="badge badge-error font-bold">{req.blood_group}</span>
                                            <span className={`badge ${STATUS_BADGE[req.status] || 'badge-neutral'}`}>
                                                {req.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-sm text-gray-600">
                                        <div>🏥 {req.hospital_name}</div>
                                        <div>📍 {req.hospital_location}</div>
                                        <div>📅 {req.required_date}</div>
                                        <div>🩸 {req.required_bags} bag(s)</div>
                                        <div>📞 {req.contact_number}</div>
                                    </div>

                                    {/* Accepted Donor Info */}
                                    {req.accepted_donor && (
                                        <div className="mt-3 p-3 bg-green-50 rounded-xl text-sm border border-green-200">
                                            <p className="font-semibold text-green-700">✅ Donor Found!</p>
                                            <p>Name: <strong>{req.accepted_donor.name}</strong></p>
                                            <p>Phone: <strong>{req.accepted_donor.phone}</strong></p>
                                            <p>Blood Group: <strong>{req.accepted_donor.blood_group}</strong></p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-base-200">
                                        {req.status === 'donor_accepted' && (
                                            <button onClick={() => handleComplete(req.id)}
                                                className="btn btn-success btn-sm text-white">
                                                ✅ Mark Completed
                                            </button>
                                        )}
                                        {req.status === 'pending' && (
                                            <button onClick={() => handleCancel(req.id)}
                                                className="btn btn-outline btn-error btn-sm">
                                                ❌ Cancel
                                            </button>
                                        )}
                                    </div>
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

export default MyBloodRequests;
