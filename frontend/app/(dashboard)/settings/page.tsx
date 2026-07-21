'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { NotificationPreference } from '@/lib/types';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { Bell, Mail, Shield, CheckCircle2, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [pref, setPref] = useState<NotificationPreference>({
    email_enabled: true,
    in_app_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/preferences/my-preferences/');
      setPref(res.data);
    } catch {
      // Defaults keep state intact
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    try {
      setSaving(true);
      await api.patch('/notifications/preferences/my-preferences/', pref);
      setSuccessMsg('Notification preferences updated successfully.');
    } catch {
      // Error
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="Notification Preferences" subtitle="Manage your email alerts and security notifications" />

      <div className="page-body stagger flex flex-col gap-6 max-w-3xl">
        {/* Profile Card */}
        <div className="card card-body">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Shield size={18} className="text-brand" /> Account Profile Info
          </h3>

          <div className="grid-2">
            <div>
              <span className="text-xs text-muted">Username</span>
              <div className="font-semibold text-sm">{user?.username}</div>
            </div>
            <div>
              <span className="text-xs text-muted">Email Address</span>
              <div className="font-semibold text-sm">{user?.email || 'Not configured'}</div>
            </div>
            <div>
              <span className="text-xs text-muted">User Role</span>
              <div>
                <span className="badge badge-brand">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Form Card */}
        <div className="card card-body">
          <h3 className="text-base font-bold mb-1 flex items-center gap-2">
            <Bell size={18} className="text-brand" /> Notification Channels
          </h3>
          <p className="text-xs text-muted mb-6">Configure how ApexFinance alerts you regarding transfers and deposits.</p>

          {successMsg && (
            <div className="alert alert-success mb-4">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="flex justify-between items-center p-4 rounded bg-muted border border-subtle">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-brand" />
                <div>
                  <div className="text-sm font-semibold">Email Alerts</div>
                  <div className="text-xs text-muted">Receive email receipts for completed transfers and statements.</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pref.email_enabled}
                onChange={(e) => setPref({ ...pref, email_enabled: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#25a068' }}
              />
            </div>

            <div className="flex justify-between items-center p-4 rounded bg-muted border border-subtle">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-brand" />
                <div>
                  <div className="text-sm font-semibold">In-App Notifications</div>
                  <div className="text-xs text-muted">Display real-time notification drop-down alerts in the top bar.</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pref.in_app_enabled}
                onChange={(e) => setPref({ ...pref, in_app_enabled: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#25a068' }}
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className={`btn btn-primary ${saving ? 'btn-loading' : ''}`}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
