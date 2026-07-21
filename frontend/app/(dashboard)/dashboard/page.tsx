'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Account, Transaction } from '@/lib/types';
import Header from '@/components/Header';
import {
  formatCurrency,
  formatAccountNumber,
  formatDate,
  amountClass,
  amountSign,
  addAmounts,
} from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  ArrowRightLeft,
  DollarSign,
  Activity,
  X,
} from 'lucide-react';
import Decimal from 'decimal.js';

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccountType, setNewAccountType] = useState<'checking' | 'savings'>('checking');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, txRes] = await Promise.all([
        api.get('/accounts/'),
        api.get('/transactions/?ordering=-created_at&page_size=8'),
      ]);
      setAccounts(accRes.data.results || accRes.data);
      setTransactions(txRes.data.results || txRes.data);
    } catch {
      // Errors handled by API interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate total balance safely using Decimal
  const totalBalance = accounts.reduce((acc, curr) => {
    return addAmounts(acc, curr.balance);
  }, '0.00');

  // Prepare chart data from recent transactions
  const chartData = [...transactions]
    .reverse()
    .map((tx) => ({
      date: formatDate(tx.created_at, { month: 'short', day: 'numeric' }),
      amount: new Decimal(tx.amount).toNumber(),
      type: tx.type,
    }));

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post('/accounts/', { account_type: newAccountType });
      setShowNewAccountModal(false);
      await fetchData();
    } catch {
      // Handled
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Header title="Dashboard" subtitle="Overview of your financial portfolio and recent activity" />

      <div className="page-body stagger flex flex-col gap-8">
        {/* Top Metric Cards */}
        <div className="grid-4">
          <div className="stat-card">
            <div className="stat-card-icon green">
              <DollarSign size={22} />
            </div>
            <span className="stat-card-label">Total Portfolio Balance</span>
            <span className="stat-card-value">{loading ? '...' : formatCurrency(totalBalance)}</span>
            <span className="stat-card-sub text-brand flex items-center gap-1">
              <TrendingUp size={12} /> Active across {accounts.length} accounts
            </span>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon blue">
              <CreditCard size={22} />
            </div>
            <span className="stat-card-label">Active Accounts</span>
            <span className="stat-card-value">{accounts.length}</span>
            <span className="stat-card-sub">Checking & Savings</span>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon yellow">
              <Activity size={22} />
            </div>
            <span className="stat-card-label">Recent Activity</span>
            <span className="stat-card-value">{transactions.length}</span>
            <span className="stat-card-sub">Transactions logged</span>
          </div>

          <div className="stat-card flex flex-col justify-between">
            <div>
              <span className="stat-card-label">Quick Action</span>
              <p className="text-xs text-muted mt-1 mb-3">Send funds instantly between accounts</p>
            </div>
            <div className="flex gap-2">
              <Link href="/transfers" className="btn btn-primary btn-sm flex-1">
                <ArrowRightLeft size={14} /> Transfer
              </Link>
              <button onClick={() => setShowNewAccountModal(true)} className="btn btn-secondary btn-sm">
                <Plus size={14} /> Open
              </button>
            </div>
          </div>
        </div>

        {/* Account Cards Carousel/Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Your Accounts</h2>
            <button onClick={() => setShowNewAccountModal(true)} className="btn btn-secondary btn-sm">
              <Plus size={14} /> Open New Account
            </button>
          </div>

          {loading ? (
            <div className="grid-3">
              {[1, 2].map((i) => (
                <div key={i} className="card p-6 skeleton" style={{ height: '160px' }} />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="card empty-state">
              <CreditCard className="empty-state-icon" />
              <div className="empty-state-title">No Accounts Found</div>
              <p className="empty-state-sub">Open your first checking or savings account to start.</p>
              <button onClick={() => setShowNewAccountModal(true)} className="btn btn-primary mt-2">
                <Plus size={16} /> Open Account
              </button>
            </div>
          ) : (
            <div className="grid-3">
              {accounts.map((acc) => (
                <Link key={acc.id} href={`/accounts/${acc.id}`} style={{ textDecoration: 'none' }}>
                  <div className="account-card">
                    <div className="account-card-type">{acc.account_type} Account</div>
                    <div className="account-card-number">{formatAccountNumber(acc.account_number)}</div>
                    <div className="account-card-balance">{formatCurrency(acc.balance)}</div>
                    <div className="account-card-label flex justify-between items-center mt-2">
                      <span>Status: <strong className="text-brand">{acc.status}</strong></span>
                      <span className="text-brand flex items-center gap-1 text-xs">View details &rarr;</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Chart & Recent Transactions Section */}
        <div className="grid-2">
          {/* Spending & Activity Chart */}
          <div className="card card-body">
            <h3 className="text-base font-bold mb-1">Activity Visualizer</h3>
            <p className="text-xs text-muted mb-4">Recent transaction volume trend</p>

            {chartData.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted">No activity data to visualize yet.</div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#25a068" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#25a068" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#131f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      formatter={(val: any) => [formatCurrency(val), 'Amount']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#47b883" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Transactions List */}
          <div className="card card-body">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold">Recent Transactions</h3>
                <p className="text-xs text-muted">Latest activity across accounts</p>
              </div>
              <Link href="/accounts" className="text-xs text-brand hover:underline font-semibold">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '44px' }} />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted">No recent transactions.</div>
            ) : (
              <div className="flex flex-col gap-2 pr-1">
                {transactions.map((tx) => {
                  const isPositive = ['deposit', 'transfer_in'].includes(tx.type);
                  return (
                    <div key={tx.id} className="flex justify-between items-center p-3 rounded hover:bg-muted/50 transition border border-subtle">
                      <div className="flex items-center gap-3">
                        <div className={`stat-card-icon ${isPositive ? 'green' : 'red'}`} style={{ width: '36px', height: '36px', marginBottom: 0 }}>
                          {isPositive ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{tx.merchant || tx.category || tx.type}</div>
                          <div className="text-xs text-muted">
                            Account {tx.account_number ? `...${tx.account_number.slice(-4)}` : ''} • {formatDate(tx.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm font-bold mono ${amountClass(tx.type)}`}>
                        {amountSign(tx.type)}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal to Open New Account */}
      {showNewAccountModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Open New Account</h3>
              <button onClick={() => setShowNewAccountModal(false)} className="btn btn-ghost btn-sm p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as 'checking' | 'savings')}
                  className="form-input form-select"
                >
                  <option value="checking">Checking Account (Everyday use)</option>
                  <option value="savings">Savings Account (High-yield interest)</option>
                </select>
              </div>

              <div className="p-4 rounded bg-muted text-xs text-secondary leading-relaxed">
                Opening an account is instant. Account number will be automatically generated with an initial balance of $0.00.
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowNewAccountModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className={`btn btn-primary ${creating ? 'btn-loading' : ''}`}>
                  {creating ? 'Creating...' : 'Open Account Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
