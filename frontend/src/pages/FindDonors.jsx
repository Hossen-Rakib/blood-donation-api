import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { publicApi } from '../services/api';
import DonorCard from '../components/DonorCard';
import toast from 'react-hot-toast';
import BANGLADESH_DISTRICTS from '../services/bangladeshLocations';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const FindDonors = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [donors, setDonors] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(false);

    const [bloodGroup, setBloodGroup] = useState(searchParams.get('blood_group') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [availableOnly, setAvailableOnly] = useState(true);
    const [page, setPage] = useState(1);

    const fetchDonors = async (pg = 1) => {
        setLoading(true);
        try {
            const res = await publicApi.searchDonors({
                blood_group: bloodGroup,
                location,
                available_only: availableOnly,
                page: pg,
                page_size: 12,
            });
            setDonors(res.donors || []);
            setPagination(res.pagination || {});
        } catch (err) {
            toast.error(err.message || 'Failed to fetch donors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonors(page);
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchDonors(1);
    };

    return (
        <div className="min-h-screen bg-base-200 py-6 sm:py-8 px-3 sm:px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-6 sm:mb-8 text-center px-2">
                    <h1 className="text-2xl sm:text-4xl font-bold text-red-600">🩸 Find Blood Donors</h1>
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">
                        বাংলাদেশের যেকোনো জেলায় রক্তদাতা খুঁজুন — blood group এবং জেলা দিয়ে filter করুন।
                    </p>
                </div>

                {/* Filter Card */}
                <div className="card bg-base-100 shadow-sm mb-8">
                    <div className="card-body">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="label text-sm font-medium">Blood Group</label>
                                <select className="select select-bordered w-full"
                                    value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                                    <option value="">All Blood Groups</option>
                                    {BLOOD_GROUPS.filter(Boolean).map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label text-sm font-medium">জেলা বা এলাকা (District / Area)</label>
                                <input
                                    type="text"
                                    list="district-list"
                                    className="input input-bordered w-full"
                                    placeholder="জেলা বা এলাকা লিখুন বা বাছাই করুন"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                                <datalist id="district-list">
                                    <option value="">সব জেলা (All Districts)</option>
                                    {BANGLADESH_DISTRICTS.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </datalist>
                            </div>
                            <div className="flex flex-col justify-end gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="checkbox checkbox-error"
                                        checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
                                    <span className="text-sm">Available only</span>
                                </label>
                                <button onClick={handleSearch} className="btn btn-error text-white w-full">
                                    🔍 Search Donors
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="loading loading-spinner loading-lg text-red-500"></span>
                    </div>
                ) : donors.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">😔</div>
                        <p className="text-gray-500 text-lg">No donors found for your criteria.</p>
                        <p className="text-gray-400 text-sm mt-2">Try changing filters or check &apos;All Blood Groups&apos;.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-4">
                            Found <strong>{pagination.total_items || donors.length}</strong> donors
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {donors.map(donor => (
                                <DonorCard key={donor.id} donor={donor} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.total_pages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <button
                                    className="btn btn-sm btn-outline"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    ← Prev
                                </button>
                                <span className="btn btn-sm btn-disabled">
                                    {page} / {pagination.total_pages}
                                </span>
                                <button
                                    className="btn btn-sm btn-outline"
                                    disabled={page >= pagination.total_pages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FindDonors;
