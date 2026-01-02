'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, Transaction, TransactionType } from '@/types';
import { Card, Input, Badge, Button } from '@/components/common/ui';
import { Download, Search } from 'lucide-react';
import { Api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminHistoryPage() {
    const { user: currentUser } = useAuth();
    const [filter, setFilter] = useState<'ALL' | 'GIVE' | 'REDEEM'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    useEffect(() => {
        if (currentUser) {
            setTransactions(Api.getTransactions());
            setAllUsers(Api.getUsers());
        }
    }, [currentUser]);

    const getUserName = (id?: string) => allUsers.find(u => u.id === id)?.name || 'System';

    const filteredData = useMemo(() => {
        let data = [...transactions];

        if (filter === 'GIVE') data = data.filter(t => t.type === TransactionType.GIVE);
        if (filter === 'REDEEM') data = data.filter(t => t.type === TransactionType.REDEEM);

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(t =>
                t.message?.toLowerCase().includes(lower) ||
                getUserName(t.fromUserId).toLowerCase().includes(lower) ||
                getUserName(t.toUserId).toLowerCase().includes(lower)
            );
        }

        return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filter, searchTerm, allUsers]);

    const exportCSV = () => {
        const headers = "Date,Type,From,To,Amount,Message\n";
        const rows = filteredData.map(t =>
            `${new Date(t.date).toLocaleDateString()},${t.type},${getUserName(t.fromUserId)},${getUserName(t.toUserId)},${t.amount},"${t.message || ''}"`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'all_transactions.csv';
        a.click();
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Transaction History</h1>
                    <p className="text-gray-500 text-sm">View all system transactions as administrator.</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download size={16} /> Export CSV
                </Button>
            </div>

            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex bg-gray-100 p-1 rounded-md">
                        {['ALL', 'GIVE', 'REDEEM'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as typeof filter)}
                                className={`px-4 py-1.5 text-xs font-bold rounded ${filter === f ? 'bg-white shadow text-[#DA291C]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or message..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DA291C] text-gray-900 placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">From</th>
                                <th className="px-4 py-3">To</th>
                                <th className="px-4 py-3">Message</th>
                                <th className="px-4 py-3 text-right">Points</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No records found.</td></tr>
                            ) : (
                                filteredData.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {new Date(t.date).toLocaleDateString()} <span className="text-xs block">{new Date(t.date).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge color={t.type === TransactionType.REDEEM ? 'blue' : 'green'}>
                                                {t.type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{getUserName(t.fromUserId)}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{getUserName(t.toUserId)}</td>
                                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{t.message || '-'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-[#FFBC0D]">{t.amount}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-sm text-gray-400 text-right">
                    Total: {filteredData.length} transactions
                </div>
            </Card>
        </div>
    );
}
