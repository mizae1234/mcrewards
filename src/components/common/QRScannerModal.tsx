'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui';
import { X, Camera, Loader2, RefreshCw } from 'lucide-react';

interface QRScannerModalProps {
    onClose: () => void;
    onSuccess: (scannedData: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose, onSuccess }) => {
    const [isStarting, setIsStarting] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isMountedRef = useRef(true);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.log('Scanner already stopped');
            }
            scannerRef.current = null;
        }
    }, []);

    const startScanner = useCallback(async () => {
        setError(null);
        setIsStarting(true);

        // Wait for DOM element to be ready
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!isMountedRef.current) return;

        const qrReaderElement = document.getElementById('qr-reader');
        if (!qrReaderElement) {
            setError('Scanner container not found');
            setIsStarting(false);
            return;
        }

        try {
            // Request camera permission first
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            stream.getTracks().forEach(track => track.stop());

            if (!isMountedRef.current) return;

            // Initialize scanner
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 200, height: 200 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // QR code scanned successfully
                    handleScanSuccess(decodedText);
                },
                () => {
                    // Ignore scan errors (no QR found in frame)
                }
            );

            if (isMountedRef.current) {
                setIsStarting(false);
            }
        } catch (err: any) {
            console.error('Scanner error:', err);
            if (isMountedRef.current) {
                if (err.name === 'NotAllowedError') {
                    setError('กรุณาอนุญาตการใช้กล้อง');
                } else if (err.name === 'NotFoundError') {
                    setError('ไม่พบกล้องในอุปกรณ์นี้');
                } else {
                    setError(err.message || 'ไม่สามารถเปิดกล้องได้');
                }
                setIsStarting(false);
            }
        }
    }, []);

    const handleScanSuccess = async (decodedText: string) => {
        // Stop scanner first
        await stopScanner();

        try {
            // Try to parse as JSON
            const data = JSON.parse(decodedText);
            if (data.employeeId || data.id || data.employeeCode) {
                onSuccess(data.employeeId || data.id || data.employeeCode);
            } else {
                // Use the whole text
                onSuccess(decodedText);
            }
        } catch {
            // Not JSON, use as-is (could be employee code directly)
            onSuccess(decodedText);
        }
    };

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    const handleRetry = () => {
        stopScanner().then(() => {
            startScanner();
        });
    };

    useEffect(() => {
        isMountedRef.current = true;
        startScanner();

        return () => {
            isMountedRef.current = false;
            stopScanner();
        };
    }, [startScanner, stopScanner]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-900">Scan QR Code</h3>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Scanner Container */}
                    <div
                        id="qr-reader"
                        className="w-full rounded-lg overflow-hidden bg-black"
                        style={{ minHeight: '280px' }}
                    />

                    {/* Status */}
                    <div className="mt-4 text-center">
                        {isStarting && !error && (
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <Loader2 size={16} className="animate-spin" />
                                กำลังเปิดกล้อง...
                            </div>
                        )}

                        {!isStarting && !error && (
                            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                <Camera size={16} />
                                ส่องกล้องไปที่ QR Code
                            </div>
                        )}

                        {error && (
                            <div className="space-y-3">
                                <p className="text-red-500 text-sm">{error}</p>
                                <Button onClick={handleRetry} variant="secondary" size="sm">
                                    <RefreshCw size={14} className="mr-1" />
                                    ลองใหม่
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Cancel Button */}
                    <Button
                        onClick={handleClose}
                        variant="secondary"
                        className="w-full mt-4"
                    >
                        ยกเลิก
                    </Button>
                </div>
            </div>
        </div>
    );
};
