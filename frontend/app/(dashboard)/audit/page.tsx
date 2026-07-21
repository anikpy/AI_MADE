'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AuditLog } from '@/lib/types';
import Header from '@/components/Header';
import { formatDateTime } from '@/lib/utils';
import { ShieldAlert, ShieldCheck, User } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs/');
      setLogs(res.data.results || res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setForbidden(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (forbidden) {
    return (
      <div className="page-body">
        <div className="card empty-state">
          <ShieldAlert className="empty-state-icon text-danger" />
          <div className="empty-state-title text-danger">Access Denied</div>
          <p className="empty-state-sub">Audit logs are only accessible to Staff and Administrator roles.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header title="Audit Logs" subtitle="Compliance audit log of all system mutation actions" />

      <div className="page-body stagger flex flex-col gap-6">
        <div className="card">
          <div className="p-6 border-b border-subtle flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold">System Mutation Audit Trail</h3>
              <p className="text-xs text-muted">Immutable log created on every database mutation</p>
            </div>
            <button onClick={fetchLogs} className="btn btn-ghost btn-sm text-xs">
              Refresh
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Model / Entity</th>
                  <th>Object ID</th>
                  <th>Changes Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="skeleton" style={{ height: '30px' }} />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-xs text-muted mono">{formatDateTime(log.timestamp)}</td>
                      <td className="font-semibold">{log.username || 'System / Anon'}</td>
                      <td>
                        <span className="badge badge-brand">{log.action}</span>
                      </td>
                      <td className="mono text-xs">{log.model_name}</td>
                      <td className="mono text-xs">{log.object_id || '—'}</td>
                      <td className="mono text-xs text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.changes ? JSON.stringify(log.changes) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
