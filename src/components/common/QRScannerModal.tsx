'use client';

import React from 'react';
import { User } from '@/types';
import { Button } from './ui';

interface QRScannerModalProps {
    giver: User;
    onClose: () => void;
    onSuccess: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ giver, onClose, onSuccess }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                <div className="p-8 text-center">
                    <h3 className="text-lg font-bold mb-2">Scanner Temporarily Disabled</h3>
                    <p className="text-gray-500 mb-4">We are updating the scanner for system compatibility.</p>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};
