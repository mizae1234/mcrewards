'use client';

import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Modal } from '@/components/common/ui';
import { QuotaSetting, UserRole } from '@/types';
import { QuotasApi, QuotaChangeLog } from '@/services/quotas';
import { Info, History, ArrowUp, ArrowDown, Users, Loader2, CheckCircle, AlertTriangle, MinusCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface QuotaWithCount extends QuotaSetting {
    employeeCount?: number;
}

const AdminQuotas: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [quotas, setQuotas] = useState<QuotaWithCount[]>([]);
    const [logs, setLogs] = useState<QuotaChangeLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Distribute modal state
    const [distributeModal, setDistributeModal] = useState<{
        isOpen: boolean;
        role?: UserRole;
        amount?: number;
        employeeCount?: number;
    }>({ isOpen: false });
    const [distributing, setDistributing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        const [qData, lData] = await Promise.all([
            QuotasApi.getAll(),
            QuotasApi.getLogs()
        ]);
        setQuotas(qData);
        setLogs(lData);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    // Open distribute confirmation modal
    const openDistributeModal = (q: QuotaWithCount, inputId: string) => {
        const input = document.getElementById(inputId) as HTMLInputElement;
        const val = parseInt(input.value || '0');

        if (val === 0) {
            setErrorMessage('กรุณาระบุจำนวน points (บวก = เพิ่ม, ลบ = หัก)');
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }

        setDistributeModal({
            isOpen: true,
            role: q.role,
            amount: val,
            employeeCount: q.employeeCount || 0
        });
    };

    // Execute distribute
    const executeDistribute = async () => {
        if (!distributeModal.role || !distributeModal.amount) return;

        setDistributing(true);
        try {
            const adminId = currentUser?.id || currentUser?.fullname || 'Admin';
            const result = await QuotasApi.distribute(
                distributeModal.role,
                distributeModal.amount,
                adminId
            );

            // Show success message
            setSuccessMessage(result.message);
            setTimeout(() => setSuccessMessage(null), 5000);

            // Clear input
            const inputId = `input-${distributeModal.role}`;
            const input = document.getElementById(inputId) as HTMLInputElement;
            if (input) input.value = '';

            // Reload data
            await loadData();

            setDistributeModal({ isOpen: false });
        } catch (error: any) {
            setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการดำเนินการ');
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setDistributing(false);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Admin': return 'bg-red-500';
            case 'Executive': return 'bg-purple-500';
            case 'MiddleManagement': return 'bg-blue-500';
            case 'Staff': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'MiddleManagement': return 'Middle Management';
            default: return role;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Admin': return 'bg-red-100 text-red-700';
            case 'Executive': return 'bg-purple-100 text-purple-700';
            case 'MiddleManagement': return 'bg-blue-100 text-blue-700';
            case 'Staff': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const isDeduction = (distributeModal.amount || 0) < 0;

    return (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-top">
                    <CheckCircle size={20} />
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-top">
                    <AlertTriangle size={20} />
                    {errorMessage}
                </div>
            )}

            <Card className="p-8 max-w-4xl mx-auto">
                <div className="flex items-start gap-4 mb-8">
                    <div className="bg-brand-yellow/20 p-3 rounded-full text-yellow-700">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-xl">Allowance Settings</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            จัดการ points ให้พนักงานตาม role: <strong className="text-green-600">+</strong> = เพิ่ม, <strong className="text-red-600">-</strong> = หัก
                        </p>
                    </div>
                </div>

                {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
                    <div className="grid grid-cols-1 gap-6">
                        {quotas.map(q => (
                            <div key={q.role} className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${getRoleColor(q.role)}`}></div>
                                    <div>
                                        <span className="font-bold text-gray-800 text-lg block">{getRoleDisplayName(q.role)}</span>
                                        {q.employeeCount !== undefined && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                <Users size={12} />
                                                {q.employeeCount} employees
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                                        <Input
                                            type="number"
                                            placeholder="±0"
                                            className="w-24 border-none bg-transparent text-right font-mono font-bold text-lg focus-visible:ring-0 p-0"
                                            id={`input-${q.role}`}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => openDistributeModal(q, `input-${q.role}`)}
                                        className="bg-brand-yellow text-brand-dark hover:brightness-105"
                                        disabled={distributing}
                                    >
                                        Allocate
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* History Table */}
            <Card className="p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                        <History size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Distribution History</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="py-3 font-medium">Time</th>
                                <th className="py-3 font-medium">Role</th>
                                <th className="py-3 font-medium text-right">Points</th>
                                <th className="py-3 font-medium text-right">Employees</th>
                                <th className="py-3 font-medium">Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-400">No distribution history yet</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 text-gray-600">{new Date(log.timestamp).toLocaleString('th-TH')}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(log.role)}`}>
                                                {getRoleDisplayName(log.role)}
                                            </span>
                                        </td>
                                        <td className={`py-3 text-right font-mono ${log.changeAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {log.changeAmount > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                {log.changeAmount > 0 ? '+' : ''}{log.changeAmount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-3 text-right font-mono">{log.affectedCount || '-'}</td>
                                        <td className="py-3 text-gray-500">{log.adminId}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Distribute Confirmation Modal */}
            <Modal
                isOpen={distributeModal.isOpen}
                onClose={() => !distributing && setDistributeModal({ isOpen: false })}
                title={isDeduction ? "ยืนยันการหัก Points" : "ยืนยันการเพิ่ม Points"}
            >
                <div className="space-y-4">
                    <div className={`${isDeduction ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
                        <div className="flex items-start gap-3">
                            {isDeduction ? (
                                <MinusCircle className="text-red-600 mt-0.5" size={20} />
                            ) : (
                                <PlusCircle className="text-yellow-600 mt-0.5" size={20} />
                            )}
                            <div>
                                <p className={`font-bold ${isDeduction ? 'text-red-800' : 'text-yellow-800'}`}>
                                    คุณกำลังจะ{isDeduction ? 'หัก' : 'เพิ่ม'} Points {isDeduction ? 'ของ' : 'ให้'}พนักงานทุกคน
                                </p>
                                <div className={`mt-2 text-sm ${isDeduction ? 'text-red-700' : 'text-yellow-700'} space-y-1`}>
                                    <p><strong>Role:</strong> {getRoleDisplayName(distributeModal.role || '')}</p>
                                    <p>
                                        <strong>จำนวน Points:</strong> {isDeduction ? '' : '+'}{distributeModal.amount?.toLocaleString()} pts/คน
                                    </p>
                                    <p><strong>พนักงานที่จะ{isDeduction ? 'ถูกหัก' : 'ได้รับ'}:</strong> {distributeModal.employeeCount?.toLocaleString()} คน</p>
                                    {isDeduction && (
                                        <p className="text-xs mt-2 bg-red-100 p-2 rounded">
                                            ⚠️ หมายเหตุ: หากพนักงานมี points น้อยกว่าจำนวนที่หัก จะหักได้สูงสุดเท่าที่มี (ไม่ติดลบ)
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setDistributeModal({ isOpen: false })}
                            disabled={distributing}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            className={`flex-1 ${isDeduction ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                            onClick={executeDistribute}
                            disabled={distributing}
                        >
                            {distributing ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    กำลังดำเนินการ...
                                </>
                            ) : (
                                `ยืนยัน${isDeduction ? 'หัก' : 'เพิ่ม'} Points`
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminQuotas;
