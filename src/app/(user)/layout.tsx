'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Gift,
    ShoppingBag,
    History,
    MoreHorizontal
} from 'lucide-react';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const isActive = (path: string) => {
        if (path === '/user' || path === '/user/') {
            return pathname === '/user' || pathname === '/user/';
        }
        return pathname.startsWith(path);
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DA291C]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 pb-20">
            {/* Mobile Header */}
            <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-50">
                <img src="/images/logo.png" alt="Logo" className="h-6 mr-2" />
                <span className="font-bold text-gray-900 text-lg">Rewards</span>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4">
                {children}
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center px-6 py-2 z-50">
                <Link href="/user" className={`flex flex-col items-center gap-1 ${isActive('/user') && !isActive('/user/redeem') && !isActive('/user/give') && !isActive('/user/history') ? 'text-[#FFBC0D]' : 'text-gray-400'}`}>
                    <LayoutDashboard size={24} strokeWidth={isActive('/user') && !isActive('/user/redeem') && !isActive('/user/give') && !isActive('/user/history') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Dashboard</span>
                </Link>
                <Link href="/user/redeem" className={`flex flex-col items-center gap-1 ${isActive('/user/redeem') ? 'text-[#FFBC0D]' : 'text-gray-400'}`}>
                    <ShoppingBag size={24} strokeWidth={isActive('/user/redeem') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Rewards Catalog</span>
                </Link>
                <Link href="/user/give" className={`flex flex-col items-center gap-1 ${isActive('/user/give') ? 'text-[#FFBC0D]' : 'text-gray-400'}`}>
                    <Gift size={24} strokeWidth={isActive('/user/give') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Give Reward</span>
                </Link>
                <Link href="/user/history" className={`flex flex-col items-center gap-1 ${isActive('/user/history') ? 'text-[#FFBC0D]' : 'text-gray-400'}`}>
                    <History size={24} strokeWidth={isActive('/user/history') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">History</span>
                </Link>
                <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-gray-400">
                    <MoreHorizontal size={24} />
                    <span className="text-[10px] font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
