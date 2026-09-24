import { baseUrl } from './BaseUrl';

// Token helper
export const getAuthToken = () => localStorage.getItem('lm_token');
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('lm_token', token);
    } else {
        localStorage.removeItem('lm_token');
    }
};

// Generic request helper with automatic headers & error parsing
async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = getAuthToken();

    const headers = {
        ...(options.body && !(options.body instanceof FormData || options.body instanceof URLSearchParams)
            ? { 'Content-Type': 'application/json' }
            : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const config = { ...options, headers };

    let response;
    try {
        response = await fetch(url, config);
    } catch (networkError) {
        console.error('Network request failed:', networkError);
        throw new Error('Network error: Server এ connect করা যাচ্ছে না। Internet connection চেক করুন।');
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        try { data = await response.json(); } catch { data = null; }
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        let errorMessage = 'Request failed';
        if (data && typeof data === 'object') {
            if (Array.isArray(data.detail)) {
                errorMessage = data.detail.map(d => d.msg || d).join(', ');
            } else if (data.detail) {
                errorMessage = data.detail;
            } else if (data.message) {
                errorMessage = data.message;
            }
        } else if (typeof data === 'string' && data.length < 200) {
            errorMessage = data;
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

// Auth API Endpoints
export const authApi = {
    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        return request('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        });
    },

    async registerRequester(userData) {
        return request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async getProfile() {
        return request('/user', { method: 'GET' });
    },

    async resetPassword(email, newPassword) {
        return request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, new_password: newPassword }),
        });
    },
};

// Donor API Endpoints
export const donorApi = {
    async register(donorData) {
        return request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(donorData),
        });
    },

    async getMyProfile() {
        return request('/donor/me', { method: 'GET' });
    },

    async updateMyProfile(updates) {
        return request('/donor/me', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },

    async getMatchingRequests(filterByLocation = false) {
        return request(`/donor/matching-requests?filter_by_location=${filterByLocation}`, { method: 'GET' });
    },

    async acceptRequest(requestId) {
        return request(`/donor/requests/${requestId}/accept`, { method: 'PUT' });
    },

    async rejectRequest(requestId) {
        return request(`/donor/requests/${requestId}/reject`, { method: 'PUT' });
    },
};

// Public & Requester API Endpoints
export const publicApi = {
    async searchDonors(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') query.append(k, v);
        });
        return request(`/donors/search?${query.toString()}`, { method: 'GET' });
    },

    async getDonorProfile(donorId) {
        return request(`/donors/${donorId}`, { method: 'GET' });
    },

    async getOpenRequests(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') query.append(k, v);
        });
        return request(`/blood-request/open?${query.toString()}`, { method: 'GET' });
    },

    async getBloodRequestById(requestId) {
        return request(`/blood-request/${requestId}`, { method: 'GET' });
    },
};

export const requesterApi = {
    async createRequest(data) {
        return request('/blood-request', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getMyRequests(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') query.append(k, v);
        });
        return request(`/blood-request/my?${query.toString()}`, { method: 'GET' });
    },

    async markCompleted(requestId) {
        return request(`/blood-request/${requestId}/complete`, { method: 'PUT' });
    },

    async cancelRequest(requestId) {
        return request(`/blood-request/${requestId}`, { method: 'DELETE' });
    },
};

export const notificationApi = {
    async getAll() {
        return request('/notifications', { method: 'GET' });
    },

    async markRead(notifId) {
        return request(`/notifications/${notifId}/read`, { method: 'PUT' });
    },

    async markAllRead() {
        return request('/notifications/read-all', { method: 'PUT' });
    },
};

// Admin API Endpoints
export const adminApi = {
    async getDashboard() {
        return request('/admin/dashboard', { method: 'GET' });
    },

    async getUsers(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') query.append(k, v);
        });
        return request(`/admin/users?${query.toString()}`, { method: 'GET' });
    },

    async toggleUserActive(userId) {
        return request(`/admin/users/${userId}/toggle-active`, { method: 'PUT' });
    },

    async deleteUser(userId) {
        return request(`/admin/users/${userId}`, { method: 'DELETE' });
    },

    async getAllRequests(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') query.append(k, v);
        });
        return request(`/admin/requests/all?${query.toString()}`, { method: 'GET' });
    },

    async updateRequestStatus(requestId, status) {
        return request(`/admin/requests/${requestId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    async deleteRequest(requestId) {
        return request(`/admin/requests/${requestId}`, { method: 'DELETE' });
    },

    async toggleDonorVerify(donorId) {
        return request(`/admin/donors/${donorId}/verify`, { method: 'PUT' });
    },

    async promoteToAdmin(userId) {
        return request(`/admin/users/${userId}/promote-admin`, { method: 'PUT' });
    },

    async demoteAdmin(userId) {
        return request(`/admin/users/${userId}/demote-admin`, { method: 'PUT' });
    },
};

export default {
    auth: authApi,
    donor: donorApi,
    public: publicApi,
    requester: requesterApi,
    notification: notificationApi,
    admin: adminApi,
    request,
};
