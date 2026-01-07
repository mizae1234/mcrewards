'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, Input, Button, Badge } from '@/components/common/ui';
import {
    ArrowLeft,
    Calendar,
    Search,
    Download,
    ChevronUp,
    ChevronDown,
    Loader2,
    Package
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface CatalogItem {
    id: string;
    name: string;
    category: string;
    pointsCost: number;
    stock: number;
    status: string;
    redeemedCount: number;
}

type SortField = 'name' | 'category' | 'pointsCost' | 'redeemedCount' | 'stock' | 'status';
type SortOrder = 'asc' | 'desc';

const CatalogReport: React.FC = () => {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('redeemedCount');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CatalogItem[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                start: dateRange.start,
                end: dateRange.end,
            });
            const res = await fetch(`/api/reports/catalog?${params}`);
            if (res.ok) {
                const result = await res.json();
                setData(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load catalog report:', error);
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

    const filteredAndSortedData = useMemo(() => {
        let result = [...data];

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(searchLower) ||
                item.category.toLowerCase().includes(searchLower)
            );
        }

        // Sort
        result.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = (bVal as string).toLowerCase();
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [data, search, sortField, sortOrder]);

    const handleExport = () => {
        const exportData = filteredAndSortedData.map(item => ({
            'ชื่อสินค้า': item.name,
            'หมวดหมู่': item.category,
            'ราคา (Points)': item.pointsCost,
            'จำนวน Redeem': item.redeemedCount,
            'จำนวนคงเหลือ': item.stock,
            'สถานะ': item.status === 'ACTIVE' ? 'Active' : 'Inactive'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Catalog Report');
        XLSX.writeFile(wb, `Catalog_Report_${dateRange.start}_to_${dateRange.end}.xlsx`);
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
                        <div className="p-2 bg-purple-500 text-white rounded-lg">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">รายงาน Rewards Catalog</h2>
                            <p className="text-gray-500 text-sm">แสดงสินค้าใน Catalog พร้อมจำนวน redeem และ stock</p>
                        </div>
                    </div>
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
                                    placeholder="ชื่อสินค้า หรือ หมวดหมู่..."
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
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
                                <tr>
                                    <th
                                        className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-1">
                                            ชื่อสินค้า <SortIcon field="name" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center gap-1">
                                            หมวดหมู่ <SortIcon field="category" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('pointsCost')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            ราคา (Points) <SortIcon field="pointsCost" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('redeemedCount')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            จำนวน Redeem <SortIcon field="redeemedCount" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('stock')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            จำนวนคงเหลือ <SortIcon field="stock" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            สถานะ <SortIcon field="status" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAndSortedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.category}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-900">{item.pointsCost.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">{item.redeemedCount}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-mono ${item.stock < 10 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                                {item.stock}
                                            </span>
                                            {item.stock < 10 && <span className="text-[10px] text-red-500 ml-1 block">Low Stock</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge color={item.status === 'ACTIVE' ? 'green' : 'gray'}>
                                                {item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAndSortedData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                            ไม่พบข้อมูล
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary Footer */}
                {!loading && filteredAndSortedData.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
                        แสดง {filteredAndSortedData.length} รายการ |
                        รวม Redeem: {filteredAndSortedData.reduce((sum, item) => sum + item.redeemedCount, 0).toLocaleString()} ครั้ง
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CatalogReport;
