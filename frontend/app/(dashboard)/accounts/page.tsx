'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Account } from '@/lib/types';
import Header from '@/components/Header';
import { formatCurrency, formatAccountNumber, formatDate, statusBadge } from '@/lib/utils';
import { CreditCard, Plus, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/');
      setAccounts(res.data.results || res.data);
    } catch {
      // API error handled globally
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter((acc) => {
    if (filterType === 'all') return true;
    return acc.account_type === filterType;
  });

  return (
    <>
      <Header title="Accounts" subtitle="Manage your checking and savings bank accounts" />

      <div className="page-body stagger flex flex-col gap-6">
        {/* Filter bar */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            {['all', 'checking', 'savings'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-ghost'}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} Accounts
              </button>
            ))}
          </div>

          <Link href="/transfers" className="btn btn-primary btn-sm">
            <ArrowRightLeft size={14} /> New Transfer
          </Link>
        </div>

        {/* Accounts Table & Grid */}
        {loading ? (
          <div className="grid-2">
            {[1, 2].map((i) => (
              <div key={i} className="card p-6 skeleton" style={{ height: '180px' }} />
            ))}
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="card empty-state">
            <CreditCard className="empty-state-icon" />
            <div className="empty-state-title">No Accounts Found</div>
            <p className="empty-state-sub">There are no accounts matching the selected filter.</p>
          </div>
        ) : (
          <div className="grid-2">
            {filteredAccounts.map((acc) => (
              <div key={acc.id} className="card card-body flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="badge badge-brand mb-1">{acc.account_type}</span>
                      <h3 className="text-lg font-bold mono">{formatAccountNumber(acc.account_number)}</h3>
                    </div>
                    <span className={`badge ${statusBadge(acc.status)}`}>{acc.status}</span>
                  </div>
                  <div className="text-xs text-muted">Owner: {acc.owner_username} • Opened {formatDate(acc.created_at)}</div>
                </div>

                <div className="flex justify-between items-end border-t border-subtle pt-4">
                  <div>
                    <span className="text-xs text-muted">Available Balance</span>
                    <div className="text-2xl font-bold">{formatCurrency(acc.balance)}</div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/accounts/${acc.id}`} className="btn btn-secondary btn-sm">
                      View Activity &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
