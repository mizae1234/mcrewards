'use client';

import React, { useEffect, useState } from 'react';
import { RewardHistoryEntry } from '@/types/rewards';
import { RewardsCatalogApi } from '@/services/rewardsCatalog';
import { FileText } from 'lucide-react';

const RewardHistory: React.FC = () => {
    const [history, setHistory] = useState<RewardHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await RewardsCatalogApi.getHistory();
            setHistory(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-gray-500" size={20} /> Audit Log
                </h3>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                            <tr>
                                <th className="px-4 py-3">Timestamp</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Reward</th>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Actor</th>
                                <th className="px-4 py-3">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.map(h => (
                                <tr key={h.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {new Date(h.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs font-bold uppercase">{h.action}</span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{h.rewardName}</td>
                                    <td className="px-4 py-3 text-gray-600">{h.employeeName}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{h.actor}</td>
                                    <td className="px-4 py-3 text-gray-500 italic text-xs">{h.note || '-'}</td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No logs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RewardHistory;
