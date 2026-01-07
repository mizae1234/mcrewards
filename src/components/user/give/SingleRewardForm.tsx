'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/common/ui';
import { Search, QrCode, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { QRScannerModal as QRScannerModalReal } from '@/components/common/QRScannerModal';

// Note: refreshUser is called after successful transaction to update quota display

interface Employee {
    id: string;
    employeeCode: string;
    fullname: string;
    email: string;
    position: string;
    department: string;
    businessUnit: string;
    branch: string;
    pointsBalance: number;
    avatar?: string;
}

interface RewardCategory {
    id: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
}

interface SingleRewardFormProps {
    onSuccess: () => void;
}

// Status Badge Colors (WCAG AA Compliant)
const STATUS_COLORS = {
    active: { bg: '#DCFCE7', text: '#166534', border: '#22C55E' },
    inactive: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
    disabled: { bg: '#F3F4F6', text: '#9CA3AF', border: '#D1D5DB' }
};

export const SingleRewardForm: React.FC<SingleRewardFormProps> = ({ onSuccess }) => {
    const { user: currentUser, refreshUser } = useAuth();

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Employee[]>([]);
    const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);

    // Categories
    const [categories, setCategories] = useState<RewardCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    // Form State
    const [points, setPoints] = useState<string>('');
    const [message, setMessage] = useState('');

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // QR Mock
    const [isQRScanOpen, setIsQRScanOpen] = useState(false);
    const [qrInput, setQrInput] = useState('');

    // Load categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

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

    // Search employees
    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const res = await fetch(`/api/employees?search=${encodeURIComponent(term)}`);
            if (res.ok) {
                const data = await res.json();
                // Filter out current user
                const filtered = data.filter((e: Employee) => e.id !== currentUser?.id);
                setSearchResults(filtered.slice(0, 5));
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectUser = (employee: Employee) => {
        setSelectedUser(employee);
        setSearchTerm('');
        setSearchResults([]);
        setError('');
    };

    const validate = () => {
        if (!selectedUser) return "Please select a recipient.";
        const pts = parseInt(points);
        if (isNaN(pts) || pts <= 0) return "Please enter valid points.";
        if (!selectedCategoryId) return "Please select a category.";
        // Quota check will be done server-side
        return null;
    };

    const handleSubmit = async () => {
        const err = validate();
        if (err) {
            setError(err);
            return;
        }
        setIsConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/rewards/give/single', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    giverId: currentUser?.id,
                    recipientId: selectedUser!.id,
                    points: parseInt(points),
                    categoryId: selectedCategoryId,
                    message: message || undefined,
                    source: 'manual'
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send reward');
            }

            setSuccess(true);
            // Refresh user data to update quota display
            await refreshUser();
            setTimeout(() => {
                onSuccess();
                setIsConfirmOpen(false);
                // Reset form
                setSelectedUser(null);
                setPoints('');
                setMessage('');
                setSuccess(false);
            }, 1500);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQRScan = async () => {
        try {
            const res = await fetch(`/api/employees?search=${encodeURIComponent(qrInput)}`);
            if (res.ok) {
                const data = await res.json();
                const found = data.find((e: Employee) =>
                    e.employeeCode === qrInput || e.id === qrInput
                );
                if (found) {
                    if (found.id === currentUser?.id) {
                        throw new Error("Cannot scan your own QR.");
                    }
                    handleSelectUser(found);
                    setIsQRScanOpen(false);
                    setQrInput('');
                } else {
                    throw new Error("User not found.");
                }
            }
        } catch (e: any) {
            setError(e.message);
        }
    };

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    if (!currentUser) {
        return <div className="p-4 text-center text-gray-500">Please log in to use this feature.</div>;
    }

    return (
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Recipient Selection */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Select Recipient
                </h3>

                {!selectedUser ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DA291C]/20 focus:border-[#DA291C] outline-none transition-all text-gray-900"
                                placeholder="Search by name or employee code..."
                                value={searchTerm}
                                onChange={e => handleSearch(e.target.value)}
                            />
                            {searchLoading && (
                                <Loader2 className="absolute right-3 top-3 text-gray-400 animate-spin" size={20} />
                            )}
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map(emp => (
                                        <div
                                            key={emp.id}
                                            className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-none"
                                            onClick={() => handleSelectUser(emp)}
                                        >
                                            <img
                                                src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${emp.fullname}`}
                                                className="w-10 h-10 rounded-full bg-gray-200"
                                                alt=""
                                            />
                                            <div>
                                                <div className="font-bold text-sm text-gray-800">{emp.fullname}</div>
                                                <div className="text-xs text-gray-500">{emp.employeeCode} • {emp.position}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full py-4 border-dashed border-2 hover:border-[#DA291C]/50 hover:bg-[#DA291C]/5"
                            onClick={() => setIsQRScanOpen(true)}
                        >
                            <QrCode className="mr-2" /> Scan Recipient QR
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-3">
                            <img
                                src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.fullname}`}
                                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                                alt=""
                            />
                            <div>
                                <div className="font-bold text-gray-900">{selectedUser.fullname}</div>
                                <div className="text-sm text-gray-600">{selectedUser.employeeCode} • {selectedUser.position}</div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(null)}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                        >
                            Change
                        </Button>
                    </div>
                )}
            </div>

            {/* Reward Details */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Points</label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={points}
                            onChange={e => setPoints(e.target.value)}
                            className="text-lg font-mono font-bold"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Quota: {currentUser?.quotaRemaining?.toLocaleString() || 'N/A'}
                        </p>
                    </div>
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
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Message (Optional)</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#DA291C]/20 outline-none resize-none text-gray-900"
                        rows={3}
                        placeholder="Say something nice..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <Button
                onClick={handleSubmit}
                className="w-full py-3 text-lg font-bold shadow-md"
                disabled={!selectedUser || !points || parseInt(points) <= 0}
            >
                🎁 Send Reward
            </Button>

            {/* Confirm Modal */}
            <Modal isOpen={isConfirmOpen} onClose={() => !loading && setIsConfirmOpen(false)} title="Confirm Transaction">
                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Success!</h3>
                        <p className="text-gray-500 mt-2">Points sent successfully</p>
                    </div>
                ) : (
                    <div className="text-center space-y-4 py-4">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">🎁</span>
                        </div>
                        <div>
                            <p className="text-gray-500">You are giving</p>
                            <div className="text-4xl font-black text-[#DA291C] my-1">
                                {parseInt(points || '0').toLocaleString()} pts
                            </div>
                            <p className="text-gray-500">
                                to <span className="font-bold text-gray-800">{selectedUser?.fullname}</span>
                            </p>
                            {selectedCategory && (
                                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                                    style={{ backgroundColor: selectedCategory.color + '20', color: selectedCategory.color }}
                                >
                                    {selectedCategory.icon} {selectedCategory.name}
                                </div>
                            )}
                        </div>
                        {message && (
                            <div className="bg-gray-50 p-3 rounded italic text-gray-600 text-sm">
                                "{message}"
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        <div className="pt-4 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setIsConfirmOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleConfirm} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                {loading ? 'Sending...' : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* QR Scanner Modal */}
            {isQRScanOpen && (
                <QRScannerModalReal
                    onClose={() => setIsQRScanOpen(false)}
                    onSuccess={async (scannedData) => {
                        console.log('QR Scanned Data:', scannedData);
                        // Close modal first
                        setIsQRScanOpen(false);

                        try {
                            // Try to find user by scanned data
                            const res = await fetch(`/api/employees?search=${encodeURIComponent(scannedData)}`);
                            if (res.ok) {
                                const data = await res.json();
                                console.log('Search results:', data);

                                // Try to find exact match
                                let found = data.find((e: Employee) =>
                                    e.employeeCode === scannedData || e.id === scannedData
                                );

                                // If no exact match, try partial match
                                if (!found && data.length > 0) {
                                    found = data[0];
                                }

                                if (found) {
                                    if (found.id === currentUser?.id) {
                                        setError("ไม่สามารถ scan QR ของตัวเองได้");
                                        return;
                                    }
                                    handleSelectUser(found);
                                } else {
                                    setError("ไม่พบพนักงาน: " + scannedData);
                                }
                            } else {
                                setError("ไม่สามารถค้นหาพนักงานได้");
                            }
                        } catch (e: any) {
                            console.error('Search error:', e);
                            setError(e.message || "เกิดข้อผิดพลาด");
                        }
                    }}
                />
            )}
        </div>
    );
};
