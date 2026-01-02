'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Modal } from '@/components/common/ui';
import { Users, AlertCircle, Info, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Employee {
    id: string;
    employeeCode: string;
    fullname: string;
    position: string;
    department: string;
    businessUnit: string;
    branch: string;
    role: string;
}

interface RewardCategory {
    id: string;
    name: string;
    color: string;
    icon?: string;
}

interface GroupRewardFormProps {
    onSuccess: () => void;
}

type OrgType = 'department' | 'businessUnit' | 'branch';
type DistMode = 'equal' | 'custom';

interface Allocation {
    recipientId: string;
    points: number;
}

export const GroupRewardForm: React.FC<GroupRewardFormProps> = ({ onSuccess }) => {
    const { user: currentUser, refreshUser } = useAuth();

    // Group Selection State
    const [orgType, setOrgType] = useState<OrgType>('department');
    const [selectedValue, setSelectedValue] = useState('');
    const [availableValues, setAvailableValues] = useState<string[]>([]);

    // Categories
    const [categories, setCategories] = useState<RewardCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    // Distribution State
    const [distMode, setDistMode] = useState<DistMode>('equal');
    const [totalPoints, setTotalPoints] = useState<string>('');
    const [message, setMessage] = useState('');

    // Members & Allocations
    const [members, setMembers] = useState<Employee[]>([]);
    const [customAllocations, setCustomAllocations] = useState<Record<string, number>>({});
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Load categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // Load available group values when type changes
    useEffect(() => {
        fetchGroupValues();
    }, [orgType]);

    // Load members when group value changes
    useEffect(() => {
        if (selectedValue) {
            fetchMembers();
        } else {
            setMembers([]);
        }
    }, [selectedValue, orgType]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/rewards/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
                if (data.length > 0) {
                    setSelectedCategoryId(data[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchGroupValues = async () => {
        try {
            // Fetch distinct group values only (still need all for dropdown options)
            const res = await fetch('/api/employees');
            if (res.ok) {
                const employees: Employee[] = await res.json();
                const values = [...new Set(employees.map(e => e[orgType]))].filter(Boolean).sort();
                setAvailableValues(values);
                setSelectedValue(values[0] || '');
            }
        } catch (err) {
            console.error('Failed to fetch group values:', err);
        }
    };

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            // Use optimized API - filter at database level
            const params = new URLSearchParams();
            params.set(orgType, selectedValue);
            if (currentUser?.id) {
                params.set('excludeId', currentUser.id);
            }

            const res = await fetch(`/api/employees/group?${params.toString()}`);
            if (res.ok) {
                const filtered: Employee[] = await res.json();
                setMembers(filtered);
                // Initialize custom allocations
                const initAlloc: Record<string, number> = {};
                filtered.forEach(m => { initAlloc[m.id] = 0; });
                setCustomAllocations(initAlloc);
            }
        } catch (err) {
            console.error('Failed to fetch members:', err);
        } finally {
            setLoadingMembers(false);
        }
    };

    // Calculate allocations
    const previewAllocations = useMemo(() => {
        if (members.length === 0) return [];

        if (distMode === 'equal') {
            const pointsPerPerson = parseInt(totalPoints) || 0;
            if (pointsPerPerson <= 0) return members.map(m => ({ user: m, points: 0 }));
            return members.map(m => ({ user: m, points: pointsPerPerson }));
        } else {
            return members.map(m => ({
                user: m,
                points: customAllocations[m.id] || 0
            }));
        }
    }, [members, distMode, totalPoints, customAllocations]);

    const totalAllocated = previewAllocations.reduce((sum, a) => sum + a.points, 0);

    const handleCustomPointsChange = (memberId: string, value: string) => {
        const pts = parseInt(value) || 0;
        setCustomAllocations(prev => ({
            ...prev,
            [memberId]: pts
        }));
    };

    const handleConfirm = async () => {
        setLoading(true);
        setError('');

        try {
            const allocations: Allocation[] = previewAllocations
                .filter(a => a.points > 0)
                .map(a => ({
                    recipientId: a.user.id,
                    points: a.points
                }));

            const res = await fetch('/api/rewards/give/group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    giverId: currentUser?.id,
                    groupType: orgType,
                    groupValue: selectedValue,
                    // For equal mode: send points per person. For custom mode: send total
                    totalPoints: distMode === 'equal' ? parseInt(totalPoints) || 0 : totalAllocated,
                    categoryId: selectedCategoryId,
                    message: message || undefined,
                    distributionMode: distMode,
                    customAllocations: distMode === 'custom' ? allocations : undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to distribute rewards');
            }

            setSuccess(true);
            // Refresh user data to update quota display
            await refreshUser();
            setTimeout(() => {
                onSuccess();
                setIsConfirmOpen(false);
                setTotalPoints('');
                setMessage('');
                setSuccess(false);
            }, 1500);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    if (!currentUser) {
        return <div className="p-4 text-center text-gray-500">Please log in to use this feature.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* 1. Group Selection */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">1. Select Group</h3>
                <div className="flex gap-2 mb-4 flex-wrap">
                    {(['department', 'businessUnit', 'branch'] as OrgType[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setOrgType(t)}
                            className={`px-4 py-2 rounded-full border font-medium transition-all ${orgType === t
                                ? 'bg-[#DA291C] text-white border-[#DA291C]'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-[#DA291C]'
                                }`}
                        >
                            {t === 'businessUnit' ? 'Business Unit' : t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                <select
                    className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-[#DA291C]/20 outline-none text-gray-900"
                    value={selectedValue}
                    onChange={e => setSelectedValue(e.target.value)}
                >
                    {availableValues.map(val => (
                        <option key={val} value={val}>{val}</option>
                    ))}
                </select>

                {loadingMembers && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                        <Loader2 className="animate-spin" size={14} /> Loading members...
                    </div>
                )}
                {!loadingMembers && members.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                        {members.length} member{members.length > 1 ? 's' : ''} found
                    </div>
                )}
            </div>

            {/* 2. Distribution Settings */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">2. Distribution</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#DA291C]/20 outline-none text-gray-900"
                            value={selectedCategoryId}
                            onChange={e => setSelectedCategoryId(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Distribution Mode</label>
                        <div className="flex gap-2">
                            <button
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition-all ${distMode === 'equal'
                                    ? 'bg-gray-800 text-white border-gray-800'
                                    : 'text-gray-600 border-gray-200 hover:border-gray-400'
                                    }`}
                                onClick={() => setDistMode('equal')}
                            >
                                Equal Split
                            </button>
                            <button
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition-all ${distMode === 'custom'
                                    ? 'bg-gray-800 text-white border-gray-800'
                                    : 'text-gray-600 border-gray-200 hover:border-gray-400'
                                    }`}
                                onClick={() => setDistMode('custom')}
                            >
                                Custom
                            </button>
                        </div>
                    </div>
                </div>

                {distMode === 'equal' && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Points per Person</label>
                        <Input
                            type="number"
                            placeholder="e.g. 50"
                            value={totalPoints}
                            onChange={e => setTotalPoints(e.target.value)}
                            className="text-lg font-mono font-bold"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Quota: {currentUser?.quotaRemaining?.toLocaleString() || 'N/A'}
                            {members.length > 0 && parseInt(totalPoints) > 0 && (
                                <span className="ml-2">
                                    → Total: {(parseInt(totalPoints) * members.length).toLocaleString()} pts ({members.length} people × {parseInt(totalPoints)} pts)
                                </span>
                            )}
                        </p>
                    </div>
                )}

                <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Message (Optional)</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#DA291C]/20 outline-none resize-none text-gray-900"
                        rows={2}
                        placeholder="Say something to the team..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                </div>
            </div>

            {/* 3. Preview */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Users size={16} /> Recipients ({members.length})
                    </h3>
                    <div className="text-sm">
                        Total: <span className="font-bold text-[#DA291C]">{totalAllocated.toLocaleString()} pts</span>
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto pr-2">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200">
                                <th className="pb-2">Name</th>
                                <th className="pb-2">Role</th>
                                <th className="pb-2 text-right">Allocation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {previewAllocations.map(alloc => (
                                <tr key={alloc.user.id}>
                                    <td className="py-2 text-gray-900">{alloc.user.fullname}</td>
                                    <td className="py-2 text-xs text-gray-500">{alloc.user.role}</td>
                                    <td className="py-2 text-right">
                                        {distMode === 'custom' ? (
                                            <input
                                                type="number"
                                                className="w-20 text-right p-1 border border-gray-300 rounded text-sm font-mono text-gray-900"
                                                value={customAllocations[alloc.user.id] || ''}
                                                onChange={e => handleCustomPointsChange(alloc.user.id, e.target.value)}
                                                placeholder="0"
                                            />
                                        ) : (
                                            <span className="font-mono font-bold text-gray-800">+{alloc.points}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {previewAllocations.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-4 text-center text-gray-400 italic">
                                        Select a group to see members
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <Button
                onClick={() => setIsConfirmOpen(true)}
                className="w-full py-3 text-lg font-bold shadow-md"
                disabled={previewAllocations.length === 0 || totalAllocated === 0}
            >
                🚀 Distribute {totalAllocated.toLocaleString()} Points
            </Button>

            {/* Confirm Modal */}
            <Modal isOpen={isConfirmOpen} onClose={() => !loading && setIsConfirmOpen(false)} title="Confirm Group Distribution">
                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Success!</h3>
                        <p className="text-gray-500 mt-2">Points distributed successfully</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3">
                            <Info className="text-amber-600 flex-shrink-0 mt-1" size={20} />
                            <div className="text-sm text-amber-800">
                                You are about to give <strong>{totalAllocated.toLocaleString()} points</strong> to <strong>{members.length} people</strong> in <strong>{selectedValue}</strong>.
                                <br /><br />
                                Your remaining quota will be: <strong>{((currentUser?.quotaRemaining || 0) - totalAllocated).toLocaleString()}</strong>
                            </div>
                        </div>

                        {selectedCategory && (
                            <div className="text-center">
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                                    style={{ backgroundColor: selectedCategory.color + '20', color: selectedCategory.color }}
                                >
                                    {selectedCategory.icon} {selectedCategory.name}
                                </span>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirm} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                {loading ? 'Processing...' : 'Confirm Distribution'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
