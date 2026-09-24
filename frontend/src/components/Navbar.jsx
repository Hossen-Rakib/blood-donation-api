import React, { useContext } from 'react';
import { Link } from 'react-router';
import { AuthContext } from '../context/AuthProvider';
import { FaBell, FaTint, FaHandHoldingHeart } from 'react-icons/fa';

// Main navigation bar component
const Navbar = () => {
    const { authUser, logout } = useContext(AuthContext);

    return (
        <div className="navbar bg-base-100 shadow-sm px-2 sm:px-4">
            <div className="navbar-start">
                {/* Mobile menu dropdown */}
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm sm:btn-md p-1 sm:p-2 lg:hidden">
                        <svg aria-label="Menu" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </div>
                    <ul tabIndex={-1} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow-lg border border-base-200">
                        <li><Link to="/">Home</Link></li>
                        {authUser ? (
                            <>
                                <li><Link to="/my-requests">My Requests</Link></li>
                                <li><Link to="/donor-dashboard">🩸 Donor Dashboard</Link></li>
                            </>
                        ) : (
                            <>
                                <li><Link to="/login">Login</Link></li>
                                <li><Link to="/signup">Sign Up</Link></li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Brand logo and title */}
                <Link to="/" className="btn btn-ghost px-1 sm:px-3 text-lg sm:text-xl font-bold text-red-600 flex items-center gap-1 sm:gap-2">
                    <FaTint className="text-red-500 text-xl" />
                    <span>BloodBridge</span>
                </Link>
            </div>

            {/* Desktop navigation links */}
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1 font-medium">
                    <li><Link to="/">Home</Link></li>
                    {authUser ? (
                        <>
                            <li><Link to="/my-requests">My Requests</Link></li>
                            <li><Link to="/donor-dashboard">Donor Dashboard</Link></li>
                        </>
                    ) : null}
                </ul>
            </div>

            {/* User auth and actions */}
            <div className="navbar-end gap-1 sm:gap-2">
                {authUser ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Donate button for donors */}
                        <Link
                            to="/donor-dashboard"
                            className="btn btn-error btn-xs sm:btn-sm text-white hidden xs:flex sm:flex items-center gap-1 shadow-sm"
                            title="Go to donor dashboard"
                        >
                            <FaHandHoldingHeart />
                            <span>Donate</span>
                        </Link>

                        {/* Notification bell */}
                        <Link to="/notifications" className="btn btn-ghost btn-circle btn-xs sm:btn-sm" aria-label="Notifications">
                            <FaBell className="text-base sm:text-lg" />
                        </Link>

                        {/* User profile dropdown menu */}
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-outline btn-xs sm:btn-sm max-w-[130px] sm:max-w-[180px] truncate">
                                🩸 {authUser?.name?.split(' ')[0] || authUser?.username}
                            </div>
                            <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-200">
                                {authUser?.role === 'admin' && (
                                    <li><Link to="/admin/dashboard">⚙️ Admin Panel</Link></li>
                                )}
                                <li><Link to="/donor-dashboard">🩸 Donor Dashboard</Link></li>
                                <li><Link to="/user/profile">My Profile</Link></li>
                                <li><Link to="/change-password">Change Password</Link></li>
                                <li>
                                    <button onClick={logout} className="text-red-500 font-semibold">
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-1 sm:gap-2">
                        <Link to="/login" className="btn btn-ghost btn-xs sm:btn-sm">Login</Link>
                        <Link to="/signup" className="btn btn-error text-white btn-xs sm:btn-sm">Sign Up</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;