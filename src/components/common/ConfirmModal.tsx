'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, Trash2, CheckCircle, Info, X } from 'lucide-react';
import { Button } from './ui';

// Types
type ConfirmVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmOptions {
    title: string;
    message: string;
    variant?: ConfirmVariant;
    confirmText?: string;
    cancelText?: string;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// Context
const ConfirmContext = createContext<ConfirmContextType | null>(null);

// Hook to use confirm
export const useConfirm = (): ConfirmContextType => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

// Variant configurations
const variantConfig: Record<ConfirmVariant, {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    confirmButtonClass: string;
}> = {
    danger: {
        icon: <Trash2 size={24} />,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    },
    warning: {
        icon: <AlertTriangle size={24} />,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    },
    success: {
        icon: <CheckCircle size={24} />,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        confirmButtonClass: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    },
    info: {
        icon: <Info size={24} />,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    },
};

// Modal Component
const ConfirmModal: React.FC<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ isOpen, options, onConfirm, onCancel }) => {
    if (!isOpen || !options) return null;

    const variant = options.variant || 'danger';
    const config = variantConfig[variant];

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Content */}
                    <div className="p-6">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className={`w-14 h-14 rounded-full ${config.iconBg} ${config.iconColor} flex items-center justify-center`}>
                                {config.icon}
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            {options.title}
                        </h3>

                        {/* Message */}
                        <p className="text-gray-600 text-center mb-6">
                            {options.message}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                            >
                                {options.cancelText || 'Cancel'}
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`flex-1 px-4 py-2.5 font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.confirmButtonClass}`}
                            >
                                {options.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Provider Component
export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setOptions(opts);
            setResolvePromise(() => resolve);
            setIsOpen(true);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setIsOpen(false);
        resolvePromise?.(true);
    }, [resolvePromise]);

    const handleCancel = useCallback(() => {
        setIsOpen(false);
        resolvePromise?.(false);
    }, [resolvePromise]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <ConfirmModal
                isOpen={isOpen}
                options={options}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
};

export default ConfirmModal;
