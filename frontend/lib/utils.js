// Role badge colors
export const getRoleColor = (role) => {
    const colors = {
        SUPER_ADMIN: 'bg-red-900 text-red-200',
        ADMIN: 'bg-orange-900 text-orange-200',
        DEPT_HEAD: 'bg-blue-900 text-blue-200',
        EMPLOYEE: 'bg-slate-700 text-slate-200',
    };
    return colors[role] || 'bg-slate-700 text-slate-200';
};

// Task status colors
export const getStatusColor = (status) => {
    const colors = {
        TODO: 'bg-slate-700 text-slate-200',
        IN_PROGRESS: 'bg-yellow-900 text-yellow-200',
        COMPLETED: 'bg-green-900 text-green-200',
    };
    return colors[status] || 'bg-slate-700 text-slate-200';
};

export const getStatusLabel = (status) => {
    const labels = {
        TODO: 'To Do',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed',
    };
    return labels[status] || status;
};

// Format date
export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Format date time
export const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Validation helpers
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validateName = (name) => {
    return name && name.trim().length >= 2;
};

export const validateHours = (hours) => {
    const h = parseFloat(hours);
    return !isNaN(h) && h > 0 && h <= 24;
};
