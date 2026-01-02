'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/components/common/ui';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Key, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form Data
    const [employeeCode, setEmployeeCode] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleVerifyParams = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify',
                    employeeCode,
                    dateOfBirth
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reset',
                    employeeCode,
                    dateOfBirth,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Reset failed');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#DA291C] p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Password Reset Successful!</h2>
                    <p className="text-gray-500 mb-6">You can now login with your new password.</p>
                    <p className="text-sm text-gray-400">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#DA291C] p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="mb-6">
                    <Link href="/login" className="inline-flex items-center text-gray-500 hover:text-gray-800 text-sm font-bold transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Back to Login
                    </Link>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-gray-900">Forgot Password</h1>
                    <p className="text-gray-500">
                        {step === 1 ? 'Verify your identity' : 'Create new password'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center justify-center">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleVerifyParams} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Employee Code (รหัสพนักงาน)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    type="text"
                                    value={employeeCode}
                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                    placeholder="E0001"
                                    required
                                    className="w-full pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth (วันเกิด)</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    required
                                    className="w-full pl-10"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Format: DD/MM/YYYY (AD)</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#FFBC0D] text-black font-black text-lg py-4 hover:brightness-105 border-none mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Next Step'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="border-b pb-4 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Employee:</span>
                                <span className="font-bold text-gray-900">{employeeCode}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">New Password using (รหัสผ่านใหม่)</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    required
                                    className="w-full pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password (ยืนยันรหัสผ่าน)</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat password"
                                    required
                                    className="w-full pl-10"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#FFBC0D] text-black font-black text-lg py-4 hover:brightness-105 border-none mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Reseting...' : 'Reset Password'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
