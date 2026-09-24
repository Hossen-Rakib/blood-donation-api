import React, { useContext, useEffect, useState } from 'react';
import { baseUrl } from '../services/BaseUrl';
import { AuthContext } from '../context/AuthProvider';
import toast from 'react-hot-toast';

const MyReserve = () => {
    const [myReserve, setMyReserve] = useState([]);
    const [loading, setLoading] = useState(true);
    const { accessToken } = useContext(AuthContext);

    const cancelReserve = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
        try {
            const res = await fetch(`${baseUrl}/reserve/cancel/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Reservation cancelled successfully');
                fetchReservation();
            } else {
                toast.error(data.detail || 'Failed to cancel reservation');
            }
        } catch (err) {
            toast.error('Network error. Failed to reach server.');
        }
    };

    // Fetching Reservation Data
    const fetchReservation = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/reserve/my`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (!res.ok) {
                throw new Error('Failed to fetch reservations');
            }
            const data = await res.json();
            setMyReserve(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // useEffect
    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            return;
        }
        fetchReservation();
    }, [accessToken]);

  

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';

            case 'approved':
                return 'bg-green-100 text-green-700';

            case 'rejected':
                return 'bg-red-100 text-red-700';

            case 'cancelled':
                return 'bg-gray-100 text-gray-700';

            default:
                return 'bg-blue-100 text-blue-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        My Reservations
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Track all your book reservations from here.
                    </p>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : myReserve.length === 0 ? (
                    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-800">
                            No reservations found
                        </h2>

                        <p className="mt-2 text-gray-500">
                            You haven't reserved any books yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5">

                        {myReserve.map((reserve) => (
                            <div
                                key={reserve.id}
                                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                            >
                                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                                    {/* Left */}
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Reservation #{reserve.id}
                                            </h2>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(reserve.status)}`}
                                            >
                                                {reserve.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                                            <div>
                                                <p className="text-sm text-gray-400">
                                                    Book ID
                                                </p>

                                                <p className="font-medium text-gray-800">
                                                    #{reserve.book_id}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-400">
                                                    User ID
                                                </p>

                                                <p className="font-medium text-gray-800">
                                                    #{reserve.user_id}
                                                </p>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="rounded-xl bg-gray-50 px-5 py-4">
                                        <p className="text-sm text-gray-400">
                                            Reservation Date
                                        </p>

                                        <p className="mt-1 font-medium text-gray-800">
                                            {new Date(
                                                reserve.reservation_date
                                            ).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {new Date(
                                                reserve.reservation_date
                                            ).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>

                                </div>

                                {reserve.status === 'pending' && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                        <button
                                            onClick={() => cancelReserve(reserve.id)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
                                        >
                                            Cancel Reservation
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                    </div>
                )}


            </div>
        </div>
    );
};

export default MyReserve;