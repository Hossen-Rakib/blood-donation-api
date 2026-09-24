import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthProvider';
import { Navigate } from 'react-router';

const AdminProtected = ({ children }) => {

    const { authUser, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!authUser) {
        return <Navigate to="/login" replace />;
    }

    if (authUser?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminProtected;