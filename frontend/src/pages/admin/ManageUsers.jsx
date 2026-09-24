import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

const ManageUsers = () => {
    const [users, setUsers]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage]           = useState(1);
    const [pagination, setPagination] = useState({});
    const [actionId, setActionId]   = useState(null);

    const fetchUsers = async (pg = 1) => {
        setLoading(true);
        try {
            const res = await adminApi.getUsers({ role: roleFilter, page: pg, page_size: 15 });
            setUsers(res.users || []);
            setPagination(res.pagination || {});
        } catch (err) {
            toast.error(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(page); }, [page, roleFilter]);

    const handleToggleActive = async (userId) => {
        setActionId(userId);
        try {
            const res = await adminApi.toggleUserActive(userId);
            toast.success(res.message);
            fetchUsers(page);
        } catch (err) {
            toast.error(err.message || 'Failed');
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (userId, username) => {
        if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
        setActionId(userId);
        try {
            await adminApi.deleteUser(userId);
            toast.success('User deleted.');
            fetchUsers(page);
        } catch (err) {
            toast.error(err.message || 'Failed');
        } finally {
            setActionId(null);
        }
    };

    const handlePromoteAdmin = async (userId, username) => {
        if (!confirm(`Make "${username}" an Admin? They will have full admin privileges.`)) return;
        setActionId(userId);
        try {
            const res = await adminApi.promoteToAdmin(userId);
            toast.success(res.message);
            fetchUsers(page);
        } catch (err) {
            toast.error(err.message || 'Failed');
        } finally {
            setActionId(null);
        }
    };

    const handleDemoteAdmin = async (userId, username) => {
        if (!confirm(`Remove admin role from "${username}"?`)) return;
        setActionId(userId);
        try {
            const res = await adminApi.demoteAdmin(userId);
            toast.success(res.message);
            fetchUsers(page);
        } catch (err) {
            toast.error(err.message || 'Failed');
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="p-2">
            <h1 className="text-2xl font-bold mb-6">👥 Manage Users</h1>

            {/* Filter */}
            <div className="flex gap-3 mb-6 flex-wrap">
                {['', 'donor', 'requester', 'admin'].map(r => (
                    <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
                        className={`btn btn-sm ${roleFilter === r ? 'btn-error text-white' : 'btn-outline'}`}>
                        {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                ))}
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
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>#{u.id}</td>
                                        <td className="font-medium">{u.name}</td>
                                        <td className="text-sm text-gray-500">{u.email}</td>
                                        <td>{u.phone}</td>
                                        <td>
                                            <span className={`badge badge-sm ${u.role === 'admin' ? 'badge-neutral' : u.role === 'donor' ? 'badge-error' : 'badge-info'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>{u.location}</td>
                                        <td>
                                            <span className={`badge badge-sm ${u.is_active ? 'badge-success' : 'badge-error'}`}>
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2 flex-wrap">
                                                {u.role !== 'admin' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleToggleActive(u.id)}
                                                            disabled={actionId === u.id}
                                                            className={`btn btn-xs ${u.is_active ? 'btn-warning' : 'btn-success'}`}>
                                                            {actionId === u.id
                                                                ? <span className="loading loading-spinner loading-xs"></span>
                                                                : u.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            onClick={() => handlePromoteAdmin(u.id, u.username)}
                                                            disabled={actionId === u.id}
                                                            className="btn btn-xs btn-neutral text-white">
                                                            🛡️ Make Admin
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u.id, u.username)}
                                                            disabled={actionId === u.id}
                                                            className="btn btn-xs btn-error text-white">
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                                {u.role === 'admin' && (
                                                    <button
                                                        onClick={() => handleDemoteAdmin(u.id, u.username)}
                                                        disabled={actionId === u.id}
                                                        className="btn btn-xs btn-outline btn-warning">
                                                        Remove Admin
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
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

export default ManageUsers;
