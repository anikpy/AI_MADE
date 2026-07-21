/**
 * Typed interfaces matching the Django REST API schemas.
 * All monetary amounts use strings to preserve decimal precision.
 */

export type UserRole = 'customer' | 'staff' | 'admin';
export type AccountType = 'checking' | 'savings';
export type AccountStatus = 'active' | 'suspended' | 'closed';
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';
export type TransactionCategory = 'income' | 'utilities' | 'groceries' | 'entertainment' | 'transfer' | 'other';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type TransferStatus = 'pending' | 'scheduled' | 'completed' | 'failed';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface Account {
  id: number;
  owner: number;
  owner_username: string;
  account_number: string;
  account_type: AccountType;
  /** Monetary value as string — never parse to float */
  balance: string;
  status: AccountStatus;
  created_at: string;
}

export interface Transaction {
  id: number;
  account: number;
  account_number: string;
  /** Monetary value as string */
  amount: string;
  type: TransactionType;
  category: TransactionCategory;
  status: TransactionStatus;
  merchant: string | null;
  created_at: string;
}

export interface Transfer {
  id: number;
  source_account: number;
  source_account_number: string;
  destination_account: number | null;
  destination_account_number: string | null;
  /** Monetary value as string */
  amount: string;
  status: TransferStatus;
  scheduled_for: string | null;
  created_at: string;
  is_external: boolean;
  external_bank_name: string | null;
  external_account_number: string | null;
  external_routing_number: string | null;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export interface Statement {
  id: number;
  account: number;
  account_number: string;
  month: string;
  pdf_file: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user: number | null;
  username: string | null;
  action: string;
  model_name: string;
  object_id: string | null;
  changes: Record<string, string> | null;
  timestamp: string;
}

/** Paginated list response from DRF */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Auth tokens */
export interface TokenPair {
  access: string;
  refresh: string;
}

export interface LoginResponse extends TokenPair {
  detail?: string;
}

export interface RegisterResponse extends TokenPair {
  user: User;
}
