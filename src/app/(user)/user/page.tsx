'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card } from '@/components/common/ui';
import { Gift, QrCode, ShoppingBag, Clock, Bell, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PointsCard } from '@/components/user/dashboard/PointsCard';
import { RewardLevelList } from '@/components/user/dashboard/RewardLevelList';
import { QRGeneratorModal } from '@/components/common/QRGeneratorModal';
import { AdminNewsApi } from '@/services/adminNews';
import { NewsItem } from '@/types';

interface Activity {
    id: string;
    type: 'received' | 'given' | 'redeem';
    date: string;
    points: number;
    message: string;
    status?: string;
}

export default function UserDashboard() {
    const { user: currentUser, refreshUser } = useAuth();
    const [showQR, setShowQR] = useState(false);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(true);

    useEffect(() => {
        if (currentUser) loadData();
    }, [currentUser]);

    const loadData = async () => {
        if (!currentUser) return;

        const newsData = await AdminNewsApi.getPublished();
        setNews(newsData);

        setLoadingActivities(true);
        try {
            const res = await fetch(`/api/activities?employeeId=${currentUser.id}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            }
        } catch (error) {
            console.error('Failed to load activities:', error);
        } finally {
            setLoadingActivities(false);
        }
    };

    const refreshData = async () => {
        await refreshUser();
        await loadData();
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'received': return <Gift size={16} />;
            case 'given': return <Send size={16} />;
            case 'redeem': return <ShoppingBag size={16} />;
            default: return <Gift size={16} />;
        }
    };

    const getActivityStyle = (type: string) => {
        switch (type) {
            case 'received': return { bg: 'bg-green-100', text: 'text-green-700', sign: '+', valueColor: 'text-green-600' };
            case 'given': return { bg: 'bg-orange-100', text: 'text-orange-700', sign: '-', valueColor: 'text-orange-600' };
            case 'redeem': return { bg: 'bg-red-100', text: 'text-red-700', sign: '-', valueColor: 'text-red-600' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', sign: '', valueColor: 'text-gray-600' };
        }
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PointsCard user={currentUser} />

            <div className="flex justify-end px-1">
                <Button onClick={() => setShowQR(true)} className="flex items-center gap-1 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm text-sm py-1 px-3">
                    <QrCode size={16} />
                    Show My QR
                </Button>
            </div>

            <RewardLevelList user={currentUser} onRedeemSuccess={refreshData} />

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
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Clock size={20} className="text-[#DA291C]" />
                    <h3 className="font-bold text-lg text-gray-900 opacity-90">Recent Activity</h3>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {loadingActivities ? (
                        <div className="p-6 text-center">
                            <Loader2 className="animate-spin text-gray-400 mx-auto" size={24} />
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No recent activity</div>
                    ) : (
                        activities.map((activity) => {
                            const style = getActivityStyle(activity.type);
                            return (
                                <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${style.bg} ${style.text}`}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-gray-500">
                                                    {new Date(activity.date).toLocaleDateString('th-TH', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {activity.type === 'redeem' && activity.status && (
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activity.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            activity.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {activity.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm ${style.valueColor}`}>
                                        {style.sign}{activity.points.toLocaleString()}
                                    </span>
                                </div>
                            );
                        })
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
