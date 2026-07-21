'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerAuth({
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
      });
      router.push('/dashboard');
    } catch (err: any) {
      const respData = err.response?.data;
      if (typeof respData === 'object' && respData !== null) {
        const firstErrKey = Object.keys(respData)[0];
        const val = respData[firstErrKey];
        setServerError(`${firstErrKey}: ${Array.isArray(val) ? val.join(' ') : val}`);
      } else {
        setServerError('Registration failed. Please check inputs and try again.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-mesh" />
      <div className="auth-card animate-scaleIn" style={{ maxWidth: '480px' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <h1 className="auth-title">Apex<span className="text-brand">Finance</span></h1>
            <p className="auth-subtitle">Create Client Account</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-1">Get started</h2>
        <p className="text-sm text-muted mb-6">Open your secure digital bank account</p>

        {serverError && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid-2" style={{ gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="first_name">First Name</label>
              <input
                id="first_name"
                type="text"
                className="form-input"
                placeholder="Jane"
                {...register('first_name')}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="last_name">Last Name</label>
              <input
                id="last_name"
                type="text"
                className="form-input"
                placeholder="Doe"
                {...register('last_name')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="janedoe"
              {...register('username')}
            />
            {errors.username && <span className="form-error">{errors.username.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="jane@example.com"
              {...register('email')}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              {...register('password')}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm_password">Confirm Password</label>
            <input
              id="confirm_password"
              type="password"
              className={`form-input ${errors.confirm_password ? 'error' : ''}`}
              placeholder="Repeat password"
              {...register('confirm_password')}
            />
            {errors.confirm_password && <span className="form-error">{errors.confirm_password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn btn-primary btn-full mt-2 ${isSubmitting ? 'btn-loading' : ''}`}
          >
            {isSubmitting ? 'Creating account...' : (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
