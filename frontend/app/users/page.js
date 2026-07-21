'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useDevUser } from '@/context/DevUserContext';
import { LoadingSpinner } from '@/components/Loading';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { getRoleColor, validateEmail, validateName } from '@/lib/utils';

export default function UsersPage() {
    const { currentUser, canManageUsers } = useDevUser();
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'EMPLOYEE',
        department: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.getUsers();
            setUsers(response.data || []);
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to load users' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.getDepartments();
            setDepartments(response.data || []);
        } catch (error) {
            console.error('Failed to load departments:', error);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!validateName(formData.name)) newErrors.name = 'Name must be at least 2 characters';
        if (!validateEmail(formData.email)) newErrors.email = 'Invalid email address';
        if (!formData.role) newErrors.role = 'Role is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                department: formData.department || null,
            };

            await api.createUser(payload);
            setToast({ type: 'success', message: 'User created successfully' });
            setFormData({ name: '', email: '', role: 'EMPLOYEE', department: '' });
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to create user';
            setToast({ type: 'error', message });
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await api.deleteUser(userId);
            setToast({ type: 'success', message: 'User deleted successfully' });
            fetchUsers();
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to delete user' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Users</h1>
                    <p className="text-slate-400 mt-1">Manage workforce and employees</p>
                </div>
                {canManageUsers && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                        <Plus className="w-4 h-4" />
                        Add User
                    </button>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-900">
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Role</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Department</th>
                                {canManageUsers && <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-750 transition">
                                    <td className="px-6 py-4 text-sm text-white">{user.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{user.email}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{user.department_name || '—'}</td>
                                    {canManageUsers && (
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex gap-2">
                                                {user.role !== 'SUPER_ADMIN' && (
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-1 text-red-400 hover:bg-red-900/20 rounded transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {users.length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-400">
                        No users found
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setErrors({});
                }}
                title="Add New User"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-slate-600'
                                }`}
                            placeholder="John Doe"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-slate-600'
                                }`}
                            placeholder="john@company.com"
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="EMPLOYEE">Employee</option>
                            <option value="DEPT_HEAD" disabled={currentUser.role === 'ADMIN'}>Department Head</option>
                            {currentUser.role === 'SUPER_ADMIN' && <option value="ADMIN">Admin</option>}
                        </select>
                    </div>

                    {/* Department */}
                    {(formData.role === 'DEPT_HEAD' || formData.role === 'EMPLOYEE') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value ? parseInt(e.target.value) : '' })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        >
                            Create User
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setErrors({});
                            }}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
