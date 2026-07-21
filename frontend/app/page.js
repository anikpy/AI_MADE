'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useDevUser } from '@/context/DevUserContext';
import { LoadingSpinner } from '@/components/Loading';
import Toast from '@/components/Toast';
import { Users, Briefcase, CheckSquare, Plus } from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useDevUser();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.getDashboardMetrics();
      setMetrics(response.data);
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to load dashboard metrics' });
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-2">
          Welcome back, <span className="font-semibold text-blue-400">{currentUser.name}</span>
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Employees */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-white">{metrics?.metrics?.total_employees || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        {/* Total Departments */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Departments</p>
              <p className="text-3xl font-bold text-white">{metrics?.metrics?.total_departments || 0}</p>
            </div>
            <Briefcase className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Active Tasks</p>
              <p className="text-3xl font-bold text-white">{metrics?.metrics?.active_tasks || 0}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/tasks?action=create"
            className="flex items-center gap-2 px-4 py-3 bg-blue-900 hover:bg-blue-800 text-blue-100 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </Link>
          <Link
            href="/users?action=create"
            className="flex items-center gap-2 px-4 py-3 bg-green-900 hover:bg-green-800 text-green-100 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Link>
          <Link
            href="/daily-logs?action=create"
            className="flex items-center gap-2 px-4 py-3 bg-purple-900 hover:bg-purple-800 text-purple-100 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Log Work
          </Link>
        </div>
      </div>

      {/* Task Status Breakdown */}
      {metrics?.task_status_breakdown && (
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Task Status Breakdown</h2>
          <div className="space-y-2">
            {metrics.task_status_breakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-slate-300">{item.status}</span>
                <div className="w-40 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${(item.count / (metrics.metrics.active_tasks || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="text-blue-400 font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
