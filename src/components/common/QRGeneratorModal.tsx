'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
    if (!isOpen) return null;
    const [token, setToken] = useState<QRToken | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [copied, setCopied] = useState(false);

    // Generate token on mount
    useEffect(() => {
        generateToken();
    }, [user.id]);

    const generateToken = () => {
        const newToken = Api.generateQR(user.id);
        setToken(newToken);
        setTimeLeft(300); // 5 minutes in seconds
    };

    // Timer countdown
    useEffect(() => {
        if (!timeLeft || !token) return;
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
    }, [timeLeft, token]);

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
                        <div className="p-4 bg-white rounded-xl shadow-inner border border-gray-100">
                            <QRCodeSVG
                                value={token.token}
                                size={220}
                                level={"H"}
                                includeMargin={true}
                                imageSettings={{
                                    src: "https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg",
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
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
