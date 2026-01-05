'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Modal } from '@/components/common/ui';
import { Gift, QrCode, ShoppingBag, Clock, Bell, Send, Loader2, ChevronRight, Calendar, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PointsCard } from '@/components/user/dashboard/PointsCard';
import { RewardLevelList } from '@/components/user/dashboard/RewardLevelList';
import { QRGeneratorModal } from '@/components/common/QRGeneratorModal';
import { NewsApi, News } from '@/services/newsApi';

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
    const [news, setNews] = useState<News[]>([]);
    const [showAllNews, setShowAllNews] = useState(false);
    const [selectedNews, setSelectedNews] = useState<News | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(true);
    const [loadingNews, setLoadingNews] = useState(true);

    useEffect(() => {
        if (currentUser) loadData();
    }, [currentUser]);

    const loadData = async () => {
        if (!currentUser) return;

        // Load published news from new API
        setLoadingNews(true);
        try {
            const newsData = await NewsApi.getAll(false); // false = staff view (published only)
            setNews(newsData);
        } catch (error) {
            console.error('Failed to load news:', error);
        } finally {
            setLoadingNews(false);
        }

        // Load activities
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

    // Display only 3 news if not showing all
    const displayedNews = showAllNews ? news : news.slice(0, 3);

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

            {/* News Section */}
            {loadingNews ? (
                <div className="text-center py-6">
                    <Loader2 className="animate-spin text-gray-400 mx-auto" size={24} />
                </div>
            ) : news.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Bell size={20} className="text-[#DA291C]" />
                            <h3 className="font-bold text-lg text-gray-900 opacity-90">News & Updates</h3>
                        </div>
                        {news.length > 3 && !showAllNews && (
                            <button
                                onClick={() => setShowAllNews(true)}
                                className="text-sm text-[#DA291C] font-medium flex items-center gap-1 hover:underline"
                            >
                                View All ({news.length})
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-4">
                        {displayedNews.map(item => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setSelectedNews(item)}
                            >
                                {item.coverImage && (
                                    <div className="h-32 w-full bg-gray-100">
                                        <img src={item.coverImage} className="w-full h-full object-cover" alt="" />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                                        {item.publishedAt && (
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                                                <Calendar size={10} />
                                                {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{item.description || item.content}</p>
                                    <button className="text-sm text-[#DA291C] font-medium mt-2 hover:underline">
                                        Read More →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {showAllNews && news.length > 3 && (
                        <button
                            onClick={() => setShowAllNews(false)}
                            className="text-sm text-gray-500 hover:text-gray-700 mx-auto block"
                        >
                            Show Less
                        </button>
                    )}
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

            {/* News Detail Modal */}
            <Modal
                isOpen={!!selectedNews}
                onClose={() => setSelectedNews(null)}
                title={selectedNews?.title || ''}
            >
                {selectedNews && (
                    <div className="space-y-4">
                        {selectedNews.coverImage && (
                            <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                <img src={selectedNews.coverImage} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        {selectedNews.publishedAt && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Calendar size={14} />
                                {new Date(selectedNews.publishedAt).toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                        )}
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {selectedNews.content}
                        </div>
                        <Button
                            onClick={() => setSelectedNews(null)}
                            className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                            Close
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
