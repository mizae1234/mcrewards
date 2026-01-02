'use client';

import React, { useState, useEffect } from 'react';
import { Card, Input } from '@/components/common/ui';
import { QuotaSetting, UserRole } from '@/types';
import { QuotasApi, QuotaChangeLog } from '@/services/quotas';
import { Info, History, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminQuotas: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [quotas, setQuotas] = useState<QuotaSetting[]>([]);
    const [logs, setLogs] = useState<QuotaChangeLog[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const [qData, lData] = await Promise.all([
            QuotasApi.getAll(),
            QuotasApi.getLogs()
        ]);
        setQuotas(qData);
        setLogs(lData);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleUpdate = async (role: UserRole, val: number) => {
        // if (!currentUser) return; // Removed strict check for debugging
        const adminId = currentUser?.id || 'Unknown Admin';

        // Optimistic update for UI smoothness
        setQuotas(quotas.map(q => q.role === role ? { ...q, monthlyQuota: val } : q));

        // Call API
        await QuotasApi.updateDefault(role, val, adminId);

        // Refresh logs to show the new entry
        const newLogs = await QuotasApi.getLogs();
        setLogs(newLogs);
    };

    return (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
            <Card className="p-8 max-w-4xl mx-auto">
                <div className="flex items-start gap-4 mb-8">
                    <div className="bg-brand-yellow/20 p-3 rounded-full text-yellow-700">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-xl">Allowance Settings</h3>
                        <p className="text-gray-500 text-sm mt-1">Configure points allowance for each role.</p>
                    </div>
                </div>

                {loading ? <div>Loading...</div> : (
                    <div className="grid grid-cols-1 gap-6">
                        {quotas.map(q => (
                            <div key={q.role} className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${q.role === 'Admin' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                                    <div>
                                        <span className="font-bold text-gray-800 text-lg block">{q.role}</span>
                                        <span className="text-sm text-gray-500">Current Allowance: <strong className="text-gray-900">{q.monthlyQuota.toLocaleString()}</strong> pts</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                                        <span className="px-3 text-gray-400 font-medium">+</span>
                                        <Input
                                            type="number"
                                            placeholder="Add..."
                                            className="w-24 border-none bg-transparent text-right font-mono font-bold text-lg focus-visible:ring-0 p-0"
                                            id={`input-${q.role}`}
                                            min="1"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById(`input-${q.role}`) as HTMLInputElement;
                                            const val = parseInt(input.value || '0');
                                            if (val > 0) {
                                                handleUpdate(q.role, q.monthlyQuota + val);
                                                input.value = '';
                                            }
                                        }}
                                        className="bg-brand-yellow text-brand-dark px-4 py-2 rounded-lg font-bold hover:brightness-105 transition-all text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* History Table */}
            <Card className="p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                        <History size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Change History</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="py-3 font-medium">Time</th>
                                <th className="py-3 font-medium">Role</th>
                                <th className="py-3 font-medium text-right">Change</th>
                                <th className="py-3 font-medium text-right">New Quota</th>
                                <th className="py-3 font-medium">Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-400">No history available</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 text-gray-600">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="py-3 font-medium">{log.role}</td>
                                        <td className={`py-3 text-right font-mono ${log.changeAmount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {log.changeAmount > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                {Math.abs(log.changeAmount)}
                                            </div>
                                        </td>
                                        <td className="py-3 text-right font-mono font-bold">{log.quotaAfter}</td>
                                        <td className="py-3 text-gray-500">{log.adminId}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminQuotas;
