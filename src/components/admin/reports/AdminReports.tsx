'use client';

import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge } from '@/components/common/ui';
import {
    Users,
    Gift,
    TrendingUp,
    CreditCard,
    Building2,
    AlertCircle,
    Calendar,
    Award,
    Loader2
} from 'lucide-react';

interface DashboardData {
    kpi: {
        totalPointsIssued: number;
        totalPointsRedeemed: number;
        pendingRequests: number;
        activeUsersCount: number;
        activeDeptsCount: number;
    };
    catalog: Array<{
        id: string;
        name: string;
        category: string;
        pointsCost: number;
        stock: number;
        status: string;
        redeemedCount: number;
    }>;
    userActivity: Array<{
        id: string;
        name: string;
        department: string;
        given: number;
        received: number;
        redeemed: number;
    }>;
    teamActivity: Array<{
        department: string;
        given: number;
        received: number;
        redeemed: number;
        activeUsersCount: number;
    }>;
}

const AdminReports: React.FC = () => {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard?start=${dateRange.start}&end=${dateRange.end}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApply = () => {
        loadData();
    };

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    const mostActiveUser = data.userActivity.length > 0 ? data.userActivity[0] : null;
    const mostActiveDept = data.teamActivity.length > 0 ? data.teamActivity[0] : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
                    <p className="text-gray-500 text-sm">Overview of system activity and performance.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Start Date</label>
                        <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-40"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">End Date</label>
                        <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-40"
                        />
                    </div>
                    <Button onClick={handleApply}>
                        <Calendar size={16} className="mr-2" /> Apply
                    </Button>
                </div>
            </div>

            {/* 1. Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard
                    title="Points Issued"
                    value={data.kpi.totalPointsIssued.toLocaleString()}
                    subtitle="Total points given"
                    icon={Gift}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    trend="+12% vs last period"
                />
                <KPICard
                    title="Points Redeemed"
                    value={data.kpi.totalPointsRedeemed.toLocaleString()}
                    subtitle="Total points spent"
                    icon={CreditCard}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    trend="+5% vs last period"
                />
                <KPICard
                    title="Pending Requests"
                    value={data.kpi.pendingRequests.toLocaleString()}
                    subtitle="Awaiting approval"
                    icon={AlertCircle}
                    color="text-orange-600"
                    bg="bg-orange-50"
                    trend="Requires action"
                />
                <KPICard
                    title="Active Users"
                    value={data.kpi.activeUsersCount.toLocaleString()}
                    subtitle="In selected period"
                    icon={Users}
                    color="text-green-600"
                    bg="bg-green-50"
                    trend="Steady growth"
                />
                <KPICard
                    title="Active Depts"
                    value={data.kpi.activeDeptsCount.toLocaleString()}
                    subtitle="Participating teams"
                    icon={Building2}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                    trend="All operational"
                />
            </div>

            {/* 2. Catalog Management Summary */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Catalog Performance</h3>
                    <Badge color="gray">Top Redeemed</Badge>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-4 py-3">Item Name</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3 text-right">Cost (Pts)</th>
                                <th className="px-4 py-3 text-right">Redeemed</th>
                                <th className="px-4 py-3 text-right">Stock</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.catalog.slice(0, 5).map((item, idx) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            {idx < 3 && <TrophyIcon rank={idx + 1} />}
                                            {item.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{item.category}</td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-900">{item.pointsCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-800">{item.redeemedCount}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-mono ${item.stock < 10 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                            {item.stock}
                                        </span>
                                        {item.stock < 10 && <span className="text-[10px] text-red-500 ml-1 block">Low Stock</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge color={item.status === 'ACTIVE' ? 'green' : 'gray'}>
                                            {item.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                            {data.catalog.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No rewards in catalog</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* 3. User & Team Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* User Activity */}
                <div className="space-y-4">
                    {mostActiveUser && (
                        <Card className="p-4 bg-gradient-to-r from-blue-50 to-white border-blue-100 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-blue-500 uppercase mb-1">Most Active User</div>
                                <div className="text-lg font-bold text-gray-900">{mostActiveUser.name}</div>
                                <div className="text-sm text-gray-500">
                                    {(mostActiveUser.given + mostActiveUser.received).toLocaleString()} Pts Flow
                                </div>
                            </div>
                            <Award className="text-blue-300 w-10 h-10" />
                        </Card>
                    )}

                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-800">User Activity</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-gray-700 text-xs sticky top-0 z-10 shadow-sm font-bold">
                                    <tr>
                                        <th className="px-4 py-2">User</th>
                                        <th className="px-4 py-2 text-right">Given</th>
                                        <th className="px-4 py-2 text-right">Recv</th>
                                        <th className="px-4 py-2 text-right">Redeem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.userActivity.map(u => (
                                        <tr key={u.id}>
                                            <td className="px-4 py-2">
                                                <div className="font-medium text-gray-900">{u.name}</div>
                                                <div className="text-xs text-gray-400">{u.department}</div>
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-900">{u.given.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right text-green-600">+{u.received.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right text-purple-600">{u.redeemed}</td>
                                        </tr>
                                    ))}
                                    {data.userActivity.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No user activity in period</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Team Activity */}
                <div className="space-y-4">
                    {mostActiveDept && (
                        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-white border-indigo-100 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-indigo-500 uppercase mb-1">Most Active Dept</div>
                                <div className="text-lg font-bold text-gray-900">{mostActiveDept.department}</div>
                                <div className="text-sm text-gray-500">
                                    {(mostActiveDept.given + mostActiveDept.received).toLocaleString()} Pts Flow
                                </div>
                            </div>
                            <Building2 className="text-indigo-300 w-10 h-10" />
                        </Card>
                    )}

                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-800">Department Activity</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-gray-700 text-xs sticky top-0 z-10 shadow-sm font-bold">
                                    <tr>
                                        <th className="px-4 py-2">Dept</th>
                                        <th className="px-4 py-2 text-right">Given</th>
                                        <th className="px-4 py-2 text-right">Recv</th>
                                        <th className="px-4 py-2 text-right">Users</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.teamActivity.map(t => (
                                        <tr key={t.department}>
                                            <td className="px-4 py-2 font-medium text-gray-900">{t.department}</td>
                                            <td className="px-4 py-2 text-right text-gray-900">{t.given.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right text-green-600">+{t.received.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right font-bold">{t.activeUsersCount}</td>
                                        </tr>
                                    ))}
                                    {data.teamActivity.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No department activity in period</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
};

// --- Sub-components ---

const KPICard = ({ title, value, subtitle, icon: Icon, color, bg, trend }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                <Icon size={20} />
            </div>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{trend}</span>
        </div>
        <div>
            <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">{title}</h4>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
    </div>
);

const TrophyIcon = ({ rank }: { rank: number }) => {
    let color = 'text-yellow-500';
    if (rank === 2) color = 'text-gray-400';
    if (rank === 3) color = 'text-orange-600';
    return <TrendingUp size={16} className={color} />;
};

export default AdminReports;
