import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 600000 // 10 minutes
});


// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
