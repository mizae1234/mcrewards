'use client';

import React from 'react';
import { Button } from '@/components/common/ui';
import { Download } from 'lucide-react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface ReportTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onExport: () => void;
    isLoading?: boolean;
}

export function ReportTable<T extends { id: string | number }>({
    columns,
    data,
    onExport,
    isLoading
}: ReportTableProps<T>) {

    if (isLoading) {
        return <div className="p-12 text-center text-gray-400">Loading data...</div>;
    }

    if (data.length === 0) {
        return <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-lg">No records found matching your filters.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
                    <Download size={16} /> Export CSV
                </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-gray-500 bg-gray-50 border-b border-gray-100 uppercase text-xs tracking-wider">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className={`px-6 py-4 font-medium ${col.className || ''}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {data.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                {columns.map((col, idx) => (
                                    <td key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(row)
                                            : (row[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="text-xs text-gray-400 text-right">
                Showing {data.length} records
            </div>
        </div>
    );
}
