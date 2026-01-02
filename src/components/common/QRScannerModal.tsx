'use client';

import React, { useState } from 'react';
import QrReader from 'react-qr-scanner';
import { Api } from '@/services/api';
import { User } from '@/types';
import { X, Camera, Keyboard, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Input, Label } from './ui';

interface QRScannerModalProps {
    giver: User;
    onClose: () => void;
    onSuccess: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ giver, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'camera' | 'manual'>('camera');
    const [scannedToken, setScannedToken] = useState<string | null>(null);
    const [amount, setAmount] = useState<number>(50);
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'scan' | 'confirm' | 'success'>('scan');
    const [recipient, setRecipient] = useState<User | null>(null);

    const handleScan = (data: any) => {
        if (data && step === 'scan') {
            const tokenStr = data?.text || data; // depending on library version
            validateToken(tokenStr);
        }
    };

    const handleError = (err: any) => {
        console.error(err);
        // Don't show error to user immediately on camera error as it might just be initializing
    };

    const validateToken = (tokenStr: string) => {
        try {
            // Parse token locally first to avoid unnecessary API calls
            // userId.nonce.expiresAt.signature
            const parts = tokenStr.split('.');
            if (parts.length !== 4) throw new Error("Invalid QR Code format");

            const userId = parts[0];
            const user = Api.getUser(userId);

            if (!user) throw new Error("User not found");
            if (user.id === giver.id) throw new Error("You cannot scan your own code");

            setRecipient(user);
            setScannedToken(tokenStr);
            setStep('confirm');
            setError(null);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scannedToken) return;

        try {
            Api.verifyQR(scannedToken, giver.id, amount, message);
            setStep('success');
        } catch (e: any) {
            setError(e.message);
        }
    };

    const renderScanStep = () => (
        <div className="space-y-4">
            <div className="flex justify-center space-x-4 mb-4">
                <button
                    onClick={() => setMode('camera')}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${mode === 'camera' ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    <Camera size={16} className="mr-2" /> Camera
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    <Keyboard size={16} className="mr-2" /> Manual Code
                </button>
            </div>

            <div className="bg-black rounded-xl overflow-hidden relative min-h-[300px] flex items-center justify-center">
                {mode === 'camera' ? (
                    <div className="w-full h-full relative">
                        <QrReader
                            delay={300}
                            onError={handleError}
                            onScan={handleScan}
                            style={{ width: '100%', height: '100%' }}
                            constraints={{ video: { facingMode: 'environment' } }}
                        />
                        <div className="absolute inset-0 border-2 border-white/30 pointer-events-none flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-brand-red rounded-lg animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <div className="bg-white w-full h-full p-8 flex flex-col justify-center">
                        <Label className="mb-2">Enter Token Code</Label>
                        <div className="flex space-x-2">
                            <Input
                                placeholder="e.g. u1.xyz.123.sig"
                                onChange={(e) => setError(null)}
                                onBlur={(e) => validateToken(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>
            {error && (
                <div className="flex items-center p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    <AlertCircle size={16} className="mr-2 shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );

    const renderConfirmStep = () => (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl">
                <img src={recipient?.avatar} alt={recipient?.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                    <p className="text-sm text-gray-500">Sending to</p>
                    <h4 className="font-bold text-gray-900">{recipient?.name}</h4>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <Label>Points Amount</Label>
                    <Input
                        type="number"
                        min={1}
                        max={giver.quotaRemaining}
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="text-lg font-bold"
                    />
                    <p className="text-xs text-gray-500 mt-1">Available Quota: {giver.quotaRemaining}</p>
                </div>
                <div>
                    <Label>Message (Optional)</Label>
                    <Input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Great job today!"
                    />
                </div>
            </div>

            <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setStep('scan'); setScannedToken(null); }}>
                    Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-brand-red hover:bg-red-700 text-white">
                    Send Points
                </Button>
            </div>
            {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
            )}
        </form>
    );

    const renderSuccessStep = () => (
        <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Points Sent!</h3>
            <p className="text-gray-500">You successfully sent {amount} points to {recipient?.name}.</p>
            <Button onClick={() => { onSuccess(); onClose(); }} className="w-full mt-4">
                Done
            </Button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Scan to Give</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {step === 'scan' && renderScanStep()}
                    {step === 'confirm' && renderConfirmStep()}
                    {step === 'success' && renderSuccessStep()}
                </div>
            </div>
        </div>
    );
};
