// Backend API base URL
// .env file এ VITE_API_URL set করা আছে (যেমন: https://your-backend.onrender.com)
// Trailing slash থাকলে তা স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়
const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').trim();
export const baseUrl = rawUrl.replace(/\/+$/, '');