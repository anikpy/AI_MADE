'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useDevUser } from '@/context/DevUserContext';
import { LoadingSpinner } from '@/components/Loading';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { Plus, Clock, FileText, Calendar } from 'lucide-react';
import { formatDateTime, formatDate, validateHours } from '@/lib/utils';

export default function DailyLogsPage() {
    const { currentUser } = useDevUser();
    const [logs, setLogs] = useState([]);
    const [userTasks, setUserTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        task: '',
        log_date: new Date().toISOString().split('T')[0],
        hours_spent: '',
        notes: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchLogs();
        fetchUserTasks();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.getDailyLogs();
            const allLogs = response.data || [];
            // Sort by most recent first
            const sortedLogs = allLogs.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
            setLogs(sortedLogs);
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to load daily logs' });
        } finally {
            setLoading(false);
        }
    };

    const fetchUserTasks = async () => {
        try {
            const response = await api.getTasks();
            const allTasks = response.data || [];
            // Filter tasks assigned to current user
            const myTasks = allTasks.filter(t => t.assigned_to === currentUser.id);
            setUserTasks(myTasks);
        } catch (error) {
            console.error('Failed to load user tasks:', error);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.task) newErrors.task = 'Task is required';
        if (!formData.log_date) newErrors.log_date = 'Date is required';
        if (!formData.hours_spent || !validateHours(formData.hours_spent)) {
            newErrors.hours_spent = 'Hours must be between 0 and 24';
        }
        if (!formData.notes || formData.notes.trim().length < 5) {
            newErrors.notes = 'Notes must be at least 5 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await api.createDailyLog({
                task: parseInt(formData.task),
                user: currentUser.id,
                log_date: formData.log_date,
                hours_spent: parseFloat(formData.hours_spent),
                notes: formData.notes,
            });
            setToast({ type: 'success', message: 'Work logged successfully' });
            setFormData({
                task: '',
                log_date: new Date().toISOString().split('T')[0],
                hours_spent: '',
                notes: '',
            });
            setIsModalOpen(false);
            fetchLogs();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to log work';
            setToast({ type: 'error', message });
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
                    <h1 className="text-3xl font-bold text-white">Daily Activity Logs</h1>
                    <p className="text-slate-400 mt-1">Track and document completed work</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                    <Plus className="w-4 h-4" />
                    Log Work
                </button>
            </div>

            {/* Activity Feed */}
            <div className="space-y-4">
                {logs.length > 0 ? (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Task & Date */}
                                <div className="md:col-span-2">
                                    <h3 className="font-semibold text-white mb-1">{log.task_title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatDate(log.log_date)}</span>
                                    </div>
                                </div>

                                {/* Hours Spent */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Hours Spent</p>
                                    <div className="flex items-center gap-2 text-white font-semibold">
                                        <Clock className="w-4 h-4 text-green-400" />
                                        <span>{log.hours_spent}h</span>
                                    </div>
                                </div>

                                {/* Logged By & Time */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Logged By</p>
                                    <p className="text-white font-medium text-sm">{log.user_name}</p>
                                    <p className="text-xs text-slate-500">{formatDateTime(log.created_at)}</p>
                                </div>
                            </div>

                            {/* Notes */}
                            {log.notes && (
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <div className="flex items-start gap-2">
                                        <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-slate-300 break-words">{log.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
                        <p className="text-slate-400">No work logs found</p>
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
                title="Log Work"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Task Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Task</label>
                        <select
                            value={formData.task}
                            onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.task ? 'border-red-500' : 'border-slate-600'
                                }`}
                        >
                            <option value="">Select a task</option>
                            {userTasks.map((task) => (
                                <option key={task.id} value={task.id}>
                                    {task.title}
                                </option>
                            ))}
                        </select>
                        {errors.task && <p className="text-red-400 text-xs mt-1">{errors.task}</p>}
                        {userTasks.length === 0 && (
                            <p className="text-yellow-400 text-xs mt-1">No tasks assigned to you</p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Log Date</label>
                        <input
                            type="date"
                            value={formData.log_date}
                            onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.log_date ? 'border-red-500' : 'border-slate-600'
                                }`}
                        />
                        {errors.log_date && <p className="text-red-400 text-xs mt-1">{errors.log_date}</p>}
                    </div>

                    {/* Hours Spent */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Hours Spent</label>
                        <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={formData.hours_spent}
                            onChange={(e) => setFormData({ ...formData, hours_spent: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.hours_spent ? 'border-red-500' : 'border-slate-600'
                                }`}
                            placeholder="e.g., 4.5"
                        />
                        {errors.hours_spent && <p className="text-red-400 text-xs mt-1">{errors.hours_spent}</p>}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.notes ? 'border-red-500' : 'border-slate-600'
                                }`}
                            placeholder="Describe the work completed"
                            rows="4"
                        />
                        {errors.notes && <p className="text-red-400 text-xs mt-1">{errors.notes}</p>}
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        >
                            Log Work
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
