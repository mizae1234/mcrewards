import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/common/ui';
import { User } from '../../types';
import { ShoppingBag, Gift, QrCode, TrendingUp } from 'lucide-react';
import { QRGeneratorModal } from '../../components/common/QRGeneratorModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { Api } from '../../services/api';

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      setTransactions(Api.getTransactions());
    }
  }, [currentUser]);

  if (!currentUser) return null;

  // Mock Data for Chart
  const chartData = [
    { day: 'Mon', given: 40, received: 20 },
    { day: 'Tue', given: 30, received: 50 },
    { day: 'Wed', given: 20, received: 10 },
    { day: 'Thu', given: 60, received: 40 },
    { day: 'Fri', given: 80, received: 60 },
    { day: 'Sat', given: 10, received: 0 },
    { day: 'Sun', given: 0, received: 0 },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {currentUser.name}!</h1>
          <p className="text-gray-500 text-sm">Here's what's happening with your rewards today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="block text-xs text-gray-400 font-medium uppercase tracking-wider">Current Balance</span>
            <span className="text-3xl font-bold text-[#FFBC0D] leading-none">{currentUser.pointsBalance} <span className="text-sm text-gray-400 font-normal">pts</span></span>
          </div>
          <Button onClick={() => setShowQR(true)} className="flex items-center gap-2 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm">
            <QrCode size={20} />
            Receive
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance */}
        <Card className="border-none shadow-sm border-l-4 border-l-red-600 p-4">
          <div className="flex justify-between items-start">
            <div className="bg-red-50 p-2 rounded-full text-red-600">
              <ShoppingBag size={20} />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">Points Balance</p>
              <p className="text-2xl font-bold text-gray-900">{currentUser.pointsBalance}</p>
            </div>
          </div>
        </Card>

        {/* Received */}
        <Card className="border-none shadow-sm border-l-4 border-l-[#FFBC0D] p-4">
          <div className="flex justify-between items-start">
            <div className="bg-yellow-50 p-2 rounded-full text-[#FFBC0D]">
              <Gift size={20} />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">Rewards Received</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.filter((t: any) => t.type === 'received').length}
              </p>
            </div>
          </div>
        </Card>

        {/* Given */}
        <Card className="border-none shadow-sm border-l-4 border-l-green-600 p-4">
          <div className="flex justify-between items-start">
            <div className="bg-green-50 p-2 rounded-full text-green-600">
              <TrendingUp size={20} />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">Rewards Given</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.filter((t: any) => t.type === 'sent').length}
              </p>
            </div>
          </div>
        </Card>

        {/* Redeemed */}
        <Card className="border-none shadow-sm border-l-4 border-l-blue-500 p-4">
          <div className="flex justify-between items-start">
            <div className="bg-blue-50 p-2 rounded-full text-blue-500">
              <ShoppingBag size={20} />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">Redeemed Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.filter((t: any) => t.type === 'redeem').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Charts (2/3 width) */}
        <Card className="lg:col-span-2 border-none shadow-sm p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-6">Activity Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="given" fill="#DB0007" radius={[4, 4, 0, 0]} name="Given" />
                <Bar dataKey="received" fill="#FFBC0D" radius={[4, 4, 0, 0]} name="Received" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Recent Activity List (1/3 width) */}
        <Card className="border-none shadow-sm p-6 h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-900">Recent Activity</h3>
          </div>
          <div className="space-y-6">
            {transactions.slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex gap-4 items-start">
                <div className={`p-2 rounded-full flex-shrink-0 ${t.type === 'received' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                  {t.type === 'received' ? <Gift size={16} /> : <ShoppingBag size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{t.message || (t.type === 'redeem' ? 'Redeemed Reward' : 'Transaction')}</p>
                  <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()} • {t.amount} pts</p>
                  {t.senderId && <p className="text-xs text-gray-400 italic mt-1">"{t.message}"</p>}
                </div>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-gray-400 text-center py-4">No recent activity.</p>}
          </div>
        </Card>
      </div>

      <QRGeneratorModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        user={currentUser}
      />
    </div>
  );
};

export default AdminDashboard;