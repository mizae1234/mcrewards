'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        if (!isLoading && !user) {
            // Redirect to login page
            router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        }
    }, [user, isLoading, router, pathname]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-brand-gray">
                <div className="text-center">
                    <span className="text-brand-yellow text-4xl font-bold animate-pulse">M</span>
                    <p className="text-gray-500 mt-2 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
};

export default ProtectedRoute;
