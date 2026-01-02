'use client';

import React from 'react';
import AdminShell from '@/components/admin/shell/AdminShell';
import { useAuth } from '@/contexts/AuthContext';
import { Api } from '@/services/api';

export default function AdminManagePage() {
    const { user } = useAuth();
    const [report, setReport] = React.useState(Api.getReports());

    const refreshData = () => {
        setReport(Api.getReports());
    };

    if (!user) return null;

    return <AdminShell report={report} refreshData={refreshData} />;
}
