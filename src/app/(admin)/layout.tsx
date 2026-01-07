'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    ShoppingBag,
    History,
    Settings,
    LogOut,
    Menu,
    X,
    Activity,
    FileText,
} from 'lucide-react';
import { UserRole } from '@/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (user.role !== UserRole.ADMIN) {
            router.push('/user');
        }
    }, [user, isLoading, router]);

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const isActive = (path: string) => {
        if (path === '/admin/rewards') {
            return pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/rewards');
        }
        return pathname.startsWith(path);
    };

    const navItems = [
        { label: 'Rewards Catalog', icon: ShoppingBag, path: '/admin/rewards' },
        { label: 'History', icon: History, path: '/admin/history' },
        { label: 'Manage', icon: Settings, path: '/admin/manage' },
        { label: 'Monitor', icon: Activity, path: '/admin/monitor' },
        { label: 'Reports', icon: FileText, path: '/admin/reports' },
    ];

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DA291C]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
            {/* Mobile Header */}
            <div className="md:hidden bg-white text-gray-900 p-4 flex justify-between items-center shadow-md z-50 relative border-b border-gray-200">
                <div className="font-bold text-xl flex items-center gap-2">
                    <img src="/images/logo.png" alt="Logo" className="h-6" /> Rewards Admin
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:relative md:translate-x-0 transition duration-200 ease-in-out z-[100] w-64 bg-white text-gray-900 flex flex-col shadow-xl border-r border-gray-100`}
            >
                <div className="p-6 flex items-center justify-center border-b border-gray-100">
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <img src="/images/logo.png" alt="Logo" className="h-8" /> Rewards
                    </h1>
                </div>

                {/* User Section */}
                <div className="p-5 border-b border-[#DA291C] bg-[#DA291C] text-white shadow-inner">
                    <div className="flex items-center space-x-3 mb-4">
                        <img src={user.avatar} alt="User" className="w-12 h-12 rounded-full border-2 border-[#FFBC0D] shadow-sm" />
                        <div className="overflow-hidden">
                            <p className="font-bold text-base truncate">{user.fullname}</p>
                            <p className="text-xs text-[#FFBC0D] font-medium opacity-90">{user.role}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-black/20 rounded-lg p-2 backdrop-blur-sm">
                            <span className="block text-[10px] uppercase tracking-wider opacity-80 mb-1">Points</span>
                            <span className="font-bold text-xl text-[#FFBC0D] leading-none">{user.pointsBalance}</span>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2 backdrop-blur-sm">
                            <span className="block text-[10px] uppercase tracking-wider opacity-80 mb-1">Quota</span>
                            <span className="font-bold text-xl leading-none">{user.quotaRemaining}</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 py-4">
                    {navItems.map((item) => {
                        const active = item.path === '/admin'
                            ? isActive('/admin') && !isActive('/admin/rewards') && !isActive('/admin/history') && !isActive('/admin/manage') && !isActive('/admin/monitor') && !isActive('/admin/reports')
                            : isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 px-6 py-3 transition-colors duration-200 border-l-4 ${active
                                    ? 'border-[#DA291C] text-[#DA291C] font-bold bg-red-50'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-[#DA291C]'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-6 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-lg font-medium"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                {children}
            </main>
        </div>
    );
}
