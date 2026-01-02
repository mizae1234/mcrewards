'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/components/common/ui';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Save, AlertCircle } from 'lucide-react';

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: user?.id,
                    currentPassword,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Redirect after delay
            setTimeout(() => {
                router.back();
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="p-8 text-center">Please login first</div>;
    }

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="p-3 bg-yellow-100 rounded-full text-[#DA291C]">
                    <Key size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Change Password</h1>
                    <p className="text-sm text-gray-500">Update your account password</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Save size={12} className="text-green-700" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">Password Updated Successfully!</p>
                        <p className="text-xs opacity-80 mt-1">Redirecting you back...</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                    <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            required
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat password"
                            required
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none px-6"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-[#FFBC0D] text-black font-black px-8 hover:brightness-105 border-none flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Update Password'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
