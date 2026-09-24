import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'donor_found', 'donor_accepted', 'donation_completed', 'request_closed', 'cancelled'];

const STATUS_BADGE = {
    pending:            'badge-warning',
    donor_found:        'badge-info',
    donor_accepted:     'badge-primary',
    donation_completed: 'badge-success',
    cancelled:          'badge-error',
    request_closed:     'badge-neutral',
};

const ManageRequests = () => {
    const [requests, setRequests]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [statusFilter, setStatus] = useState('');
    const [urgFilter, setUrgency]   = useState('');
    const [actionId, setActionId]   = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getAllRequests({ status: statusFilter, urgency: urgFilter });
            setRequests(Array.isArray(res) ? res : []);
        } catch (err) {
            toast.error(err.message || 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [statusFilter, urgFilter]);

    const handleUpdateStatus = async (reqId, newStatus) => {
        setActionId(reqId);
        try {
            await adminApi.updateRequestStatus(reqId, newStatus);
            toast.success(`Status updated to "${newStatus}"`);
            fetchRequests();
        } catch (err) {
            toast.error(err.message || 'Failed');
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (reqId) => {
        if (!confirm('Delete this blood request? (Spam/Fake removal)')) return;
        setActionId(reqId);
        try {
            await adminApi.deleteRequest(reqId);
            toast.success('Request deleted.');
            fetchRequests();
        } catch (err) {
            toast.error(err.message || 'Failed');
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="p-2">
            <h1 className="text-2xl font-bold mb-6">📋 Manage Blood Requests</h1>

            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <select className="select select-sm select-bordered" value={statusFilter}
                    onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <select className="select select-sm select-bordered" value={urgFilter}
                    onChange={(e) => setUrgency(e.target.value)}>
                    <option value="">All Urgency</option>
                    <option value="emergency">🚨 Emergency</option>
                    <option value="normal">Normal</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <span className="loading loading-spinner loading-lg text-red-500"></span>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No blood requests found.</div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => (
                        <div key={req.id}
                            className={`card bg-base-100 shadow-sm border-l-4 ${req.urgency === 'emergency' ? 'border-red-500' : 'border-orange-300'}`}>
                            <div className="card-body p-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold flex items-center gap-2">
                                            {req.urgency === 'emergency' && <span className="badge badge-error badge-sm">🚨</span>}
                                            #{req.id} — {req.patient_name}
                                        </h3>
                                        <p className="text-sm text-gray-500">🏥 {req.hospital_name} • 📍 {req.hospital_location}</p>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="badge badge-error font-bold">{req.blood_group}</span>
                                        <span className={`badge ${STATUS_BADGE[req.status] || 'badge-neutral'}`}>
                                            {req.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mt-3 items-center">
                                    {/* Status update select */}
                                    <select
                                        className="select select-bordered select-xs"
                                        defaultValue={req.status}
                                        onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                                        disabled={actionId === req.id}
                                    >
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleDelete(req.id)}
                                        disabled={actionId === req.id}
                                        className="btn btn-xs btn-error text-white">
                                        {actionId === req.id
                                            ? <span className="loading loading-spinner loading-xs"></span>
                                            : '🗑️ Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageRequests;
