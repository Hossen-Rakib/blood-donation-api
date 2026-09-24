import React, { useContext } from 'react';
import { Link } from 'react-router';
import { AuthContext } from '../context/AuthProvider';
import { FaBell, FaTint, FaHandHoldingHeart, FaHospital } from 'react-icons/fa';

const Navbar = () => {
    const { authUser, logout } = useContext(AuthContext);

    return (
        <div className="navbar bg-base-100 shadow-sm">
            <div className="navbar-start">
                {/* Mobile dropdown */}
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg aria-label="Menu" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </div>
                    <ul tabIndex={-1} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow">
                        <li><Link to="/">Home</Link></li>
                        {authUser ? (
                            <>
                                <li><Link to="/find-donors">Find Donors</Link></li>
                                <li><Link to="/open-requests">Blood Requests</Link></li>
                                <li><Link to="/donor-dashboard">🩸 Donate Blood</Link></li>
                                <li><Link to="/create-request">🏥 Need Blood</Link></li>
                                <li><Link to="/my-requests">My Requests</Link></li>
                            </>
                        ) : null}
                    </ul>
                </div>

                {/* Brand */}
                <Link to="/" className="btn btn-ghost text-xl font-bold text-red-600">
                    <FaTint className="text-red-500" /> BloodBridge
                </Link>
            </div>

            {/* Desktop nav links */}
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><Link to="/">Home</Link></li>
                    {authUser ? (
                        <>
                            <li><Link to="/find-donors">Find Donors</Link></li>
                            <li><Link to="/open-requests">Blood Requests</Link></li>
                            <li><Link to="/my-requests">My Requests</Link></li>
                        </>
                    ) : null}
                </ul>
            </div>

            {/* Auth section */}
            <div className="navbar-end gap-2">
                {authUser ? (
                    <div className="flex items-center gap-2">

                        {/* ─── Two main action buttons ─── */}
                        <Link
                            to="/donor-dashboard"
                            className="btn btn-error btn-sm text-white hidden sm:flex items-center gap-1"
                            title="Go to donor dashboard to accept blood requests"
                        >
                            <FaHandHoldingHeart /> Donate
                        </Link>
                        <Link
                            to="/create-request"
                            className="btn btn-info btn-sm text-white hidden sm:flex items-center gap-1"
                            title="Create a new blood request"
                        >
                            <FaHospital /> Need Blood
                        </Link>

                        {/* Notification Bell */}
                        <Link to="/notifications" className="btn btn-ghost btn-circle btn-sm">
                            <FaBell className="text-lg" />
                        </Link>

                        {/* User dropdown */}
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-outline btn-sm m-1">
                                🩸 {authUser?.name?.split(' ')[0] || authUser?.username}
                            </div>
                            <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-sm">
                                {authUser?.role === 'admin' && (
                                    <li><Link to="/admin/dashboard">⚙️ Admin Panel</Link></li>
                                )}
                                {/* Mobile: show both action links inside dropdown */}
                                <li className="sm:hidden"><Link to="/donor-dashboard">🩸 Donate Blood</Link></li>
                                <li className="sm:hidden"><Link to="/create-request">🏥 Need Blood</Link></li>
                                <li><Link to="/user/profile">My Profile</Link></li>
                                <li><Link to="/change-password">Change Password</Link></li>
                                <li>
                                    <button onClick={logout} className="text-red-500">
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                        <Link to="/signup" className="btn btn-error text-white btn-sm">Sign Up</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;