'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Notification } from '@/lib/types';
import { Bell, Check, X, ShieldAlert } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      const data: Notification[] = res.data.results || res.data;
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch {
      // Ignore notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="notif-bell"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>

          {showNotifs && (
            <div className="modal animate-scaleIn absolute right-0 top-12 z-50 p-4" style={{ width: '360px', maxWidth: '90vw' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="btn btn-ghost btn-sm text-xs text-brand p-1">
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded text-xs transition ${n.read ? 'bg-transparent text-secondary' : 'bg-muted border border-subtle text-primary font-medium'}`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="font-semibold text-xs text-primary">{n.title}</span>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {formatDateTime(n.created_at)}
                        </span>
                      </div>
                      <p className="text-muted">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
