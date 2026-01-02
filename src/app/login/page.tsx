'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/common/ui';

export default function LoginPage() {
    const [employeeCode, setEmployeeCode] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(employeeCode);
            router.push('/');
        } catch {
            setError('Invalid Employee Code or Password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#DA291C] p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-[#FFBC0D] p-3 rounded-full">
                            <span className="text-[#DA291C] text-4xl font-black">M</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">M Rewards</h1>
                    <p className="text-gray-500">Employee Login</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Employee Code (รหัสพนักงาน)</label>
                        <Input
                            type="text"
                            value={employeeCode}
                            onChange={(e) => setEmployeeCode(e.target.value)}
                            placeholder="e.g., E0001"
                            required
                            className="w-full text-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Password (รหัสผ่าน)</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full text-lg"
                        />
                        <div className="flex justify-between items-start mt-1">
                            <button
                                type="button"
                                onClick={() => alert('Please contact your administrator (HR) to reset your password.\n\nกรุณาติดต่อผู้ดูแลระบบ (HR) เพื่อรีเซ็ตรหัสผ่านของคุณ')}
                                className="text-sm font-bold text-gray-500 hover:text-red-600 hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-[#FFBC0D] text-black font-black text-lg py-6 hover:brightness-105 border-none shadow-md"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'SIGN IN'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
