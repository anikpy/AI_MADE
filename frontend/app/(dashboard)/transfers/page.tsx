'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Account, Transfer } from '@/lib/types';
import Header from '@/components/Header';
import { formatCurrency, formatAccountNumber, formatDateTime, statusBadge } from '@/lib/utils';
import {
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  Clock,
  RefreshCw,
} from 'lucide-react';
import Decimal from 'decimal.js';

export default function TransfersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Step wizard state (1: Select Accounts, 2: Amount & Schedule, 3: Review, 4: Success)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Transfer form fields
  const [isExternal, setIsExternal] = useState(false);
  const [sourceAccountId, setSourceAccountId] = useState<string>('');
  const [destAccountId, setDestAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [scheduledFor, setScheduledFor] = useState<string>('');

  // External fields
  const [extBankName, setExtBankName] = useState<string>('');
  const [extAccountNum, setExtAccountNum] = useState<string>('');
  const [extRoutingNum, setExtRoutingNum] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successTransfer, setSuccessTransfer] = useState<Transfer | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, trRes] = await Promise.all([
        api.get('/accounts/'),
        api.get('/transfers/'),
      ]);
      const accs: Account[] = accRes.data.results || accRes.data;
      setAccounts(accs);
      setTransfers(trRes.data.results || trRes.data);
      if (accs.length > 0 && !sourceAccountId) {
        setSourceAccountId(accs[0].id.toString());
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

  const selectedSourceAccount = accounts.find((a) => a.id.toString() === sourceAccountId);
  const selectedDestAccount = accounts.find((a) => a.id.toString() === destAccountId);

  // Wizard Step Navigation Validations
  const handleNextToStep2 = () => {
    setErrorMsg(null);
    if (!sourceAccountId) {
      setErrorMsg('Please select a source account.');
      return;
    }
    if (!isExternal && !destAccountId) {
      setErrorMsg('Please select a destination account.');
      return;
    }
    if (!isExternal && sourceAccountId === destAccountId) {
      setErrorMsg('Source and destination accounts cannot be the same.');
      return;
    }
    setStep(2);
  };

  const handleNextToStep3 = () => {
    setErrorMsg(null);
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg('Please enter a valid positive transfer amount.');
      return;
    }
    if (selectedSourceAccount && new Decimal(amount).gt(new Decimal(selectedSourceAccount.balance))) {
      setErrorMsg('Transfer amount exceeds available balance.');
      return;
    }
    if (isExternal && (!extBankName || !extAccountNum || !extRoutingNum)) {
      setErrorMsg('Please fill in all external bank details.');
      return;
    }
    setStep(3);
  };

  const handleExecuteTransfer = async () => {
    setErrorMsg(null);
    try {
      setSubmitting(true);
      const payload: any = {
        source_account: parseInt(sourceAccountId),
        amount: amount,
        is_external: isExternal,
        scheduled_for: scheduledFor ? `${scheduledFor}:00Z` : null,
      };

      if (isExternal) {
        payload.external_bank_name = extBankName;
        payload.external_account_number = extAccountNum;
        payload.external_routing_number = extRoutingNum;
      } else {
        payload.destination_account = parseInt(destAccountId);
      }

      const res = await api.post('/transfers/', payload);
      setSuccessTransfer(res.data);
      setStep(4);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.amount?.[0] || 'Transfer execution failed.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setAmount('');
    setScheduledFor('');
    setExtBankName('');
    setExtAccountNum('');
    setExtRoutingNum('');
    setErrorMsg(null);
    setSuccessTransfer(null);
  };

  return (
    <>
      <Header title="Transfers" subtitle="Execute instant internal transfers or scheduled bank payments" />

      <div className="page-body stagger flex flex-col gap-8">
        {/* Wizard Form Container */}
        <div className="card card-body">
          {/* Progress Step Header */}
          <div className="steps">
            <div className={`step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
              <div className="step-circle">{step > 1 ? <CheckCircle2 size={16} /> : '1'}</div>
              <span className="step-label">Select Accounts</span>
            </div>
            <div className="step-line" />
            <div className={`step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
              <div className="step-circle">{step > 2 ? <CheckCircle2 size={16} /> : '2'}</div>
              <span className="step-label">Amount & Details</span>
            </div>
            <div className="step-line" />
            <div className={`step ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`}>
              <div className="step-circle">{step > 3 ? <CheckCircle2 size={16} /> : '3'}</div>
              <span className="step-label">Review & Confirm</span>
            </div>
          </div>

          {errorMsg && (
            <div className="alert alert-error mb-4">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Select Accounts & Mode */}
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsExternal(false)}
                  className={`btn flex-1 py-3 ${!isExternal ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <ArrowRightLeft size={18} /> Internal Transfer (Between Accounts)
                </button>
                <button
                  type="button"
                  onClick={() => setIsExternal(true)}
                  className={`btn flex-1 py-3 ${isExternal ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Building size={18} /> External Wire / ACH Transfer
                </button>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">From Account (Source)</label>
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="form-input form-select"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_type.toUpperCase()} — #{acc.account_number} ({formatCurrency(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                {!isExternal ? (
                  <div className="form-group">
                    <label className="form-label">To Account (Destination)</label>
                    <select
                      value={destAccountId}
                      onChange={(e) => setDestAccountId(e.target.value)}
                      className="form-input form-select"
                    >
                      <option value="">Select destination account...</option>
                      {accounts
                        .filter((acc) => acc.id.toString() !== sourceAccountId)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_type.toUpperCase()} — #{acc.account_number} ({formatCurrency(acc.balance)})
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">External Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Chase Bank / Wells Fargo"
                      value={extBankName}
                      onChange={(e) => setExtBankName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                )}
              </div>

              {isExternal && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">External Routing Number (ABA)</label>
                    <input
                      type="text"
                      placeholder="9-digit routing number"
                      value={extRoutingNum}
                      onChange={(e) => setExtRoutingNum(e.target.value)}
                      className="form-input mono"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">External Account Number</label>
                    <input
                      type="text"
                      placeholder="Account number"
                      value={extAccountNum}
                      onChange={(e) => setExtAccountNum(e.target.value)}
                      className="form-input mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button onClick={handleNextToStep2} className="btn btn-primary">
                  <span>Continue to Amount</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Amount & Schedule */}
          {step === 2 && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Transfer Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-input mono"
                    style={{ fontSize: '1.5rem', height: '54px' }}
                  />
                  {selectedSourceAccount && (
                    <span className="text-xs text-muted">
                      Available balance: <strong className="text-brand">{formatCurrency(selectedSourceAccount.balance)}</strong>
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Schedule Execution (Optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="form-input"
                    style={{ height: '54px' }}
                  />
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock size={12} /> Leave empty for instant execution
                  </span>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={() => setStep(1)} className="btn btn-secondary">
                  Back
                </button>
                <button onClick={handleNextToStep3} className="btn btn-primary">
                  <span>Review Transfer</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {step === 3 && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h3 className="text-base font-bold">Transfer Summary Review</h3>

              <div className="p-6 rounded bg-muted border border-subtle flex flex-col gap-4">
                <div className="flex justify-between items-center pb-3 border-b border-subtle">
                  <span className="text-muted text-sm">Source Account</span>
                  <span className="font-bold mono">{selectedSourceAccount ? `#${selectedSourceAccount.account_number}` : sourceAccountId}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-subtle">
                  <span className="text-muted text-sm">Destination</span>
                  <span className="font-bold mono">
                    {isExternal
                      ? `${extBankName} (Acc: ${extAccountNum})`
                      : selectedDestAccount
                      ? `#${selectedDestAccount.account_number}`
                      : destAccountId}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-subtle">
                  <span className="text-muted text-sm">Execution Type</span>
                  <span className="badge badge-brand">
                    {scheduledFor ? `Scheduled for ${scheduledFor}` : 'Instant Execution'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm font-bold">Transfer Amount</span>
                  <span className="text-2xl font-bold text-brand mono">{formatCurrency(amount)}</span>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={() => setStep(2)} className="btn btn-secondary">
                  Back
                </button>
                <button
                  onClick={handleExecuteTransfer}
                  disabled={submitting}
                  className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`}
                >
                  {submitting ? 'Processing Transfer...' : 'Confirm & Submit Transfer'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success State */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center py-8 gap-4 animate-scaleIn">
              <div className="stat-card-icon green" style={{ width: '64px', height: '64px', fontSize: '32px' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-bold">Transfer Submitted Successfully!</h3>
              <p className="text-sm text-muted max-w-md">
                {scheduledFor
                  ? 'Your transfer has been scheduled and will be automatically processed at the requested time.'
                  : 'Funds have been transferred instantly between accounts.'}
              </p>

              <button onClick={resetForm} className="btn btn-primary mt-4">
                <RefreshCw size={16} /> Perform Another Transfer
              </button>
            </div>
          )}
        </div>

        {/* Transfer History Table */}
        <div className="card">
          <div className="p-6 border-b border-subtle">
            <h3 className="text-base font-bold">Transfer History</h3>
            <p className="text-xs text-muted">Complete log of internal and external transfer requests</p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Source Account</th>
                  <th>Destination</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="skeleton" style={{ height: '30px' }} />
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted">
                      No transfer history recorded.
                    </td>
                  </tr>
                ) : (
                  transfers.map((tr) => (
                    <tr key={tr.id}>
                      <td className="mono text-xs">#{tr.id}</td>
                      <td className="mono text-xs">#{tr.source_account_number}</td>
                      <td className="mono text-xs">
                        {tr.is_external ? `${tr.external_bank_name || 'External Bank'}` : `#${tr.destination_account_number || 'N/A'}`}
                      </td>
                      <td>
                        <span className={`badge ${tr.is_external ? 'badge-info' : 'badge-brand'}`}>
                          {tr.is_external ? 'External Wire' : 'Internal'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(tr.status)}`}>{tr.status}</span>
                      </td>
                      <td className="text-xs text-muted">{formatDateTime(tr.created_at)}</td>
                      <td className="text-right font-bold mono text-brand">{formatCurrency(tr.amount)}</td>
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
