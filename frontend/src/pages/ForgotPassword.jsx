import React, { useState } from 'react';
import { Link } from 'react-router';
import { baseUrl } from '../services/BaseUrl';
import toast from 'react-hot-toast';

// ─── Step constants ────────────────────────────────────────────────────────
const STEP_EMAIL    = 'email';    // Enter email → get token
const STEP_PASSWORD = 'password'; // Enter new password using token

const ForgotPassword = () => {
    const [step, setStep]               = useState(STEP_EMAIL);
    const [email, setEmail]             = useState('');
    const [token, setToken]             = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading]         = useState(false);

    // ── Step 1: request a reset token ────────────────────────────────────
    const handleRequestToken = async () => {
        if (!email.trim()) {
            toast.error('অনুগ্রহ করে আপনার email দিন!');
            return;
        }

        setLoading(true);
        try {
            const res  = await fetch(`${baseUrl}/auth/forgot-password`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data?.detail || 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।');
                return;
            }

            if (data?.token) {
                // Store token in state (backend returned it directly)
                setToken(data.token);
                toast.success('Reset token পাওয়া গেছে! নতুন password দিন।');
                setStep(STEP_PASSWORD);
            } else {
                // Email not found — backend still returns 200 to avoid leaking
                toast.error('এই email এ কোনো account পাওয়া যায়নি।');
            }
        } catch {
            toast.error('Network error! ইন্টারনেট সংযোগ চেক করুন।');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: reset password using token ───────────────────────────────
    const handleResetPassword = async () => {
        if (!newPassword || !confirmPass) {
            toast.error('সব field পূরণ করুন!');
            return;
        }
        if (newPassword.length < 4) {
            toast.error('Password কমপক্ষে ৪ অক্ষরের হতে হবে!');
            return;
        }
        if (newPassword !== confirmPass) {
            toast.error('Password দুটো মিলছে না!');
            return;
        }

        setLoading(true);
        try {
            const res  = await fetch(`${baseUrl}/auth/reset-password`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ token, new_password: newPassword }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data?.detail || 'Password reset হয়নি। আবার চেষ্টা করুন।');
                return;
            }

            toast.success('Password সফলভাবে পরিবর্তন হয়েছে! এখন login করুন। 🎉');
            // Small delay so toast is visible before navigation
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } catch {
            toast.error('Network error! ইন্টারনেট সংযোগ চেক করুন।');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter') action();
    };

    return (
        <div className="hero bg-base-200 min-h-screen py-6 sm:py-10 px-3 sm:px-4">
            <div className="hero-content flex-col w-full max-w-md p-0">

                {/* Header */}
                <div className="text-center">
                    <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">🔐</div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-red-600">
                        Forgot Password
                    </h1>
                    <p className="py-2 sm:py-4 text-gray-500 text-sm sm:text-base">
                        {step === STEP_EMAIL
                            ? 'আপনার registered email দিন।'
                            : 'নতুন password সেট করুন।'}
                    </p>
                </div>

                {/* Step indicator */}
                <ul className="steps steps-horizontal w-full mb-4 text-xs sm:text-sm">
                    <li className={`step ${step === STEP_EMAIL || step === STEP_PASSWORD ? 'step-error' : ''}`}>
                        Email দিন
                    </li>
                    <li className={`step ${step === STEP_PASSWORD ? 'step-error' : ''}`}>
                        নতুন Password
                    </li>
                </ul>

                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-xl border border-base-200">
                    <div className="card-body p-5 sm:p-8">
                        <fieldset className="fieldset">

                            {/* ── STEP 1 ── */}
                            {step === STEP_EMAIL && (
                                <>
                                    <label className="label">Registered Email</label>
                                    <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, handleRequestToken)}
                                        type="email"
                                        className="input w-full"
                                        placeholder="আপনার email লিখুন"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleRequestToken}
                                        className="btn btn-error text-white mt-4 w-full"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? <span className="loading loading-spinner loading-sm"></span>
                                            : 'Reset Token নিন'}
                                    </button>
                                </>
                            )}

                            {/* ── STEP 2 ── */}
                            {step === STEP_PASSWORD && (
                                <>
                                    <label className="label">নতুন Password</label>
                                    <input
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, handleResetPassword)}
                                        type="password"
                                        className="input w-full"
                                        placeholder="নতুন password (কমপক্ষে ৪ অক্ষর)"
                                        autoFocus
                                    />
                                    <label className="label mt-2">Confirm Password</label>
                                    <input
                                        value={confirmPass}
                                        onChange={(e) => setConfirmPass(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, handleResetPassword)}
                                        type="password"
                                        className="input w-full"
                                        placeholder="আবার password লিখুন"
                                    />
                                    <button
                                        onClick={handleResetPassword}
                                        className="btn btn-error text-white mt-4 w-full"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? <span className="loading loading-spinner loading-sm"></span>
                                            : 'Password Reset করুন'}
                                    </button>

                                    {/* Go back */}
                                    <button
                                        onClick={() => { setStep(STEP_EMAIL); setToken(''); }}
                                        className="btn btn-ghost btn-sm mt-2 w-full text-gray-500"
                                    >
                                        ← আগের step এ যান
                                    </button>
                                </>
                            )}

                            {/* Login link */}
                            <div className="mt-3 text-center">
                                <Link to="/login" className="link link-hover text-sm text-gray-500">
                                    মনে পড়ে গেছে? Login করুন
                                </Link>
                            </div>

                        </fieldset>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
