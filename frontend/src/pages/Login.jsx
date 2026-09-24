import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { baseUrl } from '../services/BaseUrl';
import { AuthContext } from '../context/AuthProvider';
import toast from 'react-hot-toast';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const handleLogin = async () => {
        if (!username || !password) {
            toast.error('Please enter username and password!');
            return;
        }

        setLoading(true);

        try {
            // Step 1: Get access token
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const res = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data?.detail || 'Username বা password ভুল!');
                return;
            }

            const accessToken = data?.access_token;
            if (!accessToken) {
                toast.error('Login failed! Please try again.');
                return;
            }

            // Step 2: Save token & fetch user profile
            localStorage.setItem('lm_token', accessToken);

            const userRes = await fetch(`${baseUrl}/user`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const userData = await userRes.json();

            if (userData?.id) {
                loginUser(accessToken, userData);
                toast.success(`Welcome back, ${userData.name}! 🩸`);
                if (userData.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate(from, { replace: true });
                }
            } else {
                toast.error('Could not fetch user profile. Please try again.');
                localStorage.removeItem('lm_token');
            }

        } catch (error) {
            console.error('Login error:', error);
            toast.error('Network error! Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content flex-col">
                <div className="text-center">
                    <div className="text-5xl mb-3">🩸</div>
                    <h1 className="text-4xl font-bold text-red-600">Login</h1>
                    <p className="py-4 text-gray-500">
                        আপনার account এ login করুন।
                    </p>
                </div>
                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                    <div className="card-body">
                        <fieldset className="fieldset">
                            <label className="label">Username / Email</label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={handleKeyDown}
                                type="text"
                                className="input w-full"
                                placeholder="Username বা Email"
                            />
                            <label className="label">Password</label>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                type="password"
                                className="input w-full"
                                placeholder="Password"
                            />
                            <div className="mt-2 space-y-1">
                                <div>
                                    <Link to="/signup" className="link link-hover text-sm">
                                        Don&apos;t have an account? Sign Up
                                    </Link>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    🛡️ Admin? Use your admin credentials to login — you&apos;ll be redirected automatically.
                                </div>
                            </div>
                            <button
                                onClick={handleLogin}
                                className="btn btn-error text-white mt-4 w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </fieldset>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;