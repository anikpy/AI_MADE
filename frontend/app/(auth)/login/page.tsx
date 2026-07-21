'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login(data.username, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid credentials. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-mesh" />
      <div className="auth-card animate-scaleIn">
        {/* Logo Header */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <h1 className="auth-title">Apex<span className="text-brand">Finance</span></h1>
            <p className="auth-subtitle">Enterprise Account Management</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-1">Welcome back</h2>
        <p className="text-sm text-muted mb-6">Sign in to manage your accounts and transfers</p>

        {serverError && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div className="relative">
              <input
                id="username"
                type="text"
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="Enter your username"
                autoComplete="username"
                {...register('username')}
              />
            </div>
            {errors.username && <span className="form-error">{errors.username.message}</span>}
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center">
              <label className="form-label" htmlFor="password">Password</label>
              <Link href="/forgot-password" className="text-xs text-brand hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="••••••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn btn-primary btn-full mt-2 ${isSubmitting ? 'btn-loading' : ''}`}
          >
            {isSubmitting ? 'Signing in...' : (
              <>
                <span>Sign in to Portal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand font-semibold hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
