import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// On 401 — try to refresh; on second failure redirect to /login
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
    failedQueue = [];
};

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                })
                .catch((e) => Promise.reject(e));
        }

        original._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = getRefreshToken();
            if (!refreshToken) throw new Error("No refresh token");

            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                {},
                { headers: { Authorization: `Bearer ${refreshToken}` } }
            );
            const newAccess: string = data.access_token;
            setTokens(newAccess, refreshToken);
            processQueue(null, newAccess);
            original.headers.Authorization = `Bearer ${newAccess}`;
            return api(original);
        } catch (err) {
            processQueue(err, null);
            clearTokens();
            if (typeof window !== "undefined") window.location.href = "/login";
            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
