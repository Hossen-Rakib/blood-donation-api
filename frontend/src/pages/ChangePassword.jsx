import React, { useState } from 'react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

const ChangePassword = () => {
    const [email, setEmail]             = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPw, setConfirmPw]     = useState('');
    const [loading, setLoading]         = useState(false);
    const [done, setDone]               = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        if (!email || !newPassword || !confirmPw) {
            toast.error('Please fill in all fields!');
            return;
        }
        if (newPassword !== confirmPw) {
            toast.error('Passwords do not match!');
            return;
        }
        if (newPassword.length < 4) {
            toast.error('Password must be at least 4 characters!');
            return;
        }

        setLoading(true);
        try {
            await authApi.resetPassword(email, newPassword);
            toast.success('Password reset successfully! Please login again.');
            setDone(true);
        } catch (err) {
            toast.error(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hero bg-base-200 min-h-screen py-6 sm:py-10 px-3 sm:px-4">
            <div className="hero-content flex-col w-full max-w-md p-0">
                <div className="text-center px-2">
                    <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">🔑</div>
                    <h1 className="text-3xl sm:text-4xl font-bold">Reset Password</h1>
                    <p className="py-2 sm:py-4 text-gray-500 text-sm sm:text-base">
                        আপনার email address দিয়ে password reset করুন।
                    </p>
                </div>
                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-xl border border-base-200">
                    <div className="card-body p-4 sm:p-7">
                        {done ? (
                            <div className="text-center py-4">
                                <div className="text-4xl mb-3">✅</div>
                                <p className="font-semibold text-green-600">Password reset successful!</p>
                                <p className="text-sm text-gray-500 mt-2">Please login with your new password.</p>
                                <a href="/login" className="btn btn-error text-white mt-4 w-full">Go to Login</a>
                            </div>
                        ) : (
                            <form onSubmit={handleReset}>
                                <fieldset className="fieldset">
                                    <label className="label">Email Address</label>
                                    <input type="email" className="input w-full" placeholder="your@email.com"
                                        value={email} onChange={(e) => setEmail(e.target.value)} required />

                                    <label className="label">New Password</label>
                                    <input type="password" className="input w-full" placeholder="New password"
                                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />

                                    <label className="label">Confirm Password</label>
                                    <input type="password" className="input w-full" placeholder="Confirm new password"
                                        value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />

                                    <button type="submit" className="btn btn-neutral mt-4 w-full" disabled={loading}>
                                        {loading
                                            ? <span className="loading loading-spinner loading-sm"></span>
                                            : 'Reset Password'}
                                    </button>
                                </fieldset>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
