import { createBrowserRouter } from 'react-router';
import Root from '../layout/Root';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import FindDonors from '../pages/FindDonors';
import DonorProfile from '../pages/DonorProfile';
import OpenRequests from '../pages/OpenRequests';
import PrivateRoutes from './PrivateRoutes';
import UserProfile from '../pages/UserProfile';
import ChangePassword from '../pages/ChangePassword';
import MyBloodRequests from '../pages/MyBloodRequests';
import CreateBloodRequest from '../pages/CreateBloodRequest';
import DonorDashboard from '../pages/DonorDashboard';
import Notifications from '../pages/Notifications';
import AdminLayout from '../layout/AdminLayout';
import AdminProtected from './AdminProtected';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageRequests from '../pages/admin/ManageRequests';
import ManageDonors from '../pages/admin/ManageDonors';
import DonorSignup from '../pages/DonorSignup';
import RequesterSignup from '../pages/RequesterSignup';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Root />,
        children: [
            // ─── Public Routes ───────────────────────────────────────
            { path: '/',                  element: <Home /> },
            { path: '/login',             element: <Login /> },
            { path: '/signup',            element: <Signup /> },
            { path: '/donor-signup',      element: <DonorSignup /> },
            { path: '/requester-signup',  element: <RequesterSignup /> },

            // ─── Protected Routes (Logged-in users only) ─────────────
            {
                path: '/find-donors',
                element: <PrivateRoutes><FindDonors /></PrivateRoutes>,
            },
            {
                path: '/donors/:id',
                element: <PrivateRoutes><DonorProfile /></PrivateRoutes>,
            },
            {
                path: '/open-requests',
                element: <PrivateRoutes><OpenRequests /></PrivateRoutes>,
            },

            // ─── Private Routes (any logged-in user) ─────────────────
            {
                path: '/donor-dashboard',
                element: <PrivateRoutes><DonorDashboard /></PrivateRoutes>,
            },
            {
                path: '/create-request',
                element: <PrivateRoutes><CreateBloodRequest /></PrivateRoutes>,
            },
            {
                path: '/my-requests',
                element: <PrivateRoutes><MyBloodRequests /></PrivateRoutes>,
            },
            {
                path: '/notifications',
                element: <PrivateRoutes><Notifications /></PrivateRoutes>,
            },
            {
                path: '/user/profile',
                element: <PrivateRoutes><UserProfile /></PrivateRoutes>,
            },
            {
                path: '/change-password',
                element: <PrivateRoutes><ChangePassword /></PrivateRoutes>,
            },
        ],
    },

    // ─── Admin Routes ─────────────────────────────────────────────────
    {
        path: '/admin',
        element: <AdminProtected><AdminLayout /></AdminProtected>,
        children: [
            { path: 'dashboard',       element: <AdminDashboard /> },
            { path: 'manage-users',    element: <ManageUsers /> },
            { path: 'manage-requests', element: <ManageRequests /> },
            { path: 'manage-donors',   element: <ManageDonors /> },
        ],
    },
]);

export default router;