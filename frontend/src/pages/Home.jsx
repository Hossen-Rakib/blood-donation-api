import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FaTint, FaHandHoldingHeart, FaSearch, FaHospital, FaArrowRight, FaLock } from 'react-icons/fa';
import { AuthContext } from '../context/AuthProvider';
import { publicApi } from '../services/api';
import DonorCard from '../components/DonorCard';

const Home = () => {
    const { authUser } = useContext(AuthContext);
    const [recentDonors, setRecentDonors] = useState([]);
    const [loadingDonors, setLoadingDonors] = useState(false);

    useEffect(() => {
        if (authUser) {
            setLoadingDonors(true);
            publicApi.searchDonors({ page: 1, page_size: 6, available_only: true })
                .then(res => setRecentDonors(res.donors || []))
                .catch(err => console.error('Failed to load donors on home:', err))
                .finally(() => setLoadingDonors(false));
        }
    }, [authUser]);

    return (
        <div>
            {/* Hero Section */}
            <div className="hero bg-gradient-to-br from-red-50 to-red-100 min-h-[55vh] sm:min-h-[60vh] py-8 sm:py-12 px-4">
                <div className="hero-content text-center flex-col max-w-2xl mx-auto px-2">
                    <div className="text-5xl sm:text-6xl mb-2 sm:mb-4">🩸</div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-red-700 leading-tight">
                        Save a Life Today
                    </h1>
                    <p className="py-3 sm:py-4 text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
                        বাংলাদেশের যেকোনো জেলায় রক্তদাতা খুঁজুন অথবা রক্তের অনুরোধ করুন। 
                        প্রতিটি রক্তদান একটি জীবন বাঁচাতে পারে।
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-stretch sm:items-center w-full max-w-md sm:max-w-none pt-2">
                        {authUser ? (
                            <>
                                <Link to="/find-donors" className="btn btn-error text-white btn-md sm:btn-lg shadow-md flex items-center justify-center gap-2">
                                    <FaSearch /> Find Donors
                                </Link>
                                <Link to="/open-requests" className="btn btn-outline btn-error btn-md sm:btn-lg flex items-center justify-center gap-2">
                                    <FaTint /> Blood Requests
                                </Link>
                                <Link to="/create-request" className="btn btn-neutral btn-md sm:btn-lg text-white flex items-center justify-center gap-2">
                                    <FaHospital /> Need Blood
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-error text-white btn-md sm:btn-lg shadow-md flex items-center justify-center gap-2">
                                    <FaLock className="mr-1" /> Login
                                </Link>
                                <Link to="/signup" className="btn btn-outline btn-error btn-md sm:btn-lg flex items-center justify-center gap-2">
                                    <FaHandHoldingHeart /> Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-12 bg-base-100">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-8 text-base-content">
                        Why BloodBridge?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card bg-red-50 shadow-sm text-center">
                            <div className="card-body">
                                <div className="text-4xl">🩸</div>
                                <h3 className="text-2xl font-bold text-red-600">500+</h3>
                                <p className="text-gray-600">Registered Donors</p>
                            </div>
                        </div>
                        <div className="card bg-green-50 shadow-sm text-center">
                            <div className="card-body">
                                <div className="text-4xl">✅</div>
                                <h3 className="text-2xl font-bold text-green-600">300+</h3>
                                <p className="text-gray-600">Successful Donations</p>
                            </div>
                        </div>
                        <div className="card bg-blue-50 shadow-sm text-center">
                            <div className="card-body">
                                <div className="text-4xl">🏥</div>
                                <h3 className="text-2xl font-bold text-blue-600">50+</h3>
                                <p className="text-gray-600">Hospitals Covered</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Available Donors Preview Section (When Logged In) */}
            {authUser ? (
                <div className="py-12 bg-base-100 border-t border-base-200">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-red-600 flex items-center gap-2">
                                    🩸 Available Blood Donors
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    বর্তমানে সক্রিয় ও রক্তদানে প্রস্তুত ডোনারগণ
                                </p>
                            </div>
                            <Link to="/find-donors" className="btn btn-error text-white btn-sm flex items-center gap-1 self-start sm:self-auto">
                                View All Donors <FaArrowRight />
                            </Link>
                        </div>

                        {loadingDonors ? (
                            <div className="flex justify-center py-12">
                                <span className="loading loading-spinner loading-lg text-red-500"></span>
                            </div>
                        ) : recentDonors.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No donors currently available.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {recentDonors.map(donor => (
                                    <DonorCard key={donor.id} donor={donor} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Blood Group Guide */}
            <div className="py-12 bg-base-200">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-8 text-base-content">
                        Blood Group Compatibility
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <Link
                                key={bg}
                                to={authUser ? `/find-donors?blood_group=${encodeURIComponent(bg)}` : '/login'}
                                className="card bg-base-100 shadow-sm hover:shadow-md transition text-center cursor-pointer"
                            >
                                <div className="card-body py-5">
                                    <div className="text-3xl font-bold text-red-600">{bg}</div>
                                    <p className="text-xs text-gray-500">Find {bg} Donor</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-16 bg-red-600 text-white text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to Save a Life?</h2>
                <p className="mb-6 text-red-100">
                    Register as a donor today and help someone in need.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
                    {authUser ? (
                        <>
                            <Link to="/donor-dashboard" className="btn bg-white text-red-600 hover:bg-red-50 btn-md sm:btn-lg shadow-md font-bold">
                                🩸 My Donor Dashboard
                            </Link>
                            <Link to="/create-request" className="btn btn-outline border-white text-white hover:bg-white hover:text-red-600 btn-md sm:btn-lg">
                                🏥 Create Blood Request
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/signup" className="btn bg-white text-red-600 hover:bg-red-50 btn-md sm:btn-lg shadow-md font-bold">
                                🩸 Sign Up as Donor
                            </Link>
                            <Link to="/login" className="btn btn-outline border-white text-white hover:bg-white hover:text-red-600 btn-md sm:btn-lg">
                                Login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;