'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card } from '@/components/common/ui';
import { Gift, QrCode, ShoppingBag, Clock, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PointsCard } from '@/components/user/dashboard/PointsCard';
import { RewardLevelList } from '@/components/user/dashboard/RewardLevelList';
import { QRGeneratorModal } from '@/components/common/QRGeneratorModal';
import { Api } from '@/services/api';
import { AdminNewsApi } from '@/services/adminNews';
import { NewsItem } from '@/types';

export default function UserDashboard() {
    const { user: currentUser } = useAuth();
    const [showQR, setShowQR] = useState(false);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const newsData = await AdminNewsApi.getPublished();
            setNews(newsData);
            const txs = Api.getTransactions();
            setTransactions(txs.filter((t: any) => t.toUserId === currentUser?.id || t.fromUserId === currentUser?.id));
        };
        if (currentUser) loadData();
    }, [currentUser]);

    const refreshData = () => {
        const txs = Api.getTransactions();
        setTransactions(txs.filter((t: any) => t.toUserId === currentUser?.id || t.fromUserId === currentUser?.id));
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Points Card & Level Progress */}
            <PointsCard user={currentUser} />

            <div className="flex justify-end px-1">
                <Button onClick={() => setShowQR(true)} className="flex items-center gap-1 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm text-sm py-1 px-3">
                    <QrCode size={16} />
                    Show My QR
                </Button>
            </div>

            {/* 2. Rewards Path */}
            <RewardLevelList user={currentUser} onRedeemSuccess={refreshData} />

            {/* 4. News Feed (Dynamic) */}
            {news.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Bell size={20} className="text-[#DA291C]" />
                        <h3 className="font-bold text-lg text-gray-900 opacity-90">News & Updates</h3>
                    </div>
                    <div className="space-y-4">
                        {news.map(item => (
                            <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                {item.imageUrl && (
                                    <div className="h-32 w-full bg-gray-100">
                                        <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                                        {item.publishDate && <span className="text-[10px] text-gray-400">{new Date(item.publishDate).toLocaleDateString()}</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{item.summary}</p>
                                    <Button variant="outline" size="sm" className="mt-2 text-xs p-0 h-auto hover:bg-transparent text-[#DA291C] font-bold border-none shadow-none hover:text-[#DA291C] hover:underline">Read more</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 6. Recent Activity Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Clock size={20} className="text-[#DA291C]" />
                    <h3 className="font-bold text-lg text-gray-900 opacity-90">Recent Activity</h3>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No recent activity</div>
                    ) : (
                        transactions.slice(0, 5).map((t: any) => (
                            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${t.type === 'received' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {t.type === 'received' ? <Gift size={16} /> : <ShoppingBag size={16} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{t.message || 'Transaction'}</p>
                                        <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm ${t.type === 'received' ? 'text-green-600' : 'text-gray-900'}`}>
                                    {t.type === 'received' ? '+' : '-'}{t.amount}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <QRGeneratorModal
                isOpen={showQR}
                onClose={() => setShowQR(false)}
                user={currentUser}
            />
        </div>
    );
}
