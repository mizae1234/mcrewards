'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Api } from '@/services/api';
import { User, QRToken } from '@/types';
import { X, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from './ui';

interface QRGeneratorModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({ user, isOpen, onClose }) => {
    const [token, setToken] = useState<QRToken | null>(null);
    const [qrImage, setQrImage] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [copied, setCopied] = useState(false);

    // Generate token on mount
    useEffect(() => {
        if (isOpen) {
            generateToken();
        }
    }, [user.id, isOpen]);

    const generateToken = async () => {
        const newToken = Api.generateQR(user.id);
        setToken(newToken);
        setTimeLeft(300); // 5 minutes in seconds

        try {
            const url = await QRCode.toDataURL(newToken.token, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            setQrImage(url);
        } catch (err) {
            console.error('Error generating QR code', err);
        }
    };

    // Timer countdown
    useEffect(() => {
        if (!timeLeft || !token || !isOpen) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, token, isOpen]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleCopy = () => {
        if (token) {
            navigator.clipboard.writeText(token.token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    // Early return AFTER all hooks
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-brand-red to-red-600 p-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-20 h-20 rounded-full border-4 border-white mx-auto shadow-md object-cover"
                    />
                    <h3 className="text-xl font-bold mt-3">{user.name}</h3>
                    <p className="text-white/80 text-sm">Scan to give points</p>
                </div>

                {/* content */}
                <div className="p-8 flex flex-col items-center space-y-6">

                    {token && timeLeft > 0 ? (
                        <div className="p-4 bg-white rounded-xl shadow-inner border border-gray-100 flex items-center justify-center">
                            <div className="bg-white p-4 relative">
                                {qrImage ? (
                                    <>
                                        <img
                                            src={qrImage}
                                            alt="QR Code"
                                            className="w-full h-auto max-w-[200px]"
                                        />
                                        {/* Logo overlay in center */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-white p-1 rounded-lg shadow-sm">
                                                <img
                                                    src="/images/logo.png"
                                                    alt="Logo"
                                                    className="w-10 h-10 object-contain"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse rounded" />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                            <div className="text-center">
                                <p className="mb-2">QR Code Expired</p>
                                <Button onClick={generateToken} variant="outline" size="sm">
                                    <RefreshCw size={16} className="mr-2" /> Regenerate
                                </Button>
                            </div>
                        </div>
                    )}

                    {timeLeft > 0 && (
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium text-gray-500">Expires in</p>
                            <p className="text-2xl font-mono font-bold text-gray-800 tracking-wider text-brand-red">
                                {formatTime(timeLeft)}
                            </p>
                        </div>
                    )}

                    <div className="w-full pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                            <span className="font-mono truncate max-w-[200px]">{token?.token}</span>
                            <button onClick={handleCopy} className="text-brand-red hover:text-red-700 font-medium flex items-center">
                                {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
