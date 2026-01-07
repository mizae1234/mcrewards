'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/ui';
import { Package, Users, ArrowRight } from 'lucide-react';

const reports = [
    {
        id: 'catalog',
        title: 'รายงาน Rewards Catalog',
        description: 'แสดงสินค้าใน Catalog พร้อมจำนวน redeem, stock คงเหลือ และสถานะ Active/Inactive',
        icon: Package,
        href: '/admin/reports/catalog',
        color: 'bg-purple-500',
        bgLight: 'bg-purple-50',
    },
    {
        id: 'employee-points',
        title: 'รายงาน Point ของพนักงาน',
        description: 'แสดงชื่อพนักงาน, Quota คงเหลือ, Points ที่ได้รับ/ใช้ไป และยอดคงเหลือ แยกดูได้ทั้งรายบุคคล/แผนก/สาขา',
        icon: Users,
        href: '/admin/reports/employee-points',
        color: 'bg-blue-500',
        bgLight: 'bg-blue-50',
    },
];

export default function AdminReportsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
                <p className="text-gray-500 text-sm">เลือกรายงานที่ต้องการดู พร้อม Filter และ Export เป็น Excel</p>
            </div>

            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report) => (
                    <Link key={report.id} href={report.href}>
                        <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-gray-200">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${report.color} text-white`}>
                                    <report.icon size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#DA291C] transition-colors">
                                        {report.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {report.description}
                                    </p>
                                </div>
                                <ArrowRight className="text-gray-300 group-hover:text-[#DA291C] group-hover:translate-x-1 transition-all" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
