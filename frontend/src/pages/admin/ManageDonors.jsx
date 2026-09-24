import React, { useEffect, useState } from 'react';
import { adminApi, publicApi } from '../../services/api';
import toast from 'react-hot-toast';

const ManageDonors = () => {
    const [donors, setDonors]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [page, setPage]           = useState(1);
    const [pagination, setPagination] = useState({});
    const [actionId, setActionId]   = useState(null);
    const [bgFilter, setBgFilter]   = useState('');

    const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const fetchDonors = async (pg = 1) => {
        setLoading(true);
        try {
            const res = await publicApi.searchDonors({
                blood_group: bgFilter,
                available_only: false,
                page: pg,
                page_size: 15,
            });
            setDonors(res.donors || []);
            setPagination(res.pagination || {});
        } catch (err) {
            toast.error(err.message || 'Failed to load donors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDonors(page); }, [page, bgFilter]);

    const handleToggleVerify = async (donorId, currentVerified) => {
        setActionId(donorId);
        try {
            const res = await adminApi.toggleDonorVerify(donorId);
            toast.success(res.message);
            setDonors(prev => prev.map(d =>
                d.id === donorId ? { ...d, verified: !currentVerified } : d
            ));
        } catch (err) {
            toast.error(err.message || 'Failed');
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="p-2">
            <h1 className="text-2xl font-bold mb-6">🩸 Manage Donors</h1>

            {/* Filter */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <select className="select select-sm select-bordered" value={bgFilter}
                    onChange={(e) => { setBgFilter(e.target.value); setPage(1); }}>
                    <option value="">All Blood Groups</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <span className="loading loading-spinner loading-lg text-red-500"></span>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="table table-sm bg-base-100 rounded-xl shadow-sm">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Blood Group</th>
                                    <th>Location</th>
                                    <th>Phone</th>
                                    <th>Donations</th>
                                    <th>Available</th>
                                    <th>Verified</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donors.map(d => (
                                    <tr key={d.id}>
                                        <td>#{d.id}</td>
                                        <td className="font-medium">{d.name}</td>
                                        <td><span className="badge badge-error">{d.blood_group}</span></td>
                                        <td>{d.location}</td>
                                        <td>{d.phone}</td>
                                        <td>{d.total_donations}</td>
                                        <td>
                                            <span className={`badge badge-sm ${d.availability ? 'badge-success' : 'badge-error'}`}>
                                                {d.availability ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-sm ${d.verified ? 'badge-info' : 'badge-ghost'}`}>
                                                {d.verified ? '✅ Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleVerify(d.id, d.verified)}
                                                disabled={actionId === d.id}
                                                className={`btn btn-xs ${d.verified ? 'btn-warning' : 'btn-info'}`}>
                                                {actionId === d.id
                                                    ? <span className="loading loading-spinner loading-xs"></span>
                                                    : d.verified ? 'Unverify' : 'Verify'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination.total_pages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <button className="btn btn-sm btn-outline" disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}>← Prev</button>
                            <span className="btn btn-sm btn-disabled">{page} / {pagination.total_pages}</span>
                            <button className="btn btn-sm btn-outline" disabled={page >= pagination.total_pages}
                                onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ManageDonors;
