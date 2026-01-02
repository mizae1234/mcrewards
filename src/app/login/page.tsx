'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button, Input, Modal } from '@/components/common/ui';
import { Shield, User } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [employeeCode, setEmployeeCode] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModeSelection, setShowModeSelection] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const user = await login(employeeCode, password);
            if (user && user.role === 'Admin') {
                setShowModeSelection(true);
            } else {
                router.push('/user');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid Employee Code or Password');
        } finally {
            setLoading(false);
        }
    };

    const handleModeSelect = (mode: 'admin' | 'user') => {
        if (mode === 'admin') {
            router.push('/admin');
        } else {
            router.push('/user');
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
                            required
                            className="w-full text-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            First time login? Use your Employee Code as password.
                        </p>
                        <div className="flex justify-between items-start mt-1">
                            <Link
                                href="/forgot-password"
                                className="text-sm font-bold text-gray-500 hover:text-red-600 hover:underline"
                            >
                                Forgot Password?
                            </Link>
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

            {/* Admin Mode Selection Modal */}
            <Modal
                isOpen={showModeSelection}
                onClose={() => { }} // Force selection
                title="Select Login Mode"
            >
                <div className="p-4">
                    <p className="text-center text-gray-600 mb-6">
                        You have Admin privileges. Please select which dashboard you would like to access.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleModeSelect('user')}
                            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#DA291C] hover:bg-red-50 transition-all group"
                        >
                            <User size={48} className="text-gray-400 group-hover:text-[#DA291C] mb-3" />
                            <span className="font-bold text-gray-700 group-hover:text-[#DA291C]">User Mode</span>
                            <span className="text-xs text-gray-400 mt-1">View as Staff</span>
                        </button>

                        <button
                            onClick={() => handleModeSelect('admin')}
                            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#DA291C] hover:bg-red-50 transition-all group"
                        >
                            <Shield size={48} className="text-gray-400 group-hover:text-[#DA291C] mb-3" />
                            <span className="font-bold text-gray-700 group-hover:text-[#DA291C]">Admin Mode</span>
                            <span className="text-xs text-gray-400 mt-1">Manage System</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
