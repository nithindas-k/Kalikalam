import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const authService = {
    async login(credentials: any) {
        const response = await axios.post(`${API_URL}/admin/login`, credentials);
        if (response.data.token) {
            localStorage.setItem("admin_token", response.data.token);
            localStorage.setItem("admin_data", JSON.stringify(response.data));
        }
        return response.data;
    },

    async register(data: any) {
        const response = await axios.post(`${API_URL}/admin/register`, data);
        if (response.data.token) {
            localStorage.setItem("admin_token", response.data.token);
            localStorage.setItem("admin_data", JSON.stringify(response.data));
        }
        return response.data;
    },

    async getPendingAdmins() {
        const token = this.getToken();
        const response = await axios.get(`${API_URL}/admin/requests`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    async updateAdminStatus(id: string, status: string) {
        const token = this.getToken();
        const response = await axios.put(`${API_URL}/admin/requests/${id}`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    logout() {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_data");
    },

    getToken() {
        return localStorage.getItem("admin_token");
    },

    getAdminData() {
        const data = localStorage.getItem("admin_data");
        return data ? JSON.parse(data) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem("admin_token");
    }
};
