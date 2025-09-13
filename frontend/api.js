// frontend/src/api.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
    baseURL: BASE,
    headers: { "Content-Type": "application/json" },
});


// convenience exports (adjust names to your backend)
export const createUser = (username) => api.post("/users/", { name: username });
export const listUsers = () => api.get("/users/");
export const createExpense = (payload) => api.post("/expenses/", payload);
export const listExpensesByUser = (userId) => api.get(`/expenses/?user_id=${userId}`);
export const getAnalytics = (userId, dateFrom, dateTo) => {
    let url = `/analytics/${userId}`;
    if (dateFrom || dateTo) {
        const params = new URLSearchParams();
        if (dateFrom) params.append("date_from", dateFrom);
        if (dateTo) params.append("date_to", dateTo);
        url += `?${params.toString()}`;
    }
    return api.get(url);
};


export default api;