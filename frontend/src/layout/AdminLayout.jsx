import React from 'react';
import { Link, Outlet } from 'react-router';
import { MdDashboard, MdPeople, MdBloodtype } from 'react-icons/md';
import { FaHome, FaClipboardList } from 'react-icons/fa';

const AdminLayout = () => {
    return (
        <div className="drawer lg:drawer-open">
            <input id="my-drawer-4" type="checkbox" className="drawer-toggle inline" />
            <div className="drawer-content">
                {/* Sidebar toggle button (mobile) */}
                <label htmlFor="my-drawer-4" aria-label="open sidebar" className="btn btn-square btn-ghost drawer-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-4">
                        <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                        <path d="M9 4v16"></path>
                        <path d="M14 10l2 2l-2 2"></path>
                    </svg>
                </label>
                {/* Page content */}
                <div className="p-4"><Outlet /></div>
            </div>

            <div className="drawer-side is-drawer-close:overflow-visible">
                <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
                <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">

                    {/* Brand in sidebar */}
                    <div className="px-4 py-5 w-full border-b border-base-300">
                        <span className="font-bold text-red-600 text-lg is-drawer-close:hidden">🩸 Admin Panel</span>
                        <span className="is-drawer-open:hidden text-red-600 text-xl">🩸</span>
                    </div>

                    <ul className="menu w-full grow">
                        <li>
                            <Link to="/admin/dashboard" className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Dashboard">
                                <MdDashboard className="text-lg" />
                                <span className="is-drawer-close:hidden">Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/manage-users" className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Manage Users">
                                <MdPeople className="text-lg" />
                                <span className="is-drawer-close:hidden">Manage Users</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/manage-requests" className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Manage Requests">
                                <FaClipboardList className="text-lg" />
                                <span className="is-drawer-close:hidden">Manage Requests</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/manage-donors" className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Manage Donors">
                                <MdBloodtype className="text-lg" />
                                <span className="is-drawer-close:hidden">Manage Donors</span>
                            </Link>
                        </li>
                        <li className="mt-auto">
                            <Link to="/" className="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Public Home">
                                <FaHome className="text-lg" />
                                <span className="is-drawer-close:hidden">Public Home</span>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;