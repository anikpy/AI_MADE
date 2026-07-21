'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useDevUser } from '@/context/DevUserContext';
import { LoadingSpinner } from '@/components/Loading';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { Plus, Users, UserCheck } from 'lucide-react';

export default function DepartmentsPage() {
    const { currentUser, canManageDepartments, allUsers } = useDevUser();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        head: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.getDepartments();
            setDepartments(response.data || []);
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to load departments' });
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'Department name must be at least 2 characters';
        }
        if (!formData.head) {
            newErrors.head = 'Department head is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await api.createDepartment({
                name: formData.name,
                head: parseInt(formData.head),
            });
            setToast({ type: 'success', message: 'Department created successfully' });
            setFormData({ name: '', head: '' });
            setIsModalOpen(false);
            fetchDepartments();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to create department';
            setToast({ type: 'error', message });
        }
    };

    // Filter eligible department heads (DEPT_HEAD role)
    const eligibleHeads = allUsers.filter(u => u.role === 'DEPT_HEAD');

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
                    <h1 className="text-3xl font-bold text-white">Departments</h1>
                    <p className="text-slate-400 mt-1">Manage organizational departments</p>
                </div>
                {canManageDepartments && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                        <Plus className="w-4 h-4" />
                        Add Department
                    </button>
                )}
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                    <div
                        key={dept.id}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
                    >
                        {/* Department Name */}
                        <h3 className="text-lg font-semibold text-white mb-4">{dept.name}</h3>

                        {/* Department Head */}
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-700">
                            <UserCheck className="w-4 h-4 text-blue-400" />
                            <div className="text-sm">
                                <p className="text-slate-400">Department Head</p>
                                <p className="text-white font-medium">{dept.head_name || 'Unassigned'}</p>
                            </div>
                        </div>

                        {/* Employee Count */}
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-400" />
                            <div className="text-sm">
                                <p className="text-slate-400">Employees</p>
                                <p className="text-white font-medium">{dept.employee_count || 0}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {departments.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-400">No departments found</p>
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setErrors({});
                }}
                title="Create New Department"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Department Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Department Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-slate-600'
                                }`}
                            placeholder="e.g., Engineering"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Department Head */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Department Head</label>
                        <select
                            value={formData.head}
                            onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.head ? 'border-red-500' : 'border-slate-600'
                                }`}
                        >
                            <option value="">Select a Department Head</option>
                            {eligibleHeads.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                        {errors.head && <p className="text-red-400 text-xs mt-1">{errors.head}</p>}
                        {eligibleHeads.length === 0 && (
                            <p className="text-yellow-400 text-xs mt-1">No department heads available</p>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        >
                            Create Department
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
