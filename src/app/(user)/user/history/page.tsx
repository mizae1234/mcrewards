'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, Input, Badge, Button } from '@/components/common/ui';
import { Download, Loader2, ArrowUpRight, ArrowDownLeft, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TransactionAllocation {
    id: string;
    points: number;
    recipient: {
        id: string;
        employeeCode: string;
        fullname: string;
        department: string;
        avatar?: string;
    };
    category: {
        id: string;
        name: string;
        color: string;
        icon?: string;
    };
}

interface Transaction {
    id: string;
    type: 'SINGLE' | 'GROUP' | 'ADJUSTMENT';
    totalPoints: number;
    status: string;
    message?: string;
    groupType?: string;
    groupValue?: string;
    source: string;
    createdAt: string;
    giver: {
        id: string;
        employeeCode: string;
        fullname: string;
        department: string;
        avatar?: string;
    };
    allocations: TransactionAllocation[];
}

interface ApiResponse {
    transactions: Transaction[];
    total: number;
    hasMore: boolean;
}

export default function HistoryPage() {
    const { user: currentUser } = useAuth();
    const [filter, setFilter] = useState<'ALL' | 'RECEIVED' | 'GIVEN'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchTransactions();
        }
    }, [currentUser]);

    const fetchTransactions = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            // Fetch all transactions where user is giver or recipient
            const [givenRes, receivedRes] = await Promise.all([
                fetch(`/api/rewards/transactions?giverId=${currentUser.id}&limit=100`),
                fetch(`/api/rewards/transactions?recipientId=${currentUser.id}&limit=100`)
            ]);

            const givenData: ApiResponse = await givenRes.json();
            const receivedData: ApiResponse = await receivedRes.json();

            // Combine and dedupe
            const allTransactions = [...givenData.transactions, ...receivedData.transactions];
            const uniqueTransactions = allTransactions.filter((t, index, self) =>
                index === self.findIndex(x => x.id === t.id)
            );

            setTransactions(uniqueTransactions);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        if (!currentUser) return [];

        let data = [...transactions];

        if (filter === 'GIVEN') {
            data = data.filter(t => t.giver.id === currentUser.id);
        } else if (filter === 'RECEIVED') {
            data = data.filter(t =>
                t.allocations.some(a => a.recipient.id === currentUser.id)
            );
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(t =>
                t.message?.toLowerCase().includes(lower) ||
                t.giver.fullname.toLowerCase().includes(lower) ||
                t.allocations.some(a => a.recipient.fullname.toLowerCase().includes(lower))
            );
        }

        return data.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [transactions, currentUser, filter, searchTerm]);

    const exportCSV = () => {
        const headers = "Date,Type,From,To,Points,Category,Message\n";
        const rows = filteredData.flatMap(t =>
            t.allocations.map(a =>
                `${new Date(t.createdAt).toLocaleDateString()},${t.type},${t.giver.fullname},${a.recipient.fullname},${a.points},"${a.category.name}","${t.message || ''}"`
            )
        ).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transaction_history.csv';
        a.click();
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download size={16} className="mr-2" /> Export CSV
                </Button>
            </div>

            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex bg-gray-100 p-1 rounded-md">
                        {['ALL', 'RECEIVED', 'GIVEN'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as typeof filter)}
                                className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${filter === f
                                        ? 'bg-white shadow text-[#DA291C]'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {f === 'RECEIVED' && <ArrowDownLeft size={12} className="inline mr-1" />}
                                {f === 'GIVEN' && <ArrowUpRight size={12} className="inline mr-1" />}
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1">
                        <Input
                            placeholder="Search by name or message..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Details</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3 text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                            <Gift className="mx-auto mb-2 opacity-50" size={32} />
                                            No transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map(t => {
                                        const isGiver = t.giver.id === currentUser.id;
                                        const myAllocation = t.allocations.find(a => a.recipient.id === currentUser.id);

                                        return (
                                            <tr key={t.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                    <div>{new Date(t.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-xs">{new Date(t.createdAt).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge color={isGiver ? 'yellow' : 'green'}>
                                                        {isGiver ? (
                                                            <><ArrowUpRight size={10} className="inline mr-1" />GIVEN</>
                                                        ) : (
                                                            <><ArrowDownLeft size={10} className="inline mr-1" />RECEIVED</>
                                                        )}
                                                    </Badge>
                                                    {t.type === 'GROUP' && (
                                                        <div className="text-xs text-gray-400 mt-1">Group ({t.allocations.length})</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">
                                                        {isGiver ? (
                                                            t.allocations.length === 1
                                                                ? `To: ${t.allocations[0].recipient.fullname}`
                                                                : `To: ${t.groupValue} (${t.allocations.length} people)`
                                                        ) : (
                                                            `From: ${t.giver.fullname}`
                                                        )}
                                                    </div>
                                                    {t.message && (
                                                        <div className="text-xs text-gray-500 italic truncate max-w-xs mt-1">
                                                            "{t.message}"
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {t.allocations[0] && (
                                                        <span
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                                            style={{
                                                                backgroundColor: t.allocations[0].category.color + '20',
                                                                color: t.allocations[0].category.color
                                                            }}
                                                        >
                                                            {t.allocations[0].category.icon} {t.allocations[0].category.name}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${isGiver ? 'text-red-500' : 'text-green-600'}`}>
                                                    {isGiver ? '-' : '+'}
                                                    {isGiver ? t.totalPoints : myAllocation?.points || t.totalPoints}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-[#DA291C]">
                        {transactions.filter(t => t.giver.id === currentUser.id).length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Times Given</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {transactions.filter(t => t.allocations.some(a => a.recipient.id === currentUser.id)).length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Times Received</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">
                        {transactions
                            .filter(t => t.giver.id === currentUser.id)
                            .reduce((sum, t) => sum + t.totalPoints, 0)
                            .toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Points Given</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">
                        {transactions
                            .flatMap(t => t.allocations)
                            .filter(a => a.recipient.id === currentUser.id)
                            .reduce((sum, a) => sum + a.points, 0)
                            .toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">Points Received</div>
                </Card>
            </div>
        </div>
    );
}
