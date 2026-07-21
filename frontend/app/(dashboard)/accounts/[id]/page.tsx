'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Account, Transaction } from '@/lib/types';
import Header from '@/components/Header';
import {
  formatCurrency,
  formatAccountNumber,
  formatDate,
  formatDateTime,
  amountClass,
  amountSign,
  statusBadge,
} from '@/lib/utils';
import {
  ArrowLeft,
  Download,
  Plus,
  Minus,
  Filter,
  Search,
  FileText,
  Calendar,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const accountId = resolvedParams.id;

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Transaction Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('other');
  const [merchantInput, setMerchantInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const accRes = await api.get(`/accounts/${accountId}/`);
      setAccount(accRes.data);

      let url = `/transactions/?account=${accountId}&ordering=-created_at`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (startDate) url += `&start_date=${startDate}T00:00:00Z`;
      if (endDate) url += `&end_date=${endDate}T23:59:59Z`;

      const txRes = await api.get(url);
      setTransactions(txRes.data.results || txRes.data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [accountId, typeFilter, categoryFilter, startDate, endDate]);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);
    if (!amountInput || parseFloat(amountInput) <= 0) {
      setTxError('Please enter a valid positive amount.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/transactions/', {
        account: parseInt(accountId),
        amount: amountInput,
        type: modalType,
        category: categoryInput,
        merchant: merchantInput || null,
      });

      setShowModal(false);
      setAmountInput('');
      setMerchantInput('');
      await fetchAccountData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.amount?.[0] || 'Transaction failed.';
      setTxError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export functionality
  const exportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['ID', 'Date', 'Type', 'Category', 'Merchant', 'Amount', 'Status'];
    const rows = transactions.map((tx) => [
      tx.id,
      formatDateTime(tx.created_at),
      tx.type,
      tx.category,
      `"${tx.merchant || ''}"`,
      tx.amount,
      tx.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `statement_account_${account?.account_number || accountId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!account && !loading) {
    return (
      <div className="page-body">
        <div className="card empty-state">
          <div className="empty-state-title">Account Not Found</div>
          <Link href="/accounts" className="btn btn-primary mt-4">
            <ArrowLeft size={16} /> Back to Accounts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title={account ? `${account.account_type.toUpperCase()} ACCOUNT` : 'Account Details'}
        subtitle={account ? `Account #${formatAccountNumber(account.account_number)}` : ''}
      />

      <div className="page-body stagger flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <Link href="/accounts" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Back to Accounts
          </Link>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setModalType('deposit');
                setShowModal(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} /> Deposit
            </button>
            <button
              onClick={() => {
                setModalType('withdrawal');
                setShowModal(true);
              }}
              className="btn btn-secondary btn-sm"
            >
              <Minus size={14} /> Withdraw
            </button>
            <button onClick={exportCSV} className="btn btn-ghost btn-sm" title="Export CSV">
              <Download size={14} /> CSV Export
            </button>
          </div>
        </div>

        {/* Account Details Banner Card */}
        {account && (
          <div className="account-card" style={{ cursor: 'default' }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="account-card-type">{account.account_type} Account</div>
                <div className="account-card-number">{formatAccountNumber(account.account_number)}</div>
              </div>
              <span className={`badge ${statusBadge(account.status)}`}>{account.status}</span>
            </div>

            <div className="mt-4">
              <div className="account-card-label">Current Balance</div>
              <div className="account-card-balance">{formatCurrency(account.balance)}</div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="filter-bar">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Filter size={14} /> Filter Transactions:
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-input form-select"
            style={{ width: 'auto', padding: '6px 30px 6px 12px', fontSize: '0.8rem' }}
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input form-select"
            style={{ width: 'auto', padding: '6px 30px 6px 12px', fontSize: '0.8rem' }}
          >
            <option value="">All Categories</option>
            <option value="income">Income</option>
            <option value="groceries">Groceries</option>
            <option value="utilities">Utilities</option>
            <option value="entertainment">Entertainment</option>
            <option value="transfer">Transfer</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-input"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
            title="Start Date"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-input"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
            title="End Date"
          />

          {(typeFilter || categoryFilter || startDate || endDate) && (
            <button
              onClick={() => {
                setTypeFilter('');
                setCategoryFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="btn btn-ghost btn-sm text-xs"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Transactions Table */}
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description / Merchant</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="skeleton" style={{ height: '30px' }} />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted">
                      No transactions recorded for this account.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="td-muted text-xs">{formatDateTime(tx.created_at)}</td>
                      <td>
                        <span className={`badge ${['deposit', 'transfer_in'].includes(tx.type) ? 'badge-success' : 'badge-danger'}`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-gray">{tx.category}</span>
                      </td>
                      <td className="font-medium">{tx.merchant || '—'}</td>
                      <td>
                        <span className={`badge ${statusBadge(tx.status)}`}>{tx.status}</span>
                      </td>
                      <td className={`text-right font-bold mono ${amountClass(tx.type)}`}>
                        {amountSign(tx.type)}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deposit / Withdraw Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalType === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm p-1">
                <X size={18} />
              </button>
            </div>

            {txError && (
              <div className="alert alert-error mb-4">
                <span>{txError}</span>
              </div>
            )}

            <form onSubmit={handleTransactionSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="form-input mono"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="form-input form-select"
                >
                  <option value="income">Income</option>
                  <option value="groceries">Groceries</option>
                  <option value="utilities">Utilities</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Merchant (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ATM Cash Deposit"
                  value={merchantInput}
                  onChange={(e) => setMerchantInput(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`btn ${modalType === 'deposit' ? 'btn-primary' : 'btn-danger'} ${submitting ? 'btn-loading' : ''}`}
                >
                  {submitting ? 'Processing...' : `Confirm ${modalType.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
