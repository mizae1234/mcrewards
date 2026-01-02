'use client';

import React, { useEffect, useState } from 'react';
import { ReportFilter, EmployeePointsData } from '@/types/reports';
import { ReportsApi } from '@/services/reports';
import { ReportTable } from './ReportTable';
import { Chart } from './Charts';

interface Props {
    filter: ReportFilter;
}

export const EmployeePointsReport: React.FC<Props> = ({ filter }) => {
    const [data, setData] = useState<EmployeePointsData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const res = await ReportsApi.getEmployeePointsSummary(filter);
            setData(res);
            setLoading(false);
        };
        fetch();
    }, [filter]);

    const handleExport = () => {
        const csv = [
            ['ID', 'Name', 'Role', 'BU', 'Branch', 'Earned', 'Redeemed', 'Net'],
            ...data.map(r => [r.employeeCode, r.name, r.role, r.businessUnit, r.branch, r.pointsEarned, r.pointsRedeemed, r.netPoints])
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employee-points.csv';
        a.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-gray-500 text-sm font-medium uppercase">Total Points Earned</h4>
                    <p className="text-3xl font-bold text-brand-yellow mt-2">
                        {data.reduce((acc, curr) => acc + curr.pointsEarned, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-gray-500 text-sm font-medium uppercase">Total Points Redeemed</h4>
                    <p className="text-3xl font-bold text-brand-red mt-2">
                        {data.reduce((acc, curr) => acc + curr.pointsRedeemed, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-gray-500 text-sm font-medium uppercase">Active Employees</h4>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {data.length.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Top 10 Earners</h3>
                    <Chart
                        type="bar"
                        data={data.sort((a, b) => b.pointsEarned - a.pointsEarned).slice(0, 10)}
                        dataKey="pointsEarned"
                        categoryKey="name"
                        color="#FFBC0D"
                    />
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-4">Points by Role (Distribution)</h3>
                    <Chart
                        type="pie"
                        data={Object.entries(data.reduce((acc: any, curr) => {
                            acc[curr.role] = (acc[curr.role] || 0) + curr.pointsEarned;
                            return acc;
                        }, {})).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        categoryKey="name"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-4">Detailed Employee List</h3>
                <ReportTable<EmployeePointsData>
                    isLoading={loading}
                    data={data}
                    onExport={handleExport}
                    columns={[
                        { header: 'ID', accessor: 'employeeCode', className: 'font-mono text-gray-500' },
                        {
                            header: 'Name', accessor: item => (
                                <div>
                                    <div className="font-bold text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.role}</div>
                                </div>
                            )
                        },
                        { header: 'Business Unit', accessor: 'businessUnit' },
                        { header: 'Branch', accessor: 'branch' },
                        { header: 'Points Earned', accessor: item => <b className="text-green-600">+{item.pointsEarned.toLocaleString()}</b>, className: 'text-right' },
                        { header: 'Redeemed', accessor: item => <span className="text-red-500">-{item.pointsRedeemed.toLocaleString()}</span>, className: 'text-right' },
                        { header: 'Net Balance', accessor: item => item.netPoints.toLocaleString(), className: 'text-right font-bold' },
                    ]}
                />
            </div>
        </div>
    );
};
