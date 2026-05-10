import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // FormData must set multipart boundary automatically; default JSON Content-Type breaks uploads
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        const h = config.headers;
        if (h?.delete && typeof h.delete === 'function') h.delete('Content-Type');
        else delete h?.['Content-Type'];
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
