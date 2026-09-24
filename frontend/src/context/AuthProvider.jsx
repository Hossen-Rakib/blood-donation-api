import React, { createContext, useEffect, useState } from 'react';
import { baseUrl } from '../services/BaseUrl';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem('lm_token'));
    const [loading, setLoading] = useState(true);

    const fetchUser = async (token) => {
        try {
            const userRes = await fetch(`${baseUrl}/user`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!userRes.ok) {
                localStorage.removeItem('lm_token');
                setAccessToken(null);
                setAuthUser(null);
                return;
            }

            const userData = await userRes.json();
            setAuthUser(userData);
        } catch (error) {
            console.error('Auth fetch error:', error);
            setAuthUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!accessToken) {
            setAuthUser(null);
            setLoading(false);
            return;
        }
        fetchUser(accessToken);
    }, [accessToken]);

    const loginUser = (token, user) => {
        localStorage.setItem('lm_token', token);
        setAccessToken(token);
        if (user) setAuthUser(user);
    };

    const logout = () => {
        localStorage.removeItem('lm_token');
        setAccessToken(null);
        setAuthUser(null);
    };

    const updateAuthUser = (updatedData) => {
        setAuthUser(prev => prev ? { ...prev, ...updatedData } : updatedData);
    };

    return (
        <AuthContext.Provider value={{
            authUser,
            setAuthUser,
            updateAuthUser,
            loginUser,
            logout,
            accessToken,
            loading,
            refetchUser: () => accessToken && fetchUser(accessToken),
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;