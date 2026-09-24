import React from 'react';
import { Link } from 'react-router';
import { FaCheckCircle, FaPhoneAlt, FaMapMarkerAlt, FaTint } from 'react-icons/fa';

const BLOOD_GROUP_COLORS = {
    'A+': 'badge-error', 'A-': 'badge-warning',
    'B+': 'badge-info', 'B-': 'badge-primary',
    'AB+': 'badge-accent', 'AB-': 'badge-secondary',
    'O+': 'badge-success', 'O-': 'badge-neutral',
};

const DonorCard = ({ donor }) => {
    return (
        <div className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition">
            <div className="card-body p-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">
                            {donor.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base-content">{donor.name}</h3>
                            <p className="text-xs text-base-content/60">{donor.gender || 'N/A'} {donor.age ? `• ${donor.age} yrs` : ''}</p>
                        </div>
                    </div>
                    {/* Blood Group Badge */}
                    <span className={`badge badge-lg font-bold ${BLOOD_GROUP_COLORS[donor.blood_group] || 'badge-neutral'}`}>
                        <FaTint className="mr-1 text-xs" />
                        {donor.blood_group}
                    </span>
                </div>

                {/* Info */}
                <div className="mt-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-base-content/70">
                        <FaMapMarkerAlt className="text-red-400 shrink-0" />
                        <span>{donor.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-base-content/70">
                        <FaPhoneAlt className="text-green-500 shrink-0" />
                        <span>{donor.phone}</span>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-4 mt-3 text-xs text-base-content/60">
                    <span>🩸 {donor.total_donations || 0} donations</span>
                    <span>Last: {donor.last_donation_date || 'Never'}</span>
                </div>

                {/* Footer badges */}
                <div className="card-actions justify-between items-center mt-3 pt-3 border-t border-base-200">
                    <div className="flex gap-2">
                        <span className={`badge badge-sm ${donor.availability ? 'badge-success' : 'badge-error'}`}>
                            {donor.availability ? 'Available' : 'Not Available'}
                        </span>
                        {donor.verified && (
                            <span className="badge badge-sm badge-info flex items-center gap-1">
                                <FaCheckCircle className="text-xs" /> Verified
                            </span>
                        )}
                    </div>
                    <Link to={`/donors/${donor.id}`} className="btn btn-xs btn-outline btn-error">
                        View Profile
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DonorCard;
