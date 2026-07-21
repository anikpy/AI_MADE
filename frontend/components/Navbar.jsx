'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDevUser } from '@/context/DevUserContext';
import { ChevronDown, LayoutDashboard, Users, Briefcase, CheckSquare, Notebook } from 'lucide-react';
import { getRoleColor } from '@/lib/utils';

export default function Navbar() {
    const { currentUser, allUsers, switchUser } = useDevUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo & Brand */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                        <LayoutDashboard className="w-6 h-6 text-blue-500" />
                        <span className="font-bold text-lg text-white">Workforce ERP</span>
                    </Link>

                    {/* Main Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/" className="text-slate-300 hover:text-white transition flex items-center gap-1">
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <Link href="/users" className="text-slate-300 hover:text-white transition flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Users
                        </Link>
                        <Link href="/departments" className="text-slate-300 hover:text-white transition flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            Departments
                        </Link>
                        <Link href="/tasks" className="text-slate-300 hover:text-white transition flex items-center gap-1">
                            <CheckSquare className="w-4 h-4" />
                            Tasks
                        </Link>
                        <Link href="/daily-logs" className="text-slate-300 hover:text-white transition flex items-center gap-1">
                            <Notebook className="w-4 h-4" />
                            Logs
                        </Link>
                    </div>

                    {/* Dev User Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${getRoleColor(currentUser.role)}`}
                        >
                            <div className="text-left">
                                <div className="text-xs font-semibold">{currentUser.name}</div>
                                <div className="text-xs opacity-75">{currentUser.role}</div>
                            </div>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                                <div className="p-2 max-h-80 overflow-y-auto">
                                    {allUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                switchUser(user.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded transition mb-1 ${currentUser.id === user.id
                                                ? 'bg-blue-900 text-blue-100'
                                                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                }`}
                                        >
                                            <div className="font-medium text-sm">{user.name}</div>
                                            <div className="text-xs opacity-75">{user.email}</div>
                                            <div className="text-xs opacity-50">{user.role}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
