'use client';

import React from 'react';
import { Input, Button } from '@/components/common/ui';
import { Search, X, Filter as FilterIcon } from 'lucide-react';
import { ReportFilter } from '@/types/reports';

interface FilterProps {
    filter: ReportFilter;
    onChange: (newFilter: ReportFilter) => void;
}

const BUSINESS_UNITS = ['Operations', 'Corporate', 'Marketing', 'Technology'];
const DEPARTMENTS = ['Store Ops', 'Finance', 'HR', 'IT', 'Digital'];
const BRANCHES = ['Central World', 'Siam Paragon', 'Icon Siam', 'Head Office'];

export const ReportFilters: React.FC<FilterProps> = ({ filter, onChange }) => {

    const handleChange = (key: keyof ReportFilter, value: string) => {
        onChange({ ...filter, [key]: value });
    };

    const clearFilters = () => {
        onChange({
            startDate: '',
            endDate: '',
            businessUnit: '',
            department: '',
            branch: '',
            search: ''
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-bold mb-2">
                <FilterIcon size={20} className="text-brand-yellow" />
                <span>Filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">From</label>
                    <Input
                        type="date"
                        value={filter.startDate}
                        onChange={e => handleChange('startDate', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">To</label>
                    <Input
                        type="date"
                        value={filter.endDate}
                        onChange={e => handleChange('endDate', e.target.value)}
                    />
                </div>

                {/* Organization */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Business Unit</label>
                    <select
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow/50"
                        value={filter.businessUnit}
                        onChange={e => handleChange('businessUnit', e.target.value)}
                    >
                        <option value="">All Units</option>
                        {BUSINESS_UNITS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                    <select
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow/50"
                        value={filter.department}
                        onChange={e => handleChange('department', e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-2 border-t border-gray-50 mt-2">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search by name, ID..."
                        className="pl-10"
                        value={filter.search}
                        onChange={e => handleChange('search', e.target.value)}
                    />
                </div>

                <Button variant="outline" onClick={clearFilters} className="text-gray-500 hover:text-red-500 flex items-center gap-2">
                    <X size={16} /> Clear Filters
                </Button>
            </div>
        </div>
    );
};
