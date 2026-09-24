// Backend API base URL
const rawUrl = (import.meta.env.VITE_API_URL || 'https://blood-donation-api-7hdg.onrender.com').trim();
export const baseUrl = rawUrl.replace(/\/+$/, '');