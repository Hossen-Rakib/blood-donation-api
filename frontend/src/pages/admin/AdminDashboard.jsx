import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getDashboard()
            .then(setStats)
            .catch(err => toast.error(err.message || 'Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <span className="loading loading-spinner loading-lg text-red-500"></span>
        </div>
    );

    const ov = stats?.overview || {};
    const ch = stats?.charts || {};

    return (
        <div className="p-2">
            <h1 className="text-2xl font-bold mb-6 text-base-content">📊 Admin Dashboard</h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Users',        value: ov.total_users,         color: 'bg-blue-50',   text: 'text-blue-600',   icon: '👥' },
                    { label: 'Total Donors',       value: ov.total_donors,        color: 'bg-red-50',    text: 'text-red-600',    icon: '🩸' },
                    { label: 'Active Donors',      value: ov.active_donors,       color: 'bg-green-50',  text: 'text-green-600',  icon: '✅' },
                    { label: 'Blood Requests',     value: ov.blood_requests,      color: 'bg-orange-50', text: 'text-orange-600', icon: '📋' },
                    { label: 'Emergency Req.',     value: ov.emergency_requests,  color: 'bg-red-50',    text: 'text-red-700',    icon: '🚨' },
                    { label: 'Completed',          value: ov.completed_requests,  color: 'bg-green-50',  text: 'text-green-700',  icon: '🎉' },
                    { label: 'Pending',            value: ov.pending_requests,    color: 'bg-yellow-50', text: 'text-yellow-700', icon: '⏳' },
                ].map(card => (
                    <div key={card.label} className={`card ${card.color} shadow-sm`}>
                        <div className="card-body py-5 text-center">
                            <div className="text-2xl">{card.icon}</div>
                            <div className={`text-2xl font-bold ${card.text}`}>{card.value ?? '—'}</div>
                            <p className="text-xs text-gray-500">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Blood Group Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="font-bold mb-3">🩸 Donors by Blood Group</h2>
                        {Object.entries(ch.blood_group_distribution?.donors || {}).length === 0
                            ? <p className="text-gray-400 text-sm">No data</p>
                            : Object.entries(ch.blood_group_distribution?.donors || {}).map(([bg, count]) => (
                                <div key={bg} className="flex items-center gap-3 mb-2">
                                    <span className="badge badge-error w-10 text-center">{bg}</span>
                                    <div className="flex-1 bg-base-200 rounded-full h-3">
                                        <div
                                            className="bg-red-500 h-3 rounded-full"
                                            style={{ width: `${Math.min(100, (count / (ov.total_donors || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-semibold w-6">{count}</span>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="font-bold mb-3">📋 Requests by Blood Group</h2>
                        {Object.entries(ch.blood_group_distribution?.requests || {}).length === 0
                            ? <p className="text-gray-400 text-sm">No data</p>
                            : Object.entries(ch.blood_group_distribution?.requests || {}).map(([bg, count]) => (
                                <div key={bg} className="flex items-center gap-3 mb-2">
                                    <span className="badge badge-error w-10 text-center">{bg}</span>
                                    <div className="flex-1 bg-base-200 rounded-full h-3">
                                        <div
                                            className="bg-orange-400 h-3 rounded-full"
                                            style={{ width: `${Math.min(100, (count / (ov.blood_requests || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-semibold w-6">{count}</span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Emergency vs Normal */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="font-bold mb-3">🚨 Emergency vs Normal</h2>
                        <div className="flex gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">{ch.emergency_vs_normal?.emergency ?? 0}</div>
                                <p className="text-sm text-gray-500">Emergency</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-500">{ch.emergency_vs_normal?.normal ?? 0}</div>
                                <p className="text-sm text-gray-500">Normal</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Locations */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="font-bold mb-3">📍 Top Request Locations</h2>
                        {Object.entries(ch.requests_by_location || {}).slice(0, 5).map(([loc, count]) => (
                            <div key={loc} className="flex justify-between text-sm py-1 border-b border-base-200">
                                <span>{loc}</span>
                                <span className="badge badge-sm">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
