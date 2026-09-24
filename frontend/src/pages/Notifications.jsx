import React, { useEffect, useState } from 'react';
import { notificationApi } from '../services/api';
import toast from 'react-hot-toast';

const TYPE_ICON = {
    new_request:        '🆘',
    request_accepted:   '✅',
    request_completed:  '🎉',
    admin_alert:        '⚠️',
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const [loading, setLoading]             = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getAll();
            setNotifications(res.notifications || []);
            setUnreadCount(res.unread_count || 0);
        } catch (err) {
            toast.error(err.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read.');
        } catch (err) {
            toast.error(err.message || 'Failed');
        }
    };

    const handleMarkOne = async (id) => {
        try {
            await notificationApi.markRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            // silent
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <span className="loading loading-spinner loading-lg text-red-500"></span>
        </div>
    );

    return (
        <div className="min-h-screen bg-base-200 py-8 px-4">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-base-content">🔔 Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="badge badge-error mt-1">{unreadCount} unread</span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="btn btn-sm btn-outline">
                            Mark all as read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">🔕</div>
                        <p className="text-gray-500 text-lg">No notifications yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => !n.is_read && handleMarkOne(n.id)}
                                className={`card shadow-sm cursor-pointer transition hover:shadow-md
                                    ${n.is_read ? 'bg-base-100' : 'bg-red-50 border-l-4 border-red-400'}`}
                            >
                                <div className="card-body p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl mt-0.5">{TYPE_ICON[n.type] || '📢'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm whitespace-pre-line ${!n.is_read ? 'font-medium' : 'text-gray-600'}`}>
                                                {n.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-400">
                                                    {new Date(n.created_at).toLocaleString()}
                                                </span>
                                                {!n.is_read && (
                                                    <span className="badge badge-xs badge-error">New</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
