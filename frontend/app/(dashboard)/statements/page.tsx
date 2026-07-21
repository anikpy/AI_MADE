'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Account, Statement } from '@/lib/types';
import Header from '@/components/Header';
import { formatDate } from '@/lib/utils';
import { FileText, Download, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StatementsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);

  // Statement generation form state
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // Default to current month YYYY-MM
  );
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, stRes] = await Promise.all([
        api.get('/accounts/'),
        api.get('/statements/'),
      ]);
      const accs: Account[] = accRes.data.results || accRes.data;
      setAccounts(accs);
      setStatements(stRes.data.results || stRes.data);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id.toString());
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!selectedAccountId || !selectedMonth) {
      setMessage({ type: 'error', text: 'Please select an account and month.' });
      return;
    }

    try {
      setGenerating(true);
      const res = await api.post(`/accounts/${selectedAccountId}/generate-statement/`, {
        month: selectedMonth,
      });

      setMessage({ type: 'success', text: res.data.detail || 'Statement generation initiated. Refreshing list...' });

      // Poll after 2 seconds to fetch newly generated statement
      setTimeout(fetchData, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate statement.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Header title="Account Statements" subtitle="Generate official PDF statements for accounting and compliance" />

      <div className="page-body stagger flex flex-col gap-8">
        {/* Generator Form */}
        <div className="card card-body">
          <h3 className="text-base font-bold mb-1">Generate Monthly PDF Statement</h3>
          <p className="text-xs text-muted mb-4">
            Statements contain itemized list of all transactions, opening/closing balance, and official seal.
          </p>

          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleGenerateStatement} className="flex gap-4 items-end flex-wrap">
            <div className="form-group flex-1" style={{ minWidth: '220px' }}>
              <label className="form-label">Select Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="form-input form-select"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_type.toUpperCase()} — #{acc.account_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1" style={{ minWidth: '180px' }}>
              <label className="form-label">Month Period (YYYY-MM)</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-input"
              />
            </div>

            <button type="submit" disabled={generating} className={`btn btn-primary ${generating ? 'btn-loading' : ''}`}>
              <FileText size={16} />
              <span>{generating ? 'Generating PDF...' : 'Generate PDF Statement'}</span>
            </button>
          </form>
        </div>

        {/* Existing Statements Table */}
        <div className="card">
          <div className="p-6 border-b border-subtle flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold">Generated Statements History</h3>
              <p className="text-xs text-muted">Ready for download in PDF format</p>
            </div>
            <button onClick={fetchData} className="btn btn-ghost btn-sm text-xs">
              Refresh List
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account Number</th>
                  <th>Month Period</th>
                  <th>Generated Date</th>
                  <th>PDF Document</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="skeleton" style={{ height: '30px' }} />
                    </td>
                  </tr>
                ) : statements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted">
                      No statements generated yet. Use the form above to generate your first statement.
                    </td>
                  </tr>
                ) : (
                  statements.map((st) => (
                    <tr key={st.id}>
                      <td className="mono font-semibold">#{st.account_number}</td>
                      <td>
                        <span className="badge badge-brand">{st.month}</span>
                      </td>
                      <td className="text-xs text-muted">{formatDate(st.created_at)}</td>
                      <td>
                        <span className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 size={14} /> PDF Ready
                        </span>
                      </td>
                      <td className="text-right">
                        {st.pdf_file ? (
                          <a
                            href={st.pdf_file.startsWith('http') ? st.pdf_file : `http://127.0.0.1:8000${st.pdf_file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            <Download size={14} /> Download PDF
                          </a>
                        ) : (
                          <span className="text-xs text-muted">Processing...</span>
                        )}
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
