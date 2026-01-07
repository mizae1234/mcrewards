'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, Input, Button } from '@/components/common/ui';
import {
    ArrowLeft,
    Calendar,
    Search,
    Download,
    ChevronUp,
    ChevronDown,
    Loader2,
    Users,
    User,
    Building2,
    MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface EmployeeData {
    id: string;
    employeeCode: string;
    name: string;
    department: string;
    branch: string;
    quota: number;
    pointsReceived: number;
    pointsUsed: number;
    balance: number;
}

interface GroupedData {
    name: string;
    totalEmployees: number;
    totalQuota: number;
    totalPointsReceived: number;
    totalPointsUsed: number;
    totalBalance: number;
}

type ViewMode = 'individual' | 'department' | 'branch';
type SortField = 'name' | 'department' | 'branch' | 'quota' | 'pointsReceived' | 'pointsUsed' | 'balance' | 'totalEmployees';
type SortOrder = 'asc' | 'desc';

const viewModes = [
    { id: 'individual' as ViewMode, label: 'รายบุคคล', icon: User },
    { id: 'department' as ViewMode, label: 'รายแผนก', icon: Building2 },
    { id: 'branch' as ViewMode, label: 'รายสาขา', icon: MapPin },
];

const EmployeePointsFullReport: React.FC = () => {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('individual');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<EmployeeData[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                start: dateRange.start,
                end: dateRange.end,
            });
            const res = await fetch(`/api/reports/employee-points?${params}`);
            if (res.ok) {
                const result = await res.json();
                setData(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load employee points report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApply = () => {
        loadData();
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Group data by department or branch
    const groupedData = useMemo((): GroupedData[] => {
        if (viewMode === 'individual') return [];

        const groupKey = viewMode === 'department' ? 'department' : 'branch';
        const groups: Record<string, GroupedData> = {};

        data.forEach(emp => {
            const key = emp[groupKey];
            if (!groups[key]) {
                groups[key] = {
                    name: key,
                    totalEmployees: 0,
                    totalQuota: 0,
                    totalPointsReceived: 0,
                    totalPointsUsed: 0,
                    totalBalance: 0,
                };
            }
            groups[key].totalEmployees++;
            groups[key].totalQuota += emp.quota;
            groups[key].totalPointsReceived += emp.pointsReceived;
            groups[key].totalPointsUsed += emp.pointsUsed;
            groups[key].totalBalance += emp.balance;
        });

        return Object.values(groups);
    }, [data, viewMode]);

    const filteredAndSortedData = useMemo(() => {
        if (viewMode === 'individual') {
            let result = [...data];

            // Filter by search
            if (search) {
                const searchLower = search.toLowerCase();
                result = result.filter(item =>
                    item.name.toLowerCase().includes(searchLower) ||
                    item.department.toLowerCase().includes(searchLower) ||
                    item.branch.toLowerCase().includes(searchLower) ||
                    item.employeeCode.toLowerCase().includes(searchLower)
                );
            }

            // Sort
            result.sort((a, b) => {
                let aVal: any = a[sortField as keyof EmployeeData];
                let bVal: any = b[sortField as keyof EmployeeData];

                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });

            return result;
        } else {
            let result = [...groupedData];

            // Filter by search
            if (search) {
                const searchLower = search.toLowerCase();
                result = result.filter(item =>
                    item.name.toLowerCase().includes(searchLower)
                );
            }

            // Sort
            result.sort((a, b) => {
                let aVal: any = a[sortField as keyof GroupedData] ?? a.name;
                let bVal: any = b[sortField as keyof GroupedData] ?? b.name;

                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });

            return result;
        }
    }, [data, groupedData, search, sortField, sortOrder, viewMode]);

    const handleExport = () => {
        let exportData: any[];

        if (viewMode === 'individual') {
            exportData = (filteredAndSortedData as EmployeeData[]).map(item => ({
                'รหัสพนักงาน': item.employeeCode,
                'ชื่อพนักงาน': item.name,
                'แผนก': item.department,
                'สาขา': item.branch,
                'Quota คงเหลือ': item.quota,
                'Points ที่ได้รับ': item.pointsReceived,
                'Points ที่ใช้ไป': item.pointsUsed,
                'ยอดคงเหลือ': item.balance
            }));
        } else {
            const label = viewMode === 'department' ? 'แผนก' : 'สาขา';
            exportData = (filteredAndSortedData as GroupedData[]).map(item => ({
                [label]: item.name,
                'จำนวนพนักงาน': item.totalEmployees,
                'รวม Quota': item.totalQuota,
                'รวม Points ที่ได้รับ': item.totalPointsReceived,
                'รวม Points ที่ใช้ไป': item.totalPointsUsed,
                'รวมยอดคงเหลือ': item.totalBalance
            }));
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        const sheetName = viewMode === 'individual' ? 'รายบุคคล' : viewMode === 'department' ? 'รายแผนก' : 'รายสาขา';
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `Employee_Points_Report_${viewMode}_${dateRange.start}_to_${dateRange.end}.xlsx`);
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronDown size={14} className="text-gray-300" />;
        return sortOrder === 'asc'
            ? <ChevronUp size={14} className="text-[#DA291C]" />
            : <ChevronDown size={14} className="text-[#DA291C]" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/admin/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">รายงาน Point ของพนักงาน</h2>
                            <p className="text-gray-500 text-sm">แสดง Quota, Points ที่ได้รับ/ใช้ไป และยอดคงเหลือ</p>
                        </div>
                    </div>
                </div>

                {/* View Mode Tabs */}
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
                    {viewModes.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => {
                                setViewMode(mode.id);
                                setSortField('name');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === mode.id
                                    ? 'bg-white text-[#DA291C] shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <mode.icon size={16} />
                            {mode.label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                    <div className="flex flex-wrap gap-4 flex-1">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">วันที่เริ่มต้น</label>
                            <Input
                                type="date"
                                value={dateRange.start}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-40"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">วันที่สิ้นสุด</label>
                            <Input
                                type="date"
                                value={dateRange.end}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-40"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">ค้นหา</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder={viewMode === 'individual' ? "ชื่อพนักงาน / แผนก / สาขา..." : `ค้นหา${viewMode === 'department' ? 'แผนก' : 'สาขา'}...`}
                                    value={search}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleApply}>
                            <Calendar size={16} className="mr-2" /> ค้นหา
                        </Button>
                        <Button onClick={handleExport} variant="secondary">
                            <Download size={16} className="mr-2" /> Export Excel
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : viewMode === 'individual' ? (
                    // Individual View
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">ชื่อพนักงาน <SortIcon field="name" /></div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('department')}>
                                        <div className="flex items-center gap-1">แผนก <SortIcon field="department" /></div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('branch')}>
                                        <div className="flex items-center gap-1">สาขา <SortIcon field="branch" /></div>
                                    </th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('quota')}>
                                        <div className="flex items-center justify-end gap-1">Quota คงเหลือ <SortIcon field="quota" /></div>
                                    </th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('pointsReceived')}>
                                        <div className="flex items-center justify-end gap-1">Points ได้รับ <SortIcon field="pointsReceived" /></div>
                                    </th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('pointsUsed')}>
                                        <div className="flex items-center justify-end gap-1">Points ใช้ไป <SortIcon field="pointsUsed" /></div>
                                    </th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('balance')}>
                                        <div className="flex items-center justify-end gap-1">ยอดคงเหลือ <SortIcon field="balance" /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(filteredAndSortedData as EmployeeData[]).map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-400">{item.employeeCode}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{item.department}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.branch}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-900">{item.quota.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-mono text-green-600">+{item.pointsReceived.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-mono text-purple-600">{item.pointsUsed.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {filteredAndSortedData.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400">ไม่พบข้อมูล</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // Grouped View (Department or Branch)
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">
                                            {viewMode === 'department' ? 'แผนก' : 'สาขา'} <SortIcon field="name" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('totalEmployees')}>
                                        <div className="flex items-center justify-end gap-1">จำนวนพนักงาน <SortIcon field="totalEmployees" /></div>
                                    </th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('quota')}>
                                        <div className="flex items-center justify-end gap-1">รวม Quota <SortIcon field="quota" /></div>
                                    </th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('pointsReceived')}>
                                        <div className="flex items-center justify-end gap-1">รวม Points ได้รับ <SortIcon field="pointsReceived" /></div>
                                    </th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('pointsUsed')}>
                                        <div className="flex items-center justify-end gap-1">รวม Points ใช้ไป <SortIcon field="pointsUsed" /></div>
                                    </th>
                                    <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('balance')}>
                                        <div className="flex items-center justify-end gap-1">รวมยอดคงเหลือ <SortIcon field="balance" /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(filteredAndSortedData as GroupedData[]).map((item) => (
                                    <tr key={item.name} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-700">{item.totalEmployees}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-900">{item.totalQuota.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-mono text-green-600">+{item.totalPointsReceived.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-mono text-purple-600">{item.totalPointsUsed.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.totalBalance.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {filteredAndSortedData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400">ไม่พบข้อมูล</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary Footer */}
                {!loading && filteredAndSortedData.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
                        {viewMode === 'individual' ? (
                            <>
                                แสดง {filteredAndSortedData.length} คน |
                                รวม Points ได้รับ: {(filteredAndSortedData as EmployeeData[]).reduce((sum, item) => sum + item.pointsReceived, 0).toLocaleString()} |
                                รวม Points ใช้: {(filteredAndSortedData as EmployeeData[]).reduce((sum, item) => sum + item.pointsUsed, 0).toLocaleString()}
                            </>
                        ) : (
                            <>
                                แสดง {filteredAndSortedData.length} {viewMode === 'department' ? 'แผนก' : 'สาขา'} |
                                รวมพนักงาน: {(filteredAndSortedData as GroupedData[]).reduce((sum, item) => sum + item.totalEmployees, 0).toLocaleString()} คน
                            </>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default EmployeePointsFullReport;
