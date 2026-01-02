'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EmployeesApiClient, Employee } from '@/services/employeesApi';
import { Button, Input, Modal } from '@/components/common/ui';
import { Edit, Trash, Plus, Search, FileUp, Download, X } from 'lucide-react';
import { useConfirm } from '@/components/common/ConfirmModal';

const ROLES = ['Admin', 'Executive', 'Middle Management', 'Staff'] as const;

const AdminEmployees: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { confirm } = useConfirm();

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Partial<Employee>>({});

    // Import Modal
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const data = await EmployeesApiClient.getAll();
            setEmployees(data);
        } catch (error) {
            console.error('Failed to load employees:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    const filteredEmployees = employees.filter(e =>
        e.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingEmployee.id) {
                await EmployeesApiClient.update(editingEmployee.id, editingEmployee);
            } else {
                await EmployeesApiClient.create(editingEmployee);
            }
            setIsEditModalOpen(false);
            setEditingEmployee({});
            loadEmployees();
        } catch (error: any) {
            alert(error.message || 'Error saving employee');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Employee',
            message: 'Are you sure you want to delete this employee? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;
        try {
            await EmployeesApiClient.delete(id);
            loadEmployees();
        } catch (error: any) {
            alert(error.message || 'Error deleting employee');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setImportResult(null);
            const result = await EmployeesApiClient.importExcel(file);
            setImportResult(result);
            if (result.errors.length === 0) {
                setTimeout(() => {
                    setIsImportModalOpen(false);
                    setImportResult(null);
                    loadEmployees();
                }, 2000);
            } else {
                loadEmployees();
            }
        } catch (error: any) {
            setImportResult({ created: 0, updated: 0, errors: [error.message] });
        }
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadTemplate = async () => {
        // Import xlsx dynamically
        const XLSX = await import('xlsx');

        // Create template data
        const templateData = [
            ['Employee Code', 'Email', 'Fullname', 'Position', 'BU', 'Department', 'Branch', 'Role', 'Quota'],
            ['E0001', 'john@mcdonalds.com', 'John Doe', 'Manager', 'HQ', 'HR', 'Main Office', 'Admin', 1000],
            ['E0002', 'jane@mcdonalds.com', 'Jane Smith', 'Staff', 'Site', 'Marketing', 'Bangkok', 'Staff', 0]
        ];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(templateData);

        // Set column widths
        ws['!cols'] = [
            { wch: 15 }, // Employee Code
            { wch: 25 }, // Email
            { wch: 20 }, // Fullname
            { wch: 20 }, // Position
            { wch: 10 }, // BU
            { wch: 15 }, // Department
            { wch: 15 }, // Branch
            { wch: 15 }, // Role
            { wch: 10 }, // Quota
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Employees');

        // Generate and download file
        XLSX.writeFile(wb, 'employee_import_template.xlsx');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Employees</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                        <FileUp size={16} className="mr-2" /> Import Excel
                    </Button>
                    <Button onClick={() => { setEditingEmployee({ role: 'Staff', quota: 0 }); setIsEditModalOpen(true); }}>
                        <Plus size={16} className="mr-2" /> Add Employee
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, email, or department..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3">Position</th>
                                    <th className="px-4 py-3">Department</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3 text-right">Points</th>
                                    <th className="px-4 py-3 text-right">Quota</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredEmployees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-mono text-gray-900">{emp.employeeCode}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${emp.fullname}`} className="w-8 h-8 rounded-full bg-gray-200" alt="" />
                                                <div>
                                                    <div className="font-bold text-gray-900">{emp.fullname}</div>
                                                    <div className="text-xs text-gray-500">{emp.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">{emp.position}</td>
                                        <td className="px-4 py-3 text-gray-900">
                                            <span className="block">{emp.businessUnit}</span>
                                            <span className="text-xs text-gray-400">{emp.department} • {emp.branch}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.role === 'Admin' ? 'bg-red-100 text-red-700' :
                                                emp.role === 'Executive' ? 'bg-purple-100 text-purple-700' :
                                                    emp.role === 'Middle Management' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-brand-yellow font-bold">{emp.pointsBalance.toLocaleString()}</td>

                                        <td className="px-4 py-3 text-right text-gray-900 font-mono">{emp.quota.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="outline" size="sm" onClick={() => { setEditingEmployee(emp); setIsEditModalOpen(true); }}>
                                                    <Edit size={14} />
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200" onClick={() => handleDelete(emp.id)}>
                                                    <Trash size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                            {searchTerm ? `No employees found matching "${searchTerm}"` : 'No employees yet. Add one or import from Excel.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit / Create Employee Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={editingEmployee.id ? 'Edit Employee' : 'Add Employee'}>
                <form onSubmit={handleSaveEmployee} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Employee Code</label>
                            <Input
                                value={editingEmployee.employeeCode || ''}
                                onChange={e => setEditingEmployee({ ...editingEmployee, employeeCode: e.target.value })}
                                required
                                placeholder="E0001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                            <Input
                                value={editingEmployee.email || ''}
                                onChange={e => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                                type="email"
                                required
                                placeholder="email@mcdonalds.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                        <Input
                            value={editingEmployee.fullname || ''}
                            onChange={e => setEditingEmployee({ ...editingEmployee, fullname: e.target.value })}
                            required
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Position</label>
                        <Input
                            value={editingEmployee.position || ''}
                            onChange={e => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                            required
                            placeholder="Chief Happiness Officer"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">BU</label>
                            <Input
                                value={editingEmployee.businessUnit || ''}
                                onChange={e => setEditingEmployee({ ...editingEmployee, businessUnit: e.target.value })}
                                placeholder="HQ"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Department</label>
                            <Input
                                value={editingEmployee.department || ''}
                                onChange={e => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                                placeholder="HR"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Branch</label>
                            <Input
                                value={editingEmployee.branch || ''}
                                onChange={e => setEditingEmployee({ ...editingEmployee, branch: e.target.value })}
                                placeholder="Main Office"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={editingEmployee.role || 'Staff'}
                                onChange={e => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                            >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Quota</label>
                            <Input
                                type="number"
                                value={editingEmployee.quota || 0}
                                onChange={e => setEditingEmployee({ ...editingEmployee, quota: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Employee</Button>
                    </div>
                </form>
            </Modal>

            {/* Import Excel Modal */}
            <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Employees from Excel">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Upload an Excel file (.xlsx) with the following columns:
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg text-xs font-mono">
                        Employee Code, Email, Fullname, Position, BU, Department, Branch, Role, Quota
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                            <Download size={14} className="mr-1" /> Download Template
                        </Button>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-red transition-colors">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="excel-upload"
                        />
                        <label htmlFor="excel-upload" className="cursor-pointer">
                            <FileUp size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Click to upload Excel file</p>
                            <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, or .csv</p>
                        </label>
                    </div>

                    {importResult && (
                        <div className={`p-4 rounded-lg text-sm ${importResult.errors.length > 0 ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-700'}`}>
                            <div className="font-bold flex justify-between">
                                <span>Import Result:</span>
                                <span>{importResult.created} Created, {importResult.updated} Updated</span>
                            </div>
                            {importResult.errors.length > 0 && (
                                <ul className="mt-2 list-disc list-inside text-xs">
                                    {importResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                                    {importResult.errors.length > 5 && <li>...and {importResult.errors.length - 5} more errors</li>}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminEmployees;
