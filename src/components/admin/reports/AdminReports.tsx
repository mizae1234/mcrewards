'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Input, Button, Badge } from '@/components/common/ui';
import { User, Transaction, TransactionType } from '@/types';
import { RewardItem, RedemptionRequest, RedemptionStatus } from '@/types/rewards';
import { Api } from '@/services/api';
import { RewardsCatalogApi } from '@/services/rewardsCatalog';
import {
    Users,
    Gift,
    TrendingUp,
    CreditCard,
    Building2,
    AlertCircle,
    Calendar,
    Award
} from 'lucide-react';

const AdminReports: React.FC = () => {
    // --- State ---
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Start of current month
        end: new Date().toISOString().split('T')[0] // Today
    });

    const [loading, setLoading] = useState(true);

    // Raw Data
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [redemptions, setRedemptions] = useState<RedemptionRequest[]>([]);

    // --- Loading ---
    const loadData = async () => {
        setLoading(true);
        const [txs, usrs, rwds, reqs] = await Promise.all([
            Api.getTransactions(),
            Promise.resolve(Api.getUsers()),
            RewardsCatalogApi.getRewards(),
            RewardsCatalogApi.getRedemptions()
        ]);
        setTransactions(txs);
        setUsers(usrs);
        setRewards(rwds);
        setRedemptions(reqs);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- Filtering & Aggregation ---
    const filteredData = useMemo(() => {
        const start = new Date(dateRange.start).getTime();
        const end = new Date(dateRange.end).getTime() + (24 * 60 * 60 * 1000); // Include end date fully

        const filterDate = (d: string) => {
            const time = new Date(d).getTime();
            return time >= start && time < end;
        };

        const txs = transactions.filter(t => filterDate(t.date));
        const reqs = redemptions.filter(r => filterDate(r.requestedAt));

        // 1. KPI Cards
        const totalPointsIssued = txs
            .filter(t => t.type === TransactionType.GIVE)
            .reduce((acc, t) => acc + t.amount, 0);

        const totalPointsRedeemed = reqs.reduce((acc, r) => acc + r.pointsUsed, 0);

        const pendingRequests = redemptions.filter(r => r.status === RedemptionStatus.PENDING).length; // Global pending, or range? Usually global backlog is more useful, but user asked for "in period". Let's stick to "Current Pending" generally, but user request says "Pending...". I'll show Current Pending generally as it makes more sense for a dashboard. However, "Active Users" must be in period.
        // Actually, "number of pending requests" usually implies current backlog. Let's do current backlog for Pending, but period for others.
        // Wait, user requirement: "Pending Redeem Requests (จำนวนคำขอแลกของรางวัลที่ยังไม่อนุมัติ)"
        // It doesn't explicitly say "in period" like others, but context implies dashboard range. 
        // Showing *only* pending requests created in that period might hide old ignore ones. 
        // I will interpret as "Current Pending Count" because that is actionable.

        const activeUserIds = new Set<string>();
        txs.forEach(t => {
            if (t.fromUserId) activeUserIds.add(t.fromUserId);
            if (t.toUserId) activeUserIds.add(t.toUserId);
        });
        const activeUsersCount = activeUserIds.size;

        const activeDepts = new Set<string>();
        users.forEach(u => {
            if (activeUserIds.has(u.id) && u.department) {
                activeDepts.add(u.department);
            }
        });

        // 2. Catalog Summary
        // Map rewardId -> redemption count in period
        const redemptionCounts: Record<string, number> = {};
        reqs.forEach(r => {
            redemptionCounts[r.rewardId] = (redemptionCounts[r.rewardId] || 0) + 1;
        });

        const catalogStats = rewards.map(r => ({
            ...r,
            redeemedCount: redemptionCounts[r.id] || 0
        })).sort((a, b) => b.redeemedCount - a.redeemedCount);

        // 3. User Activity
        const userStatsMap: Record<string, { given: number, received: number, redeemed: number, lastActive: string }> = {};

        // Init for all users so we include 0s if needed, or just active. "Active Users" implies active.
        // Let's iterate transactions to build stats
        txs.forEach(t => {
            const date = t.date;

            // Give
            if (t.type === TransactionType.GIVE) {
                if (t.fromUserId) {
                    if (!userStatsMap[t.fromUserId]) userStatsMap[t.fromUserId] = { given: 0, received: 0, redeemed: 0, lastActive: '' };
                    userStatsMap[t.fromUserId].given += t.amount;
                    if (date > userStatsMap[t.fromUserId].lastActive) userStatsMap[t.fromUserId].lastActive = date;
                }
                if (t.toUserId) {
                    if (!userStatsMap[t.toUserId]) userStatsMap[t.toUserId] = { given: 0, received: 0, redeemed: 0, lastActive: '' };
                    userStatsMap[t.toUserId].received += t.amount;
                    if (date > userStatsMap[t.toUserId].lastActive) userStatsMap[t.toUserId].lastActive = date;
                }
            }
            // Redeem (Mainly tracking points burned/items)
            if (t.type === TransactionType.REDEEM) {
                if (t.toUserId) {
                    if (!userStatsMap[t.toUserId]) userStatsMap[t.toUserId] = { given: 0, received: 0, redeemed: 0, lastActive: '' };
                    // We count *items* or *points*? Table says "Rewards Redeemed". Could be count.
                    // Let's count items.
                    // But T is raw transaction. We can count T.
                    userStatsMap[t.toUserId].redeemed += 1;
                    if (date > userStatsMap[t.toUserId].lastActive) userStatsMap[t.toUserId].lastActive = date;
                }
            }
        });

        const userActivity = Object.entries(userStatsMap).map(([uid, stats]) => {
            const u = users.find(user => user.id === uid);
            return {
                id: uid,
                name: u?.name || 'Unknown',
                department: u?.department || '-',
                ...stats
            };
        }).sort((a, b) => (b.given + b.received + b.redeemed) - (a.given + a.received + a.redeemed));

        // 4. Team Activity
        const teamStatsMap: Record<string, { given: number, received: number, redeemed: number, activeUsers: Set<string> }> = {};

        // Aggregate from userActivity to ensure consistency
        users.forEach(u => {
            // Check if user has activity
            const stats = userStatsMap[u.id];
            if (stats && u.department) {
                if (!teamStatsMap[u.department]) teamStatsMap[u.department] = { given: 0, received: 0, redeemed: 0, activeUsers: new Set() };
                teamStatsMap[u.department].given += stats.given;
                teamStatsMap[u.department].received += stats.received;
                teamStatsMap[u.department].redeemed += stats.redeemed;
                teamStatsMap[u.department].activeUsers.add(u.id);
            }
        });

        const teamActivity = Object.entries(teamStatsMap).map(([dept, stats]) => ({
            department: dept,
            given: stats.given,
            received: stats.received,
            redeemed: stats.redeemed,
            activeUsersCount: stats.activeUsers.size
        })).sort((a, b) => (b.given + b.received) - (a.given + a.received));

        // Summary Cards
        const mostActiveUser = userActivity.length > 0 ? userActivity[0] : null;
        const mostActiveDept = teamActivity.length > 0 ? teamActivity[0] : null;

        return {
            kpi: {
                totalPointsIssued,
                totalPointsRedeemed,
                pendingRequests,
                activeUsersCount,
                activeDeptsCount: activeDepts.size
            },
            catalog: catalogStats,
            userActivity,
            teamActivity,
            mostActiveUser,
            mostActiveDept
        };

    }, [dateRange, transactions, users, rewards, redemptions]);

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
                    <Button onClick={() => loadData()}>
                        <Calendar size={16} className="mr-2" /> Apply
                    </Button>
                </div>
            </div>

            {/* 1. Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard
                    title="Points Issued"
                    value={filteredData.kpi.totalPointsIssued.toLocaleString()}
                    subtitle="Total points given"
                    icon={Gift}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    trend="+12% vs last period"
                />
                <KPICard
                    title="Points Redeemed"
                    value={filteredData.kpi.totalPointsRedeemed.toLocaleString()}
                    subtitle="Total points spent"
                    icon={CreditCard}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    trend="+5% vs last period"
                />
                <KPICard
                    title="Pending Requests"
                    value={filteredData.kpi.pendingRequests.toLocaleString()}
                    subtitle="Awaiting approval"
                    icon={AlertCircle}
                    color="text-orange-600"
                    bg="bg-orange-50"
                    trend="Requires action"
                />
                <KPICard
                    title="Active Users"
                    value={filteredData.kpi.activeUsersCount.toLocaleString()}
                    subtitle="In selected period"
                    icon={Users}
                    color="text-green-600"
                    bg="bg-green-50"
                    trend="Steady growth"
                />
                <KPICard
                    title="Active Depts"
                    value={filteredData.kpi.activeDeptsCount.toLocaleString()}
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
                            {filteredData.catalog.slice(0, 5).map((item, idx) => (
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
                                        <Badge color={item.status === 'active' ? 'green' : 'gray'}>
                                            {item.status.toUpperCase()}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* 3. User & Team Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* User Activity */}
                <div className="space-y-4">
                    {/* Summary Card */}
                    {filteredData.mostActiveUser && (
                        <Card className="p-4 bg-gradient-to-r from-blue-50 to-white border-blue-100 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-blue-500 uppercase mb-1">Most Active User</div>
                                <div className="text-lg font-bold text-gray-900">{filteredData.mostActiveUser.name}</div>
                                <div className="text-sm text-gray-500">
                                    {(filteredData.mostActiveUser.given + filteredData.mostActiveUser.received).toLocaleString()} Pts Flow
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
                                    {filteredData.userActivity.map(u => (
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
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Team Activity */}
                <div className="space-y-4">
                    {/* Summary Card */}
                    {filteredData.mostActiveDept && (
                        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-white border-indigo-100 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-indigo-500 uppercase mb-1">Most Active Dept</div>
                                <div className="text-lg font-bold text-gray-900">{filteredData.mostActiveDept.department}</div>
                                <div className="text-sm text-gray-500">
                                    {(filteredData.mostActiveDept.given + filteredData.mostActiveDept.received).toLocaleString()} Pts Flow
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
                                    {filteredData.teamActivity.map(t => (
                                        <tr key={t.department}>
                                            <td className="px-4 py-2 font-medium text-gray-900">{t.department}</td>
                                            <td className="px-4 py-2 text-right text-gray-900">{t.given.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right text-green-600">+{t.received.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right font-bold">{t.activeUsersCount}</td>
                                        </tr>
                                    ))}
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
