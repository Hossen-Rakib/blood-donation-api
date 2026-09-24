import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { publicApi } from '../services/api';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaPhoneAlt, FaMapMarkerAlt, FaTint } from 'react-icons/fa';

const DonorProfile = () => {
    const { id } = useParams();
    const [donor, setDonor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        publicApi.getDonorProfile(id)
            .then(setDonor)
            .catch(err => toast.error(err.message || 'Donor not found'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <span className="loading loading-spinner loading-lg text-red-500"></span>
        </div>
    );

    if (!donor) return (
        <div className="text-center py-20">
            <p className="text-2xl text-gray-500">Donor not found.</p>
            <Link to="/find-donors" className="btn btn-error text-white mt-4">← Back to Search</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-base-200 py-6 sm:py-10 px-3 sm:px-4">
            <div className="max-w-2xl mx-auto">

                {/* Profile Card */}
                <div className="card bg-base-100 shadow-lg overflow-hidden border border-base-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500 to-red-700 px-4 sm:px-8 py-6 sm:py-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
                            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shrink-0">
                                {donor.name?.charAt(0)}
                            </div>
                            <div className="text-white">
                                <h2 className="text-xl sm:text-2xl font-bold flex items-center justify-center sm:justify-start gap-2">
                                    {donor.name}
                                    {donor.verified && <FaCheckCircle className="text-green-300 text-base sm:text-lg" title="Verified" />}
                                </h2>
                                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2 flex-wrap">
                                    <span className="badge badge-md sm:badge-lg bg-white text-red-600 font-bold">
                                        <FaTint className="mr-1" /> {donor.blood_group}
                                    </span>
                                    <span className={`badge badge-sm sm:badge-md ${donor.availability ? 'badge-success' : 'badge-error'}`}>
                                        {donor.availability ? 'Available' : 'Not Available'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        {/* Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-base-200 rounded-xl p-4">
                                <p className="text-xs text-gray-500">Location</p>
                                <p className="font-semibold flex items-center gap-1 mt-1">
                                    <FaMapMarkerAlt className="text-red-400" /> {donor.location}
                                </p>
                            </div>
                            <div className="bg-base-200 rounded-xl p-4">
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="font-semibold flex items-center gap-1 mt-1">
                                    <FaPhoneAlt className="text-green-500" /> {donor.phone}
                                </p>
                            </div>
                            <div className="bg-base-200 rounded-xl p-4">
                                <p className="text-xs text-gray-500">Age / Gender</p>
                                <p className="font-semibold mt-1">{donor.age || 'N/A'} / {donor.gender || 'N/A'}</p>
                            </div>
                            <div className="bg-base-200 rounded-xl p-4">
                                <p className="text-xs text-gray-500">Last Donation</p>
                                <p className="font-semibold mt-1">{donor.last_donation_date || 'Never'}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 mt-4 py-4 border-t border-base-200">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{donor.total_donations}</p>
                                <p className="text-xs text-gray-500">Total Donations</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{donor.total_bags_donated}</p>
                                <p className="text-xs text-gray-500">Total Bags</p>
                            </div>
                        </div>

                        {/* Donation History */}
                        {donor.donation_history?.length > 0 && (
                            <div className="mt-4">
                                <h3 className="font-semibold text-base-content mb-3">Donation History</h3>
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Blood Group</th>
                                                <th>Bags</th>
                                                <th>Location</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {donor.donation_history.map(h => (
                                                <tr key={h.id}>
                                                    <td>{h.donated_date}</td>
                                                    <td><span className="badge badge-error badge-sm">{h.blood_group}</span></td>
                                                    <td>{h.bags}</td>
                                                    <td>{h.hospital_location}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <Link to="/find-donors" className="btn btn-outline btn-sm">← Back to Search</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorProfile;
