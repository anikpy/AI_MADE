import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || 'KGKSJDGLKDGDKGDGHDFKJHGKH';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-API-Token': API_TOKEN,
    },
});

export const api = {
    // Users
    getUsers: () => apiClient.get('/users/'),
    createUser: (data) => apiClient.post('/users/', data),
    updateUser: (id, data) => apiClient.put(`/users/${id}/`, data),
    deleteUser: (id) => apiClient.delete(`/users/${id}/`),

    // Departments
    getDepartments: () => apiClient.get('/departments/'),
    createDepartment: (data) => apiClient.post('/departments/', data),
    updateDepartment: (id, data) => apiClient.put(`/departments/${id}/`, data),

    // Tasks
    getTasks: () => apiClient.get('/tasks/'),
    createTask: (data) => apiClient.post('/tasks/', data),
    updateTask: (id, data) => apiClient.patch(`/tasks/${id}/`, data),

    // Daily Logs
    getDailyLogs: () => apiClient.get('/logs/'),
    createDailyLog: (data) => apiClient.post('/logs/', data),

    // Executive Dashboard
    getDashboardMetrics: () => apiClient.get('/dashboard/'),
};

export default apiClient;
