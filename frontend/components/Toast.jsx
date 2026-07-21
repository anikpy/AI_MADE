'use client';

import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function Toast({ type = 'success', message, onClose }) {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        error: <XCircle className="w-5 h-5 text-red-400" />,
        warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    };

    const colors = {
        success: 'bg-green-900 text-green-100 border-green-700',
        error: 'bg-red-900 text-red-100 border-red-700',
        warning: 'bg-yellow-900 text-yellow-100 border-yellow-700',
    };

    return (
        <div className={`fixed bottom-4 right-4 flex items-center gap-3 p-4 rounded-lg border ${colors[type]} z-50 animate-in fade-in slide-in-from-bottom-5`}>
            {icons[type]}
            <span className="text-sm">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 text-current hover:opacity-80 transition"
            >
                ✕
            </button>
        </div>
    );
}
