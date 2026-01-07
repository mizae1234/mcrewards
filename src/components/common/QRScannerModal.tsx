'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui';
import { X, Camera, Loader2 } from 'lucide-react';

interface QRScannerModalProps {
    onClose: () => void;
    onSuccess: (scannedData: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose, onSuccess }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        return () => {
            // Cleanup scanner on unmount
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    const startScanner = async () => {
        setError(null);
        setIsScanning(true);

        try {
            // Check camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setHasPermission(true);

            // Initialize scanner
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // QR code scanned successfully
                    handleScanSuccess(decodedText);
                },
                () => {
                    // Ignore scan errors (no QR found in frame)
                }
            );
        } catch (err: any) {
            console.error('Scanner error:', err);
            setHasPermission(false);
            setError(err.message || 'Unable to access camera. Please grant permission.');
            setIsScanning(false);
        }
    };

    const handleScanSuccess = async (decodedText: string) => {
        // Stop scanner
        if (scannerRef.current) {
            await scannerRef.current.stop();
        }

        try {
            // Parse QR data - expected format: JSON with employee info
            const data = JSON.parse(decodedText);
            if (data.employeeId || data.id) {
                onSuccess(data.employeeId || data.id);
            } else {
                setError('Invalid QR code format');
                setIsScanning(false);
            }
        } catch {
            // Maybe it's just an employee ID string
            if (decodedText.length > 0) {
                onSuccess(decodedText);
            } else {
                setError('Invalid QR code');
                setIsScanning(false);
            }
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch { }
        }
        setIsScanning(false);
    };

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
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
                <div className="p-6" ref={containerRef}>
                    {!isScanning ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <Camera size={40} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="text-gray-600 mb-4">
                                    Point your camera at a colleague's QR code to give them points.
                                </p>
                                {error && (
                                    <p className="text-red-500 text-sm mb-4">{error}</p>
                                )}
                            </div>
                            <Button onClick={startScanner} className="w-full">
                                <Camera size={18} className="mr-2" />
                                Start Camera
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div
                                id="qr-reader"
                                className="w-full rounded-lg overflow-hidden"
                                style={{ minHeight: '300px' }}
                            />
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <Loader2 size={16} className="animate-spin" />
                                Scanning...
                            </div>
                            <Button
                                onClick={stopScanner}
                                variant="secondary"
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
