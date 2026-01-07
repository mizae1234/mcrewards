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
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isStartedRef = useRef(false);
    const hasProcessedRef = useRef(false);

    const stopScanner = useCallback(async () => {
        // Stop the scanner
        if (scannerRef.current && isStartedRef.current) {
            try {
                await scannerRef.current.stop();
            } catch (err) {
                console.log('Scanner stop error (ignorable):', err);
            }
            try {
                scannerRef.current.clear();
            } catch (err) {
                console.log('Scanner clear error (ignorable):', err);
            }
            isStartedRef.current = false;
        }
        scannerRef.current = null;

        // Also stop all video tracks to fully close camera
        try {
            const videos = document.querySelectorAll('#qr-reader video');
            videos.forEach((video) => {
                const mediaStream = (video as HTMLVideoElement).srcObject as MediaStream;
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => {
                        track.stop();
                    });
                }
                (video as HTMLVideoElement).srcObject = null;
            });
        } catch (err) {
            console.log('Video track stop error (ignorable):', err);
        }
    }, []);

    const handleScanSuccess = useCallback(async (decodedText: string) => {
        // Prevent double processing
        if (hasProcessedRef.current) return;
        hasProcessedRef.current = true;

        console.log('QR Scanned:', decodedText);
        setScannedResult(decodedText);

        // Stop scanner first
        await stopScanner();

        // Small delay then call success
        setTimeout(() => {
            try {
                // Try to parse as JSON
                const data = JSON.parse(decodedText);
                const result = data.employeeId || data.id || data.employeeCode || decodedText;
                console.log('Parsed result:', result);
                onSuccess(result);
            } catch {
                // Not JSON, use as-is (could be employee code directly)
                console.log('Using raw result:', decodedText);
                onSuccess(decodedText);
            }
        }, 100);
    }, [onSuccess, stopScanner]);

    const startScanner = useCallback(async () => {
        // Prevent double start
        if (isStartedRef.current || scannerRef.current) {
            console.log('Scanner already started, skipping');
            return;
        }

        setError(null);
        setIsStarting(true);
        hasProcessedRef.current = false;

        // Wait for DOM element to be ready
        await new Promise(resolve => setTimeout(resolve, 300));

        const qrReaderElement = document.getElementById('qr-reader');
        if (!qrReaderElement) {
            setError('Scanner container not found');
            setIsStarting(false);
            return;
        }

        // Clear any existing content first
        qrReaderElement.innerHTML = '';

        try {
            // Request camera permission first
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            stream.getTracks().forEach(track => track.stop());

            // Create new scanner instance
            const scanner = new Html5Qrcode('qr-reader', { verbose: false });
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 200, height: 200 },
                    aspectRatio: 1.0,
                    disableFlip: true,
                },
                (decodedText) => {
                    handleScanSuccess(decodedText);
                },
                () => {
                    // Ignore - no QR found in this frame
                }
            );

            // Force single video - remove duplicate if exists
            const videos = qrReaderElement.querySelectorAll('video');
            if (videos.length > 1) {
                for (let i = 1; i < videos.length; i++) {
                    videos[i].remove();
                }
            }

            isStartedRef.current = true;
            setIsStarting(false);
        } catch (err: any) {
            console.error('Scanner error:', err);
            if (err.name === 'NotAllowedError') {
                setError('กรุณาอนุญาตการใช้กล้อง');
            } else if (err.name === 'NotFoundError') {
                setError('ไม่พบกล้องในอุปกรณ์นี้');
            } else {
                setError(err.message || 'ไม่สามารถเปิดกล้องได้');
            }
            setIsStarting(false);
        }
    }, [handleScanSuccess]);

    const handleClose = useCallback(async () => {
        await stopScanner();
        onClose();
    }, [onClose, stopScanner]);

    const handleRetry = useCallback(() => {
        isStartedRef.current = false;
        hasProcessedRef.current = false;
        scannerRef.current = null;
        const qrReaderElement = document.getElementById('qr-reader');
        if (qrReaderElement) qrReaderElement.innerHTML = '';
        startScanner();
    }, [startScanner]);

    useEffect(() => {
        // Start scanner on mount
        startScanner();

        return () => {
            // Cleanup on unmount
            stopScanner();
        };
    }, []); // Empty deps - only run once on mount

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

                        {!isStarting && !error && !scannedResult && (
                            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                <Camera size={16} />
                                ส่องกล้องไปที่ QR Code
                            </div>
                        )}

                        {scannedResult && (
                            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                                <Loader2 size={16} className="animate-spin" />
                                กำลังค้นหาพนักงาน...
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
