import React, { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/shell/AdminShell';
import { KPIReport } from '../../types';
import { Api } from '../../services/api';

// Note: Admin Page now acts as a Controller for the Shell
// It fetches high-level shared data like Reports, but delegates Tab-specific data to the components themselves
// or passes specific handlers.
// The separate services (employees.ts, etc) are used inside the tabs.

const Admin: React.FC = () => {
    const [report, setReport] = useState<KPIReport | null>(null);

    const loadReport = async () => {
        // This could also be moved to a ReportsApi service
        const r = await Api.getReports();
        setReport(r);
    };

    useEffect(() => {
        loadReport();
    }, []);

    if (!report) return <div className="flex h-screen items-center justify-center">Loading Admin...</div>;

    return (
        <AdminShell report={report} refreshData={loadReport} />
    );
};

export default Admin;