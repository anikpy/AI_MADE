'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

const DevUserContext = createContext();

// Mock users for development
const MOCK_USERS = [
    { id: 1, name: 'Primary Super Admin', email: 'owner@company.com', role: 'SUPER_ADMIN', department: null },
    { id: 2, name: 'Shadow Admin', email: 'admin@company.com', role: 'ADMIN', department: null },
    { id: 3, name: 'Sarah (Tech Lead)', email: 'sarah@company.com', role: 'DEPT_HEAD', department: 1 },
    { id: 4, name: 'Alex Developer', email: 'alex@company.com', role: 'EMPLOYEE', department: 1 },
];

export function DevUserProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(MOCK_USERS[0]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch real users from backend
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.getUsers();
            setAllUsers(response.data || MOCK_USERS);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setAllUsers(MOCK_USERS);
            setLoading(false);
        }
    };

    const switchUser = (userId) => {
        const user = allUsers.find(u => u.id === userId) || MOCK_USERS.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
        }
    };

    const value = {
        currentUser,
        allUsers,
        switchUser,
        loading,
        canManageUsers: currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN',
        canManageDepartments: currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN',
        canCreateTasks: currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'DEPT_HEAD',
        isDeptHead: currentUser.role === 'DEPT_HEAD',
        isDepartmentOf: (deptId) => currentUser.department === deptId,
    };

    return (
        <DevUserContext.Provider value={value}>
            {children}
        </DevUserContext.Provider>
    );
}

export function useDevUser() {
    const context = useContext(DevUserContext);
    if (!context) {
        throw new Error('useDevUser must be used within DevUserProvider');
    }
    return context;
}
