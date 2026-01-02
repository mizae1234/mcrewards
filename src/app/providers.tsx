'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ConfirmProvider } from '@/components/common/ConfirmModal';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ConfirmProvider>
                {children}
            </ConfirmProvider>
        </AuthProvider>
    );
}
