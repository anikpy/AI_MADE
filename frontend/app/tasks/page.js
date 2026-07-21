'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useDevUser } from '@/context/DevUserContext';
import { LoadingSpinner } from '@/components/Loading';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { Plus, Calendar, User, ChevronDown } from 'lucide-react';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function TasksPage() {
    const { currentUser, canCreateTasks, isDeptHead, isDepartmentOf, allUsers } = useDevUser();
    const [tasks, setTasks] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        department: '',
        assigned_to: '',
        due_date: '',
        status: 'TODO',
    });
    const [errors, setErrors] = useState({});
    const [updatingTaskId, setUpdatingTaskId] = useState(null);

    useEffect(() => {
        fetchTasks();
        fetchDepartments();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.getTasks();
            setTasks(response.data || []);
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to load tasks' });
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
        if (!formData.title || formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        }
        if (!formData.department) {
            newErrors.department = 'Department is required';
        }
        if (!formData.assigned_to) {
            newErrors.assigned_to = 'Assigned employee is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await api.createTask({
                title: formData.title,
                description: formData.description,
                department: parseInt(formData.department),
                assigned_to: parseInt(formData.assigned_to),
                due_date: formData.due_date || null,
                status: 'TODO',
            });
            setToast({ type: 'success', message: 'Task created successfully' });
            setFormData({
                title: '',
                description: '',
                department: '',
                assigned_to: '',
                due_date: '',
                status: 'TODO',
            });
            setIsModalOpen(false);
            fetchTasks();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to create task';
            setToast({ type: 'error', message });
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        setUpdatingTaskId(taskId);
        try {
            await api.updateTask(taskId, { status: newStatus });
            setToast({ type: 'success', message: 'Task status updated' });
            fetchTasks();
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to update task status' });
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const getAvailableEmployees = (deptId) => {
        if (!deptId) return [];
        return allUsers.filter(
            u => u.role === 'EMPLOYEE' && u.department === parseInt(deptId)
        );
    };

    const kanbanColumns = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
    const filteredTasks = tasks.filter(task => {
        if (currentUser.role === 'EMPLOYEE') {
            return task.assigned_to === currentUser.id;
        }
        if (isDeptHead) {
            return task.department === currentUser.department;
        }
        return true;
    });

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
                    <h1 className="text-3xl font-bold text-white">Tasks</h1>
                    <p className="text-slate-400 mt-1">Manage and track work assignments</p>
                </div>
                {canCreateTasks && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                        <Plus className="w-4 h-4" />
                        Create Task
                    </button>
                )}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {kanbanColumns.map((status) => (
                    <div key={status} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                        {/* Column Header */}
                        <h2 className={`text-sm font-semibold mb-4 pb-2 border-b border-slate-700 ${getStatusColor(status)}`}>
                            {getStatusLabel(status)}
                        </h2>

                        {/* Tasks */}
                        <div className="space-y-3">
                            {filteredTasks
                                .filter((task) => task.status === status)
                                .map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition"
                                    >
                                        {/* Title */}
                                        <h3 className="font-semibold text-white mb-2">{task.title}</h3>

                                        {/* Description */}
                                        {task.description && (
                                            <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                                                {task.description}
                                            </p>
                                        )}

                                        {/* Metadata */}
                                        <div className="space-y-1 mb-3 text-xs text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3" />
                                                <span>{task.assigned_to_name}</span>
                                            </div>
                                            {task.due_date && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formatDate(task.due_date)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Dropdown */}
                                        <div className="relative pt-2 border-t border-slate-600">
                                            <select
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                disabled={updatingTaskId === task.id}
                                                className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                            >
                                                {kanbanColumns.map((s) => (
                                                    <option key={s} value={s}>
                                                        {getStatusLabel(s)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Empty State */}
                        {filteredTasks.filter((task) => task.status === status).length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <p className="text-sm">No tasks</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setErrors({});
                }}
                title="Create New Task"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-slate-600'
                                }`}
                            placeholder="Task title"
                        />
                        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Task details"
                            rows="3"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                        <select
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value, assigned_to: '' })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.department ? 'border-red-500' : 'border-slate-600'
                                }`}
                        >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                        {errors.department && <p className="text-red-400 text-xs mt-1">{errors.department}</p>}
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Assign To</label>
                        <select
                            value={formData.assigned_to}
                            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.assigned_to ? 'border-red-500' : 'border-slate-600'
                                }`}
                            disabled={!formData.department}
                        >
                            <option value="">Select Employee</option>
                            {getAvailableEmployees(formData.department).map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name}
                                </option>
                            ))}
                        </select>
                        {errors.assigned_to && <p className="text-red-400 text-xs mt-1">{errors.assigned_to}</p>}
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        >
                            Create Task
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
