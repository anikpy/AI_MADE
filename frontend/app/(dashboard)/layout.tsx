'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <div className="bg-mesh" />
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

