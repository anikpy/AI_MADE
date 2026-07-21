'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  FileText,
  Bell,
  ShieldAlert,
  LogOut,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/accounts', label: 'Accounts', icon: CreditCard },
    { href: '/transfers', label: 'Transfers', icon: ArrowRightLeft },
    { href: '/statements', label: 'Statements', icon: FileText },
    { href: '/settings', label: 'Preferences', icon: Bell },
  ];

  if (isStaffOrAdmin) {
    navItems.push({ href: '/audit', label: 'Audit Logs', icon: ShieldAlert });
  }

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldCheck size={20} color="#fff" />
        </div>
        <div className="sidebar-logo-text">
          Apex<span className="text-brand">Finance</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="sidebar-footer">
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            {user ? getInitials(user.first_name ? `${user.first_name} ${user.last_name}` : user.username) : 'U'}
          </div>
          <div className="overflow-hidden" style={{ minWidth: 0 }}>
            <div className="text-sm font-semibold truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </div>
            <div className="text-xs text-muted flex items-center gap-1">
              <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : user?.role === 'staff' ? 'badge-warning' : 'badge-brand'}`} style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <button onClick={logout} className="nav-link text-danger w-full">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
