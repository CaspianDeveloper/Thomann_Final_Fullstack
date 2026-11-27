import axios from "axios";

// Yeni backend (Express + PostgreSQL)
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Köhnə JSON API: yalnız flags, slider, countries və s. üçün.
const LEGACY_URL = import.meta.env.VITE_BASE_URL;

// timeout 60 san: Render pulsuz servisi yuxudan təxminən 1 dəqiqəyə oyanır
export const api = axios.create({
    baseURL: API_URL,
    timeout: 60000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLogin = error.config?.url?.includes("/auth/login");
        if (error.response?.status === 401 && !isLogin && localStorage.getItem("token")) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.assign("/register/sign-in");
        };
        return Promise.reject(error);
    },
);


const thommanInstance = axios.create({
    baseURL: LEGACY_URL,
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 60000,
});

export default thommanInstance